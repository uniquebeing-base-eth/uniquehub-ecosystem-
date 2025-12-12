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
    
    // Get all profiles with Farcaster FIDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, farcaster_fid')
      .not('farcaster_fid', 'is', null);
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No users with Farcaster FIDs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${profiles.length} users with Farcaster FIDs`);
    
    // Get all user_points records
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('user_id, last_daily_checkin, daily_streak');
    
    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
      throw pointsError;
    }
    
    console.log(`Found ${userPoints?.length || 0} user_points records`);
    
    // Filter users who haven't checked in today
    const usersNeedingReminder: number[] = [];
    
    for (const profile of profiles) {
      const userPointsRecord = userPoints?.find(up => up.user_id === profile.user_id);
      
      // Check if they haven't checked in today
      const lastCheckin = userPointsRecord?.last_daily_checkin 
        ? new Date(userPointsRecord.last_daily_checkin) 
        : null;
      
      const hasCheckedInToday = lastCheckin && lastCheckin >= todayStart;
      
      if (!hasCheckedInToday && profile.farcaster_fid) {
        usersNeedingReminder.push(profile.farcaster_fid);
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
    
    console.log('Sending notification payload:', JSON.stringify(notificationPayload));
    
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
