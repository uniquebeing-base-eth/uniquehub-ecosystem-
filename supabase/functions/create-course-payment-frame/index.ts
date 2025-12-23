import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a transaction frame for course purchases on Base L2
 * Supports USDC and ETH payments only
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

    const { courseId, currency } = await req.json();
    
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Fetch course details here
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, user_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new Error('Course not found');
    }

    const priceInUsdc = parseFloat(course.price_usdc) || 0;
    const selectedCurrency = currency || 'USDC';

    // Base L2 contract addresses
    const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
    
    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('course_payments')
      .insert({
        course_id: courseId,
        buyer_user_id: user.id,
        seller_user_id: course.user_id,
        amount: priceInUsdc,
        currency: selectedCurrency,
        chain: 'base',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Transaction frame metadata for Farcaster
    const frameMetadata = {
      version: 'vNext',
      imageUrl: course.thumbnail_url || 'https://uniquehub.xyz/opengraph-image.png',
      button: {
        title: `Buy Course for ${priceInUsdc} ${selectedCurrency}`,
        action: {
          type: 'tx',
          chainId: 'eip155:8453', // Base L2 chain ID
          method: 'eth_sendTransaction',
          params: {
            abi: selectedCurrency === 'USDC' 
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
            to: selectedCurrency === 'USDC' ? USDC_BASE_ADDRESS : course.user_id,
            data: selectedCurrency === 'USDC' 
              ? `0xa9059cbb000000000000000000000000${course.user_id.slice(2)}${(priceInUsdc * 1e6).toString(16).padStart(64, '0')}`
              : '0x',
            value: selectedCurrency === 'ETH' ? `0x${(priceInUsdc * 1e18).toString(16)}` : '0x0',
          },
        },
      },
      postUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-course-payment`,
    };

    console.log('Created course payment frame:', { paymentId: payment.id, courseId, currency: selectedCurrency });

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentId: payment.id,
        frameMetadata,
        message: 'Transaction frame created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-course-payment-frame function:', error);
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
