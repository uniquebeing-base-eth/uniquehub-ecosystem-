import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a Farcaster cast to share activities
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signerUuid, text, embeds } = await req.json();
    
    if (!signerUuid || !text) {
      throw new Error('signerUuid and text are required');
    }

    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY');
    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }

    console.log(`Creating cast: ${text}`);

    // Create a cast using Neynar API
    const castResponse = await fetch(
      'https://api.neynar.com/v2/farcaster/cast',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          text,
          embeds: embeds || [],
        }),
      }
    );

    if (!castResponse.ok) {
      const errorData = await castResponse.text();
      throw new Error(`Failed to create cast: ${castResponse.statusText} - ${errorData}`);
    }

    const castData = await castResponse.json();

    console.log(`Cast created successfully:`, castData);

    return new Response(
      JSON.stringify({ 
        success: true,
        cast: castData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in share-to-farcaster function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
