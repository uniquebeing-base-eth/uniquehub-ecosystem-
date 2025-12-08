import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_ids } = await req.json();

    console.log(`Recalculating points for users:`, user_ids);

    const results = [];

    for (const userId of user_ids) {
      // Get all point events for this user...
      const { data: pointEvents, error: eventsError } = await supabase
        .from('point_events')
        .select('points_earned, event_type')
        .eq('user_id', userId);

      if (eventsError) {
        console.error(`Error fetching point events for user ${userId}:`, eventsError);
        continue;
      }

      // Calculate total from ALL the point events
      const totalPoints = pointEvents?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;

      console.log(`User ${userId}: Found ${pointEvents?.length} point events, total: ${totalPoints}`);

      // Update the user_points table with accurate total
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ 
          total_points: totalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating points for user ${userId}:`, updateError);
        results.push({ user_id: userId, success: false, error: updateError.message });
      } else {
        console.log(`Successfully updated user ${userId} to ${totalPoints} points`);
        results.push({ user_id: userId, success: true, total_points: totalPoints });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in recalculate-user-points function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
