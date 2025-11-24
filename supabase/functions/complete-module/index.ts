import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { moduleId, courseId, pointsEarned } = await req.json();

    console.log(`Processing module completion for user ${user.id}, module ${moduleId}`);

    // Check if module already completed
    const { data: existingCompletion } = await supabase
      .from('module_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single();

    if (existingCompletion) {
      return new Response(
        JSON.stringify({ success: false, message: 'Module already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Record module completion
    const { error: completionError } = await supabase
      .from('module_completions')
      .insert({
        user_id: user.id,
        module_id: moduleId,
        course_id: courseId,
        points_earned: pointsEarned,
      });

    if (completionError) {
      console.error('Error recording completion:', completionError);
      throw completionError;
    }

    // Get or create user learning streak
    let { data: userStreak } = await supabase
      .from('user_learning_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    let updates: any = {
      total_modules_completed: (userStreak?.total_modules_completed || 0) + 1,
      updated_at: now.toISOString(),
    };

    if (!userStreak) {
      // First module completion - create new streak
      console.log('Creating new streak for user');
      updates = {
        ...updates,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      };

      const { error: insertError } = await supabase
        .from('user_learning_streaks')
        .insert({
          user_id: user.id,
          ...updates,
        });

      if (insertError) {
        console.error('Error creating streak:', insertError);
        throw insertError;
      }

      userStreak = { ...updates, user_id: user.id } as any;
    } else {
      // Update existing streak
      const lastActivityDate = userStreak.last_activity_date;
      
      if (lastActivityDate === today) {
        // Same day - don't increment streak but count the module
        console.log('Same day activity - maintaining streak');
        updates.last_activity_date = today;
      } else if (lastActivityDate) {
        // Calculate days difference
        const lastDate = new Date(lastActivityDate);
        const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Days since last activity: ${daysDiff}`);

        if (daysDiff === 1) {
          // Consecutive day - increment streak
          updates.current_streak = (userStreak.current_streak || 0) + 1;
          console.log(`Consecutive day! New streak: ${updates.current_streak}`);
        } else if (daysDiff > 1) {
          // Missed days - reset streak
          updates.current_streak = 1;
          updates.streak_reset_count = (userStreak.streak_reset_count || 0) + 1;
          console.log(`Streak reset after ${daysDiff} days of inactivity`);
        }
        
        updates.last_activity_date = today;
      } else {
        // No previous activity date - set to today and streak to 1
        updates.current_streak = 1;
        updates.last_activity_date = today;
      }

      // Update longest streak if current exceeds it
      const currentStreak = updates.current_streak ?? userStreak.current_streak ?? 0;
      if (currentStreak > (userStreak.longest_streak || 0)) {
        updates.longest_streak = currentStreak;
        console.log(`New longest streak: ${updates.longest_streak}`);
      }

      const { error: updateError } = await supabase
        .from('user_learning_streaks')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating streak:', updateError);
        throw updateError;
      }
    }

    // Award points to user_points table
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userPoints) {
      // Update existing points
      const { error: pointsUpdateError } = await supabase
        .from('user_points')
        .update({
          total_points: userPoints.total_points + pointsEarned,
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id);

      if (pointsUpdateError) {
        console.error('Error updating user points:', pointsUpdateError);
        throw pointsUpdateError;
      }
    } else {
      // Create new points record
      const { error: pointsInsertError } = await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: pointsEarned,
        });

      if (pointsInsertError) {
        console.error('Error creating user points:', pointsInsertError);
        throw pointsInsertError;
      }
    }

    // Record point event
    const { error: eventError } = await supabase
      .from('point_events')
      .insert({
        user_id: user.id,
        event_type: 'course_completion',
        points_earned: pointsEarned,
      });

    if (eventError) {
      console.error('Error recording point event:', eventError);
      throw eventError;
    }

    // Fetch updated streak data
    const { data: updatedStreak } = await supabase
      .from('user_learning_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('Module completion successful:', {
      currentStreak: updatedStreak?.current_streak,
      totalModules: updatedStreak?.total_modules_completed,
      pointsAwarded: pointsEarned,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pointsEarned,
        streak: updatedStreak,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error completing module:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
