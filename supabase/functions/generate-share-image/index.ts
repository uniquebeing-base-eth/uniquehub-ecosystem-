import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, subtitle, username, avatar } = await req.json();
    
    // Use Lovable AI Gateway to generate share image with template
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create prompt based on section type
    let prompt = '';
    if (type === 'course') {
      prompt = `Create a 1200x800 PNG share preview image for a course. Professional anime-style design with blue gradient background. Large text showing "${title}" in the center. Small text at bottom showing "Shared by @${username}". Include UniqueHub branding and blue cube logo. Modern, clean layout optimized for social sharing.`;
    } else if (type === 'certificate') {
      prompt = `Create a 1200x800 PNG share preview image for a course completion certificate. Elegant anime-style design with blue gradient background. Large text showing "${title}" certificate. Display "@${username}" prominently. Include UniqueHub blue cube logo. Professional achievement showcase design.`;
    } else if (type === 'nft') {
      prompt = `Create a 1200x800 PNG share preview image for an NFT listing. Vibrant anime-style design with blue/purple gradient. Large text showing "${title}". Small text showing "Shared by @${username}". Include UniqueHub branding. Eye-catching marketplace preview.`;
    } else if (type === 'marketplace') {
      prompt = `Create a 1200x800 PNG share preview image for a marketplace item. Dynamic anime-style design with colorful gradient. Large text showing "${title}". Display "@${username}" as seller. Include UniqueHub blue cube logo. Attractive product showcase.`;
    } else {
      prompt = `Create a 1200x800 PNG share preview image with anime-style blue gradient background. Large text: "${title}". Subtitle: "${subtitle || 'UniqueHub'}". Show "@${username}". Include blue cube logo. Professional social sharing design.`;
    }

    console.log('Generating share image with prompt:', prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('Failed to generate share image');
    }

    console.log('Successfully generated share image');

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating share image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
