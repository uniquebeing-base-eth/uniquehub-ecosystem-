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
    console.log('Verify follow function called');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const { targetUsername } = await req.json();
    console.log('Target username:', targetUsername);
    
    // Get user's Farcaster FID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('farcaster_fid')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    if (!profile?.farcaster_fid) {
      console.log('No Farcaster account linked for user:', user.id);
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'No Farcaster account linked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User FID:', profile.farcaster_fid);

    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY');
    if (!neynarApiKey) {
      console.error('NEYNAR_API_KEY not configured');
      throw new Error('NEYNAR_API_KEY not configured');
    }

    // Get the target user's FID
    console.log('Fetching target user FID for username:', targetUsername);
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
      const errorText = await targetResponse.text();
      console.error('Failed to fetch target user:', targetResponse.status, errorText);
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'Target user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetData = await targetResponse.json();
    console.log('Target API response:', JSON.stringify(targetData));
    
    // Neynar v2 API returns user directly in the response
    const targetFid = targetData.user?.fid;

    if (!targetFid) {
      console.error('Target FID not found in response. Full response:', JSON.stringify(targetData));
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'Target FID not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Target FID:', targetFid);
    
    // Check followers/following relationship
    console.log('Checking follow relationship...');
    const relationshipResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${targetFid}&viewer_fid=${profile.farcaster_fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (!relationshipResponse.ok) {
      console.error('Failed to check relationship:', relationshipResponse.status);
      return new Response(
        JSON.stringify({ isFollowing: false, error: 'Failed to verify follow status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const relationshipData = await relationshipResponse.json();
    const targetUserData = relationshipData.users?.[0];
    const isFollowing = targetUserData?.viewer_context?.following || false;

    console.log('Follow status:', isFollowing);

    return new Response(
      JSON.stringify({ isFollowing }),
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
