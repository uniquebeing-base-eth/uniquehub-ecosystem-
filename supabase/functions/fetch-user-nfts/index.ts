import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetches NFTs owned by a Farcaster user using Neynar API
 * Focuses on Base L2 chain and Farcaster post collectibles
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

    console.log(`Fetching NFTs for FID: ${fid}`);

    // First, get the user's custody address and verified addresses
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
      throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const user = userData.users?.[0];
    
    if (!user) {
      throw new Error('User not found');
    }

    const custodyAddress = user.custody_address;
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const allAddresses = [custodyAddress, ...verifiedAddresses].filter(Boolean);

    console.log(`Found addresses for FID ${fid}:`, allAddresses);

    // Fetch NFTs for each address on Base chain
    const nftPromises = allAddresses.map(async (address) => {
      try {
        const nftResponse = await fetch(
          `https://api.neynar.com/v1/farcaster/user/nfts?address=${address}&chain=base`,
          {
            headers: {
              'accept': 'application/json',
              'api_key': neynarApiKey,
            },
          }
        );

        if (!nftResponse.ok) {
          console.warn(`Failed to fetch NFTs for address ${address}`);
          return [];
        }

        const nftData = await nftResponse.json();
        return nftData.nfts || [];
      } catch (error) {
        console.error(`Error fetching NFTs for address ${address}:`, error);
        return [];
      }
    });

    const nftArrays = await Promise.all(nftPromises);
    const allNfts = nftArrays.flat();

    // Filter and format NFTs (ERC-721 and ERC-1155 on Base)
    const formattedNfts = allNfts.map((nft: any) => ({
      tokenAddress: nft.contract_address,
      tokenId: nft.token_id,
      tokenStandard: nft.token_standard || 'ERC721',
      name: nft.name || 'Unnamed NFT',
      description: nft.description,
      imageUrl: nft.image_url,
      chain: 'base',
      metadata: {
        collection: nft.collection_name,
        attributes: nft.attributes,
        ownerAddress: nft.owner_address,
      },
    }));

    console.log(`Found ${formattedNfts.length} NFTs for FID ${fid}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        nfts: formattedNfts,
        userAddresses: allAddresses,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-user-nfts function:', error);
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
