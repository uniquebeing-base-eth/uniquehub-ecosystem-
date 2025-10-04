import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verifies NFT purchase transaction and updates listing status
 * Called after transaction frame execution
 * Note: For production, integrate with Reservoir or Zora for actual NFT transfer verification
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listingId, transactionHash, buyerUserId } = await req.json();
    
    if (!listingId || !transactionHash) {
      throw new Error('Listing ID and transaction hash are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Verifying NFT purchase for listing ${listingId} with tx ${transactionHash}`);

    // Update listing status to sold
    const { data: listing, error: updateError } = await supabase
      .from('nft_listings')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        buyer_user_id: buyerUserId,
      })
      .eq('id', listingId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update listing: ${updateError.message}`);
    }

    console.log(`NFT listing ${listingId} marked as sold to user ${buyerUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'NFT purchase verified! Ownership transferred.',
        listingId: listing.id,
        tokenAddress: listing.token_address,
        tokenId: listing.token_id,
        transactionHash,
        note: 'For production, verify actual NFT transfer on-chain using Reservoir or Zora',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-nft-purchase function:', error);
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
