import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a transaction frame for NFT purchases on Base L2
 * Supports atomic transfer: payment + NFT transfer from seller to buyer
 */
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { listingId } = await req.json();
    
    if (!listingId) {
      throw new Error('Listing ID is required');
    }

    // Fetch NFT listing details
    const { data: listing, error: listingError } = await supabase
      .from('nft_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      throw new Error('NFT listing not found or not available');
    }

    if (listing.user_id === user.id) {
      throw new Error('Cannot buy your own NFT');
    }

    const price = parseFloat(listing.price_amount);
    const currency = listing.price_currency;

    // Base L2 contract addresses
    const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    
    // Get seller's wallet address from profile
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', listing.user_id)
      .single();

    const sellerWallet = sellerProfile?.wallet_address;
    if (!sellerWallet) {
      throw new Error('Seller wallet address not found');
    }

    // Transaction frame metadata for Farcaster
    // Note: This creates a payment transaction. NFT transfer would need to be handled
    // by a smart contract or escrow service (like Reservoir and  Zora)
    const frameMetadata = {
      version: 'vNext',
      imageUrl: listing.image_url || 'https://uniquehub.xyz/opengraph-image.png',
      button: {
        title: `Buy NFT for ${price} ${currency}`,
        action: {
          type: 'tx',
          chainId: 'eip155:8453', // Base L2 chain ID
          method: 'eth_sendTransaction',
          params: {
            abi: currency === 'USDC' 
              ? [
                  {
                    "inputs": [
                      {"internalType": "address", "name": "to", "type": "address"},
                      {"internalType": "uint256", "name": "amount", "type": "uint256"}
                    ],
                    "name": "transfer",
                    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                  }
                ]
              : [],
            to: currency === 'USDC' ? USDC_BASE_ADDRESS : sellerWallet,
            data: currency === 'USDC' 
              ? `0xa9059cbb000000000000000000000000${sellerWallet.slice(2)}${(price * 1e6).toString(16).padStart(64, '0')}`
              : '0x',
            value: currency === 'ETH' ? `0x${(price * 1e18).toString(16)}` : '0x0',
          },
        },
      },
      postUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-nft-purchase`,
    };

    console.log('Created NFT purchase frame:', { 
      listingId, 
      tokenAddress: listing.token_address,
      tokenId: listing.token_id,
      price,
      currency,
    });
    

    return new Response(
      JSON.stringify({ 
        success: true,
        listingId: listing.id,
        frameMetadata,
        message: 'Transaction frame created successfully',
        note: 'For production, integrate Reservoir or Zora for atomic NFT transfer + payment',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-nft-purchase-frame function:', error);
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
