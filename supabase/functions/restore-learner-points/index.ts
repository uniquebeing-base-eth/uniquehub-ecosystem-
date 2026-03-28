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

    console.log('Starting comprehensive restoration of user points...');

    // Get ALL users from user_points table
    const { data: allUsers, error: fetchError } = await supabase
      .from('user_points')
      .select('user_id, total_points, creator_points');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${allUsers?.length || 0} users to check`);

    const restoredUsers = [];

    for (const user of allUsers || []) {
      // Calculate correct total_points from ALL point_events
      const { data: pointEvents, error: eventsError } = await supabase
        .from('point_events')
        .select('points_earned')
        .eq('user_id', user.user_id);

      if (eventsError) {
        console.error(`Error fetching point events for ${user.user_id}:`, eventsError);
        continue;
      }

      const correctTotalPoints = pointEvents?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;

      // Calculate correct creator_points from courses, enrollments, ratings
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('status', 'published');

      let correctCreatorPoints = 0;

      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        
        // 100 points per enrollment
        const { count: enrollmentCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds);
        correctCreatorPoints += (enrollmentCount || 0) * 100;

        // 10 points per like/rating
        const { count: ratingCount } = await supabase
          .from('course_ratings')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds);
        correctCreatorPoints += (ratingCount || 0) * 10;
      }

      // Only update if values are wrong
      const needsUpdate = 
        (correctTotalPoints > 0 && user.total_points !== correctTotalPoints) ||
        (correctCreatorPoints > 0 && (user.creator_points || 0) !== correctCreatorPoints);

      if (needsUpdate) {
        const updates: Record<string, any> = {};
        if (correctTotalPoints > 0 && user.total_points !== correctTotalPoints) {
          updates.total_points = correctTotalPoints;
        }
        if (correctCreatorPoints > 0 && (user.creator_points || 0) !== correctCreatorPoints) {
          updates.creator_points = correctCreatorPoints;
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('user_points')
            .update(updates)
            .eq('user_id', user.user_id);

          if (updateError) {
            console.error(`Error updating ${user.user_id}:`, updateError);
          } else {
            console.log(`Restored user ${user.user_id}: total_points=${updates.total_points ?? user.total_points}, creator_points=${updates.creator_points ?? user.creator_points}`);
            restoredUsers.push({ 
              user_id: user.user_id, 
              old_total: user.total_points,
              new_total: updates.total_points ?? user.total_points,
              old_creator: user.creator_points,
              new_creator: updates.creator_points ?? user.creator_points,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Restored points for ${restoredUsers.length} users out of ${allUsers?.length || 0} checked`,
        restored_users: restoredUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in restore-learner-points function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
