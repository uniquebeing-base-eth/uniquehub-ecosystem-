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

    const { targetUsername } = await req.json();
    
    // Get user's Farcaster FID from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('farcaster_fid')
      .eq('user_id', user.id)
      .single();

    if (!profile?.farcaster_fid) {
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'No Farcaster account linked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY');
    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }

    // Check if user follows the target
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${profile.farcaster_fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Neynar');
    }

    const userData = await response.json();
    const user_data = userData.users?.[0];
    
    if (!user_data) {
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user's FID
    const targetResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${targetUsername}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (!targetResponse.ok) {
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetData = await targetResponse.json();
    const targetFid = targetData.result?.user?.fid;

    if (!targetFid) {
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'Target FID not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user's following list includes the target FID
    const followingList = user_data.following_count > 0 ? user_data.viewer_context?.following || false : false;
    
    // Use a more reliable method: check followers/following relationship
    const relationshipResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${targetFid}&viewer_fid=${profile.farcaster_fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (relationshipResponse.ok) {
      const relationshipData = await relationshipResponse.json();
      const targetUserData = relationshipData.users?.[0];
      const isFollowing = targetUserData?.viewer_context?.following || false;

      return new Response(
        JSON.stringify({ isFollowing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ isFollowing: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error verifying follow:', error);
    return new Response(
      JSON.stringify({ isFollowing: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
