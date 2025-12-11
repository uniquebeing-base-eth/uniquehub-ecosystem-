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
    console.log('Starting daily reminder notification job...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY') ?? '';
    
    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current date boundaries (UTC)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    console.log(`Checking for users who haven't checked in today (since ${todayStart.toISOString()})`);
    
    // Get all users with notification tokens who have an active streak but haven't checked in today
    // Join farcaster_notifications with profiles to get FIDs, then with user_points to check streaks
    const { data: notifications, error: notifError } = await supabase
      .from('farcaster_notifications')
      .select('fid, notification_token, url');
    
    if (notifError) {
      console.error('Error fetching notification tokens:', notifError);
      throw notifError;
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('No users with notification tokens found');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${notifications.length} users with notification tokens`);
    
    // Get profiles with FIDs to match with user_points
    const fids = notifications.map(n => n.fid);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, farcaster_fid')
      .in('farcaster_fid', fids);
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No matching profiles found');
      return new Response(
        JSON.stringify({ success: true, message: 'No matching profiles', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user_points for these users to check who hasn't checked in today
    const userIds = profiles.map(p => p.user_id);
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('user_id, last_daily_checkin, daily_streak')
      .in('user_id', userIds);
    
    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
      throw pointsError;
    }
    
    // Filter users who haven't checked in today but have an active streak (or any user who wants reminders)
    const usersNeedingReminder: number[] = [];
    
    for (const profile of profiles) {
      const userPointsRecord = userPoints?.find(up => up.user_id === profile.user_id);
      const notification = notifications.find(n => n.fid === profile.farcaster_fid);
      
      if (!notification) continue;
      
      // Check if they haven't checked in today
      const lastCheckin = userPointsRecord?.last_daily_checkin 
        ? new Date(userPointsRecord.last_daily_checkin) 
        : null;
      
      const hasCheckedInToday = lastCheckin && lastCheckin >= todayStart;
      
      if (!hasCheckedInToday) {
        usersNeedingReminder.push(profile.farcaster_fid!);
        console.log(`User FID ${profile.farcaster_fid} needs reminder (streak: ${userPointsRecord?.daily_streak || 0})`);
      }
    }
    
    if (usersNeedingReminder.length === 0) {
      console.log('All users have already checked in today');
      return new Response(
        JSON.stringify({ success: true, message: 'All users checked in', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Sending reminders to ${usersNeedingReminder.length} users`);
    
    // Send notification via Neynar API
    const notificationPayload = {
      notification: {
        title: "⏰ Don't lose your streak!",
        body: "Claim your daily reward before the day ends! Keep your streak alive.",
        target_url: "https://uniqueehub.vercel.app",
        uuid: crypto.randomUUID()
      },
      target_fids: usersNeedingReminder
    };
    
    const neynarResponse = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': neynarApiKey
      },
      body: JSON.stringify(notificationPayload)
    });
    
    const neynarResult = await neynarResponse.json();
    
    if (!neynarResponse.ok) {
      console.error('Neynar API error:', neynarResult);
      throw new Error(`Neynar API error: ${JSON.stringify(neynarResult)}`);
    }
    
    console.log('Notification sent successfully:', neynarResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reminders sent',
        sent: usersNeedingReminder.length,
        fids: usersNeedingReminder,
        neynarResponse: neynarResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error sending daily reminders:', error);
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
