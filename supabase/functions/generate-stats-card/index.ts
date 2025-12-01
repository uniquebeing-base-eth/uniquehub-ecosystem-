import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Fetch user data
    const [profileRes, pointsRes, achievementsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_points').select('*').eq('user_id', user.id).single(),
      supabase.from('creator_achievements').select('*').eq('user_id', user.id).order('awarded_at', { ascending: false })
    ]);

    const profile = profileRes.data || {};
    const points = pointsRes.data || { total_points: 0, daily_streak: 0, weekly_streak: 0, monthly_streak: 0, creator_points: 0 };
    const achievements = achievementsRes.data || [];

    // Determine creator level based on creator_points
    const creatorPoints = points.creator_points || 0;
    let creatorLevel = "Beginner";
    let levelColor = "#3b82f6"; // blue
    
    if (creatorPoints >= 10000) {
      creatorLevel = "Legend";
      levelColor = "#fbbf24"; // gold
    } else if (creatorPoints >= 5000) {
      creatorLevel = "Master";
      levelColor = "#a855f7"; // purple
    } else if (creatorPoints >= 2000) {
      creatorLevel = "Expert";
      levelColor = "#ec4899"; // pink
    } else if (creatorPoints >= 500) {
      creatorLevel = "Advanced";
      levelColor = "#10b981"; // emerald
    } else if (creatorPoints >= 100) {
      creatorLevel = "Intermediate";
      levelColor = "#3b82f6"; // blue
    }

    // Get top 3 achievements for display
    const topAchievements = achievements.slice(0, 3);

    // Create prompt for AI image generation
    const prompt = `Create a stunning, dreamlike glowing card with a dark cosmic background featuring stars and nebula effects. 

Center the card with these exact details:

Top section:
- Large circular profile area with a glowing ${levelColor} ring
- "${profile.display_name || 'Learner'}" in bold white text below
- "@${profile.farcaster_username || 'anonymous'}" in smaller gray text

Middle section - Creator Level badge:
- "${creatorLevel}" with glowing ${levelColor} effects
- ${creatorPoints} Creator Points displayed

Stats grid (3 columns):
- Daily Streak: ${points.daily_streak} days 🔥
- Weekly Streak: ${points.weekly_streak} weeks 🏆
- Monthly Streak: ${points.monthly_streak} months 💎

Bottom section:
- Total Points: ${points.total_points.toLocaleString()} UP in large glowing text
- ${topAchievements.length} Achievements Unlocked

Style: Futuristic, dreamlike, with soft glowing effects, gradients from ${levelColor} to purple/blue, glass morphism effects, and floating particles. Professional gaming profile card aesthetic with depth and dimension.`;

    console.log('Generating card with prompt:', prompt);

    // Generate image using Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI generation failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl,
        stats: {
          username: profile.display_name || 'Learner',
          farcasterUsername: profile.farcaster_username || 'anonymous',
          creatorLevel,
          levelColor,
          totalPoints: points.total_points,
          dailyStreak: points.daily_streak,
          weeklyStreak: points.weekly_streak,
          monthlyStreak: points.monthly_streak,
          creatorPoints,
          achievementsCount: achievements.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
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
