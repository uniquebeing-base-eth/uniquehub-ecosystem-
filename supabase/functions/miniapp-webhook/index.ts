import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event = await req.json();
    console.log('Received mini app webhook event:', JSON.stringify(event, null, 2));

    // Handle different event types
    switch (event.type) {
      case 'miniapp.added':
        console.log(`Mini app added by user FID: ${event.data?.fid}`);
        // Store notification token if provided
        if (event.data?.notificationDetails?.token) {
          console.log(`Notification token received: ${event.data.notificationDetails.token}`);
          // TODO: Store this token in database for future notifications
        }
        break;
      
      case 'miniapp.removed':
        console.log(`Mini app removed by user FID: ${event.data?.fid}`);
        // TODO: Remove notification token from database
        break;
      
      default:
        console.log(`Unknown event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, received: event.type }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
