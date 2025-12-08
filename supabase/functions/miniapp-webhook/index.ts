import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different types of events 
    switch (event.type) {
      case 'miniapp.added':
        console.log(`Mini app added by user FID: ${event.data?.fid}`);
        
        // Store notification token if provided
        if (event.data?.notificationDetails?.token && event.data?.fid) {
          const { error: insertError } = await supabase
            .from('farcaster_notifications')
            .upsert({
              fid: event.data.fid,
              notification_token: event.data.notificationDetails.token,
              url: event.data.notificationDetails.url || null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'fid'
            });

          if (insertError) {
            console.error('Error storing notification token:', insertError);
          } else {
            console.log(`Notification token stored for FID: ${event.data.fid}`);
          }
        }
        break;
      
      case 'miniapp.removed':
        console.log(`Mini app removed by user FID: ${event.data?.fid}`);
        
        // Remove notification token from database
        if (event.data?.fid) {
          const { error: deleteError } = await supabase
            .from('farcaster_notifications')
            .delete()
            .eq('fid', event.data.fid);

          if (deleteError) {
            console.error('Error removing notification token:', deleteError);
          } else {
            console.log(`Notification token removed for FID: ${event.data.fid}`);
          }
        }
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
