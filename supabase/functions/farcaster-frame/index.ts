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
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || 'UniqueHub';
    const description = url.searchParams.get('description') || 'Learn, Trade, Earn on Base';
    const imageUrl = url.searchParams.get('image') || 'https://uniqueehub.vercel.app/opengraph-image.png';
    const deepLink = url.searchParams.get('url') || '';
    
    // Use deep link if provided, otherwise main app URL
    const miniAppUrl = deepLink || 'https://uniqueehub.vercel.app';

    // Create the Mini App Embed JSON according to Farcaster spec
    const miniAppEmbed = {
      version: "1",
      imageUrl: imageUrl,
      button: {
        title: "Launch UniqueHub",
        action: {
          type: "launch_miniapp",
          name: "UniqueHub",
          url: miniAppUrl,
          splashImageUrl: "https://uniqueehub.vercel.app/icon.png",
          splashBackgroundColor: "#1a4d8f"
        }
      }
    };

    // Generate HTML with proper meta tags
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${miniAppUrl}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${miniAppUrl}">
    <meta property="og:site_name" content="UniqueHub">
    <meta property="og:type" content="website">
    
    <!-- Farcaster Mini App Embed -->
    <meta name="fc:miniapp" content='${JSON.stringify(miniAppEmbed)}'>
    <!-- For backward compatibility -->
    <meta name="fc:frame" content='${JSON.stringify(miniAppEmbed)}'>
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
    <a href="${miniAppUrl}">Open UniqueHub</a>
    <script>
      // Auto-redirect to the Mini App URL when launched
      window.onload = function () {
        try { window.location.replace('${miniAppUrl}'); }
        catch (e) { window.location.href = '${miniAppUrl}'; }
      };
    </script>
  </body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating frame:', error);
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
