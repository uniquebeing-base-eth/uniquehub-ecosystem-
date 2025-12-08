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
    console.log('Fetch Farcaster wallet function called');
    
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

    console.log('User authenticated:', user.id);

    // Get user's Farcaster FID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('farcaster_fid')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.farcaster_fid) {
      console.log('No Farcaster FID found for user');
      return new Response(
        JSON.stringify({ error: 'No Farcaster account linked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const fid = profile.farcaster_fid;
    console.log('Fetching wallet for FID:', fid);

    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY');
    if (!neynarApiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }

    // Fetch user data from Neynar
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': neynarApiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', response.status, errorText);
      throw new Error('Failed to fetch user data from Neynar');
    }

    const data = await response.json();
    console.log('Neynar response:', JSON.stringify(data));
    
    const userData = data.users?.[0];
    
    if (!userData) {
      throw new Error('User not found in Neynar response');
    }

    // Get verified addresses (custody address and connected addresses)
    const custodyAddress = userData.custody_address;
    const verifiedAddresses = userData.verified_addresses?.eth_addresses || [];
    
    // Prefer verified addresses over custody address
    const walletAddress = verifiedAddresses[0] || custodyAddress;

    console.log('Wallet address found:', walletAddress);

    // Fetch ETH and USDC balances from Base chain
    let ethBalance = '0.00';
    let usdcBalance = '0.00';

    if (walletAddress) {
      try {
        // Fetch ETH balance using Alchemy API or similar
        const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');
        if (alchemyApiKey) {
          const balanceResponse = await fetch(
            `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [walletAddress, 'latest'],
                id: 1,
              }),
            }
          );

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const weiBalance = parseInt(balanceData.result, 16);
            ethBalance = (weiBalance / 1e18).toFixed(4);
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }

    return new Response(
      JSON.stringify({
        walletAddress,
        custodyAddress,
        verifiedAddresses,
        ethBalance,
        usdcBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching Farcaster wallet:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
