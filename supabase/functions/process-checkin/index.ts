import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Processes user check-ins (daily, weekly, monthly) and awards UP points
 * Tracks streaks and prevents any duplicate check-ins
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log(`Processing check-in for user ${user.id}`);

    // Get or create user points record
    let { data: userPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to fetch user points: ${fetchError.message}`);
    }

    // Create user points to record if it doesn't exist
    if (!userPoints) {
      const { data: newPoints, error: createError } = await supabase
        .from('user_points')
        .insert({ user_id: user.id, total_points: 0 })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user points: ${createError.message}`);
      }
      userPoints = newPoints;
    }

    const now = new Date();
    const updates: any = {};
    const pointEvents = [];
    let totalPointsAwarded = 0;

    // Check daily check-in (6-day cycle)
    const lastDaily = userPoints.last_daily_checkin ? new Date(userPoints.last_daily_checkin) : null;
    const daysSinceDaily = lastDaily ? Math.floor((now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    let canClaimDaily = false;
    let currentDay = userPoints.daily_streak || 0; // Using daily_streak to track day in cycle (0-5)
    
    if (daysSinceDaily >= 1) {
      // Increment to next day in cycle
      currentDay = (currentDay % 6) + 1; // 1-6
      
      // Award points based on day
      let dailyPoints = 100;
      if (currentDay === 6) {
        // Mystery box: random 200-1000 UP
        dailyPoints = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
      }
      
      totalPointsAwarded += dailyPoints;
      updates.last_daily_checkin = now.toISOString();
      updates.daily_streak = currentDay;

      pointEvents.push({
        user_id: user.id,
        event_type: 'daily_checkin',
        points_earned: dailyPoints,
      });
      canClaimDaily = true;
    }

    const finalDay = updates.daily_streak !== undefined ? updates.daily_streak : currentDay;

    if (totalPointsAwarded === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Already checked in today',
          currentDay: finalDay,
          totalPoints: userPoints.total_points || 0,
          canClaim: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update total points
    updates.total_points = (userPoints.total_points || 0) + totalPointsAwarded;

    // Save all updates
    const { error: updateError } = await supabase
      .from('user_points')
      .update(updates)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update points: ${updateError.message}`);
    }

    // Insert point events
    if (pointEvents.length > 0) {
      const { error: eventsError } = await supabase
        .from('point_events')
        .insert(pointEvents);

      if (eventsError) {
        console.error('Failed to insert point events:', eventsError);
      }
    }

    console.log(`Awarded ${totalPointsAwarded} UP to user ${user.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: finalDay === 6 
          ? `🎉 Mystery Box! You earned ${totalPointsAwarded} UP!` 
          : `Check-in successful! You earned ${totalPointsAwarded} UP!`,
        pointsAwarded: totalPointsAwarded,
        totalPoints: updates.total_points,
        currentDay: finalDay,
        isMysteryBox: finalDay === 6,
        canClaim: canClaimDaily,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-checkin function:', error);
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
