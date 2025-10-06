import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Processes user check-ins (daily, weekly, monthly) and awards UP points
 * Tracks streaks and prevents duplicate check-ins
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

    // Create user points record if it doesn't exist
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

    // Check daily check-in
    const lastDaily = userPoints.last_daily_checkin ? new Date(userPoints.last_daily_checkin) : null;
    const daysSinceDaily = lastDaily ? Math.floor((now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    let canClaimDaily = false;
    if (daysSinceDaily >= 1) {
      const dailyPoints = 10;
      totalPointsAwarded += dailyPoints;
      updates.last_daily_checkin = now.toISOString();
      
      // Update streak - only increment if exactly 1 day passed (consecutive)
      if (daysSinceDaily === 1) {
        updates.daily_streak = (userPoints.daily_streak || 0) + 1;
      } else {
        updates.daily_streak = 1; // Reset streak if missed days
      }

      pointEvents.push({
        user_id: user.id,
        event_type: 'daily_checkin',
        points_earned: dailyPoints,
      });
      canClaimDaily = true;
    }

    // Check weekly check-in - requires 7 consecutive daily check-ins
    const currentDailyStreak = updates.daily_streak !== undefined ? updates.daily_streak : (userPoints.daily_streak || 0);
    const lastWeekly = userPoints.last_weekly_checkin ? new Date(userPoints.last_weekly_checkin) : null;
    const daysSinceWeekly = lastWeekly ? Math.floor((now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    let canClaimWeekly = false;
    if (currentDailyStreak >= 7 && daysSinceWeekly >= 7) {
      const weeklyPoints = 100;
      totalPointsAwarded += weeklyPoints;
      updates.last_weekly_checkin = now.toISOString();
      
      // Update weekly streak
      if (daysSinceWeekly >= 7 && daysSinceWeekly < 14) {
        updates.weekly_streak = (userPoints.weekly_streak || 0) + 1;
      } else {
        updates.weekly_streak = 1;
      }

      pointEvents.push({
        user_id: user.id,
        event_type: 'weekly_checkin',
        points_earned: weeklyPoints,
      });
      canClaimWeekly = true;
    }

    // Check monthly check-in - requires 30 consecutive daily check-ins
    const lastMonthly = userPoints.last_monthly_checkin ? new Date(userPoints.last_monthly_checkin) : null;
    const monthsSinceMonthly = lastMonthly 
      ? (now.getFullYear() - lastMonthly.getFullYear()) * 12 + (now.getMonth() - lastMonthly.getMonth())
      : 999;
    
    let canClaimMonthly = false;
    if (currentDailyStreak >= 30 && monthsSinceMonthly >= 1) {
      const monthlyPoints = 500;
      totalPointsAwarded += monthlyPoints;
      updates.last_monthly_checkin = now.toISOString();
      
      // Update monthly streak
      if (monthsSinceMonthly === 1) {
        updates.monthly_streak = (userPoints.monthly_streak || 0) + 1;
      } else {
        updates.monthly_streak = 1;
      }

      pointEvents.push({
        user_id: user.id,
        event_type: 'monthly_checkin',
        points_earned: monthlyPoints,
      });
      canClaimMonthly = true;
    }

    if (totalPointsAwarded === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No new check-ins available yet',
          userPoints,
          canClaim: {
            daily: false,
            weekly: currentDailyStreak >= 7,
            monthly: currentDailyStreak >= 30,
          },
          progress: {
            daily: 0,
            weekly: Math.min((currentDailyStreak / 7) * 100, 100),
            monthly: Math.min((currentDailyStreak / 30) * 100, 100),
          }
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

    const finalDailyStreak = updates.daily_streak || userPoints.daily_streak || 0;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Check-in successful! You earned ${totalPointsAwarded} UP!`,
        pointsAwarded: totalPointsAwarded,
        totalPoints: updates.total_points,
        streaks: {
          daily: finalDailyStreak,
          weekly: updates.weekly_streak || userPoints.weekly_streak || 0,
          monthly: updates.monthly_streak || userPoints.monthly_streak || 0,
        },
        checkIns: pointEvents.map(e => e.event_type),
        canClaim: {
          daily: canClaimDaily,
          weekly: canClaimWeekly,
          monthly: canClaimMonthly,
        },
        progress: {
          daily: canClaimDaily ? 100 : 0,
          weekly: Math.min((finalDailyStreak / 7) * 100, 100),
          monthly: Math.min((finalDailyStreak / 30) * 100, 100),
        }
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