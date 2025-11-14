import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NEYNAR_API_KEY = Deno.env.get('NEYNAR_API_KEY');
    const SIGNER_UUID = '9a1b341b-75fe-4d4e-aa70-f0c2e0a0e3ff';
    const BOT_FID = 1474927;

    if (!NEYNAR_API_KEY) {
      throw new Error('NEYNAR_API_KEY not configured');
    }

    console.log('Received webhook request');
    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle Neynar webhook events
    if (payload.type === 'cast.created') {
      const cast = payload.data;
      
      // Check if bot is mentioned
      const isMentioned = cast.mentioned_profiles?.some(
        (profile: any) => profile.fid === BOT_FID
      );

      if (!isMentioned) {
        console.log('Bot not mentioned, ignoring cast');
        return new Response(JSON.stringify({ success: true, message: 'Not mentioned' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Bot mentioned! Processing cast:', cast.hash);

      // Extract the text and remove the mention
      let userMessage = cast.text || '';
      // Remove @uniquehub mention from the text
      userMessage = userMessage.replace(/@uniquehub/gi, '').trim();

      if (!userMessage) {
        userMessage = 'Hello!';
      }

      console.log('User message:', userMessage);

      // Get AI response from uniqbot-chat
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      console.log('Calling uniqbot-chat...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('uniqbot-chat', {
        body: { message: userMessage }
      });

      if (aiError) {
        console.error('Error getting AI response:', aiError);
        throw aiError;
      }

      const responseText = aiResponse?.response || 'Sorry, I encountered an error generating a response.';
      console.log('AI response:', responseText);

      // Post reply using Neynar API
      console.log('Posting reply to Farcaster...');
      const postResponse = await fetch('https://api.neynar.com/v2/farcaster/cast', {
        method: 'POST',
        headers: {
          'api_key': NEYNAR_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signer_uuid: SIGNER_UUID,
          text: responseText,
          parent: cast.hash, // Reply to the original cast
        }),
      });

      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        console.error('Neynar API error:', postResponse.status, errorText);
        throw new Error(`Failed to post cast: ${errorText}`);
      }

      const postData = await postResponse.json();
      console.log('Successfully posted reply:', postData);

      return new Response(JSON.stringify({ 
        success: true, 
        cast_hash: postData.cast?.hash 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other webhook types, just acknowledge
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in farcaster-mention-handler:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
