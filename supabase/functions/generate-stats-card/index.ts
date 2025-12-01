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
    const [profileRes, pointsRes, achievementsRes, coursesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_points').select('*').eq('user_id', user.id).single(),
      supabase.from('creator_achievements').select('*').eq('user_id', user.id).eq('is_claimed', true).order('awarded_at', { ascending: false }),
      supabase.from('courses').select('id').eq('user_id', user.id).eq('status', 'published')
    ]);

    const profile = profileRes.data || {};
    const points = pointsRes.data || { 
      total_points: 0, 
      daily_streak: 0, 
      weekly_streak: 0, 
      monthly_streak: 0, 
      creator_points: 0 
    };
    const achievements = achievementsRes.data || [];
    const courseCount = coursesRes.data?.length || 0;

    console.log('Fetched user points:', points);
    console.log('Daily streak:', points.daily_streak);
    console.log('Weekly streak:', points.weekly_streak);
    console.log('Monthly streak:', points.monthly_streak);

    // Determine creator level based on course count
    const creatorPoints = points.creator_points || 0;
    let creatorLevel = "Beginner Creator";
    let levelIcon = "🌱";
    
    if (courseCount >= 50) {
      creatorLevel = "Master Creator";
      levelIcon = "👑";
    } else if (courseCount >= 20) {
      creatorLevel = "Expert Creator";
      levelIcon = "⭐";
    } else if (courseCount >= 10) {
      creatorLevel = "Advanced Creator";
      levelIcon = "🔥";
    } else if (courseCount >= 5) {
      creatorLevel = "Intermediate Creator";
      levelIcon = "💎";
    } else if (courseCount >= 1) {
      creatorLevel = "Beginner Creator";
      levelIcon = "🌱";
    }

    // Count claimed achievements
    const claimedAchievements = achievements.length;

    // Use a cute default avatar - cute penguin character
    const avatarUrl = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=uniquehub&backgroundColor=3b82f6';
    
    const prompt = `Create a stunning profile stats card with exact dimensions 1200x630 pixels (Farcaster standard).

CRITICAL REQUIREMENTS:
- Use BLUE (#3b82f6) as the primary accent color throughout - glows, borders, highlights
- Dark cosmic space background with stars and blue nebula effects
- Professional, clean layout with centered elements

LAYOUT (top to bottom, all centered):

1. TOP SECTION:
   - Profile picture: ${avatarUrl}
   - Display as large circular image (120px diameter) with glowing blue border
   - Below picture: "${profile.display_name || 'Learner'}" in bold white (28px)
   - Below name: "@${profile.farcaster_username || 'anonymous'}" in light gray (18px)
   - Creator badge: "${levelIcon} ${creatorLevel}" in blue pill shape with glow

2. STATS GRID (4 stat pills in 2x2 grid):
   Row 1:
   - Left pill: "Daily Streak: ${points.daily_streak ?? 0} 🔥"
   - Right pill: "Weekly Streak: ${points.weekly_streak ?? 0} 🏆"
   Row 2:
   - Left pill: "Monthly: ${points.monthly_streak ?? 0} 💎"
   - Right pill: "Achievements: ${claimedAchievements} ⭐"
   Each pill: dark semi-transparent background with blue border, white text

3. BOTTOM SECTION:
   - "Total Points" in gray (16px)
   - "${points.total_points.toLocaleString()} UP" in large glowing blue text (42px)
   - "Creator Points: ${creatorPoints.toLocaleString()}" in smaller blue text (18px)

STYLE:
- Blue theme throughout (#3b82f6)
- Dark space background with subtle blue glow effects
- Glass morphism style for card elements
- Clean, professional design
- All elements perfectly centered
- Exact 1200x630 aspect ratio`;

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
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('No image generated');
    }

    // Convert base64 to blob and upload to Supabase storage
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `stats-card-${user.id}-${Date.now()}.png`;
    const filePath = `profile-cards/${fileName}`;

    const supabaseStorage = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: uploadError } = await supabaseStorage.storage
      .from('certificates')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseStorage.storage
      .from('certificates')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        stats: {
          username: profile.display_name || 'Learner',
          farcasterUsername: profile.farcaster_username || 'anonymous',
          creatorLevel,
          levelIcon,
          totalPoints: points.total_points,
          dailyStreak: points.daily_streak || 0,
          weeklyStreak: points.weekly_streak || 0,
          monthlyStreak: points.monthly_streak || 0,
          creatorPoints,
          achievementsCount: claimedAchievements,
          courseCount
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
