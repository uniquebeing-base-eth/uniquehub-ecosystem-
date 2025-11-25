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

    console.log('Starting restoration of learner points for affected users...');

    // Find all users where total_points = 0 but creator_points > 0 (affected by bug)
    const { data: affectedUsers, error: fetchError } = await supabase
      .from('user_points')
      .select('user_id')
      .eq('total_points', 0)
      .gt('creator_points', 0);

    if (fetchError) {
      console.error('Error fetching affected users:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${affectedUsers?.length || 0} affected users`);

    const restoredUsers = [];

    // For each affected user, calculate their correct learner points from module completions
    for (const user of affectedUsers || []) {
      const { data: completions, error: completionsError } = await supabase
        .from('module_completions')
        .select('points_earned')
        .eq('user_id', user.user_id);

      if (completionsError) {
        console.error(`Error fetching completions for user ${user.user_id}:`, completionsError);
        continue;
      }

      // Calculate total points from module completions
      const totalPoints = completions?.reduce((sum, c) => sum + (c.points_earned || 10), 0) || 0;

      if (totalPoints > 0) {
        // Restore the learner points
        const { error: updateError } = await supabase
          .from('user_points')
          .update({ total_points: totalPoints })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.error(`Error updating points for user ${user.user_id}:`, updateError);
        } else {
          console.log(`Restored ${totalPoints} learner points for user ${user.user_id}`);
          restoredUsers.push({ user_id: user.user_id, restored_points: totalPoints });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully restored learner points for ${restoredUsers.length} users`,
        restored_users: restoredUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in restore-learner-points function:', error);
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
