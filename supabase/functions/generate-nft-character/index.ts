import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating NFT for user:', user.id);

    // Check existing generation count (max 3: original + 2 regenerations)
    const { data: existingNFT } = await supabase
      .from('user_nft_generations')
      .select('metadata')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentCount = (existingNFT?.metadata as any)?.generation_count || 0;
    
    if (currentCount >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Generation limit reached. You can only generate 3 times (1 original + 2 regenerations).'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile for gender detection
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, farcaster_username, bio')
      .eq('user_id', user.id)
      .single();

    const displayName = profile?.display_name || profile?.farcaster_username || 'User';
    
    // Determine hair style - default to short if no gender info
    const hairStyle = "short"; // You can enhance this with user profile data
    
    console.log('Generating NFT character for user:', displayName);

    // Generate unique character with Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Create a unique anime-style NFT avatar selfie with these exact specifications:
- Vibrant electric blue hair (${hairStyle === "short" ? "short, spiky style" : "long, flowing style"})
- Glowing blue energy aura around the face
- Deep blue eyes with a mystical glow
- Close-up selfie shot: face and head only, tight crop like a profile picture
- Confident, friendly expression with personality
- Dark gradient background (deep navy to black) with subtle blue energy particles
- High quality digital art, professional NFT avatar quality
- Character name visual element: "${displayName}"
- UniqueHub cyberpunk blue aesthetic
- Square aspect ratio 1:1, perfect for profile picture
- Minimal shoulders visible, focus entirely on face and head`;

    console.log('Calling Lovable AI with prompt:', prompt);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL in AI response');
    }

    // Store or update in database with incremented generation count
    const newCount = currentCount + 1;
    const { data: nftData, error: upsertError } = await supabase
      .from('user_nft_generations')
      .upsert({
        user_id: user.id,
        image_url: imageUrl,
        metadata: {
          display_name: displayName,
          hair_style: hairStyle,
          generated_at: new Date().toISOString(),
          prompt: prompt,
          generation_count: newCount
        }
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
      throw upsertError;
    }

    console.log('NFT generation complete for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        nft: nftData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-nft-character:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});