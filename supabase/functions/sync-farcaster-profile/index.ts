import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetches Farcaster user profile data from Neynar and syncs to profiles table
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fid } = await req.json();
    
    if (!fid) {
      throw new Error('FID is required');
    }

    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY');
    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }

    console.log(`Fetching profile for FID: ${fid}`);

    // Fetch user profile from Neynar
    const userResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user profile: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const user = userData.users?.[0];
    
    if (!user) {
      throw new Error('User not found');
    }

    // Extract profile data
    const profileData = {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || '',
      custodyAddress: user.custody_address,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
    };

    console.log(`Profile data fetched for ${profileData.username}:`, profileData);

    return new Response(
      JSON.stringify({ 
        success: true,
        profile: profileData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sync-farcaster-profile function:', error);
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
