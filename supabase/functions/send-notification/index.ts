import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'course_completion' | 'new_course' | 'new_learning_course' | 'new_marketplace_item' | 'new_blog_article' | 'course_comment' | 'course_rating';
  target_user_id?: string; // For individual notifications
  target_fids?: number[]; // For bulk notifications
  broadcast?: boolean; // Send to all users
  data?: {
    course_title?: string;
    course_id?: string;
    item_title?: string;
    item_id?: string;
    article_title?: string;
    commenter_name?: string;
    rating?: number;
    author_name?: string;
  };
}

const notificationTemplates = {
  course_completion: (data: NotificationPayload['data']) => ({
    title: "🎓 Course Completed!",
    body: `Congratulations! You've completed "${data?.course_title || 'a course'}". Claim your certificate!`,
  }),
  new_course: (data: NotificationPayload['data']) => ({
    title: "📚 New Course Available!",
    body: `Check out "${data?.course_title || 'a new course'}" by ${data?.author_name || 'a creator'}!`,
  }),
  new_learning_course: (data: NotificationPayload['data']) => ({
    title: "🎯 New Learning Quest!",
    body: `New learning course available: "${data?.course_title || 'Learn something new'}". Earn points!`,
  }),
  new_marketplace_item: (data: NotificationPayload['data']) => ({
    title: "🛒 New Marketplace Item!",
    body: `Check out "${data?.item_title || 'a new item'}" in the marketplace!`,
  }),
  new_blog_article: (data: NotificationPayload['data']) => ({
    title: "📰 New Article!",
    body: `Read the latest: "${data?.article_title || 'New article'}" on UniqueHub!`,
  }),
  course_comment: (data: NotificationPayload['data']) => ({
    title: "💬 New Comment!",
    body: `${data?.commenter_name || 'Someone'} commented on your course "${data?.course_title || ''}"`,
  }),
  course_rating: (data: NotificationPayload['data']) => ({
    title: "⭐ New Rating!",
    body: `Your course "${data?.course_title || ''}" received a ${data?.rating || 5}-star rating!`,
  }),
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    console.log('Received notification request:', JSON.stringify(payload));

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY') ?? '';

    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let targetFids: number[] = payload.target_fids || [];

    // If targeting a specific user, get their FID
    if (payload.target_user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('farcaster_fid')
        .eq('user_id', payload.target_user_id)
        .single();
      
      if (profile?.farcaster_fid) {
        targetFids.push(profile.farcaster_fid);
      }
    }

    // If broadcasting to all users
    if (payload.broadcast) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('farcaster_fid')
        .not('farcaster_fid', 'is', null);
      
      if (profiles) {
        targetFids = profiles.map(p => p.farcaster_fid).filter(Boolean) as number[];
      }
    }

    if (targetFids.length === 0) {
      console.log('No target FIDs found');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove duplicates
    targetFids = [...new Set(targetFids)];
    console.log(`Sending ${payload.type} notification to ${targetFids.length} users`);

    const template = notificationTemplates[payload.type];
    if (!template) {
      throw new Error(`Unknown notification type: ${payload.type}`);
    }

    const { title, body } = template(payload.data);

    const notificationPayload = {
      notification: {
        title,
        body,
        target_url: "https://uniqueehub.vercel.app",
        uuid: crypto.randomUUID()
      },
      target_fids: targetFids
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
        type: payload.type,
        sent: targetFids.length,
        neynarResponse: neynarResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
