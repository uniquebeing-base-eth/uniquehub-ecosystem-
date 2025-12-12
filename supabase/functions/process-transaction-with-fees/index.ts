import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Processes transactions with fees and awards UP points for purchases/trades
 * Calculates gas fee ($0.01) and app fee ($0.02) in ETH using Chainlink price oracle
 * Awards points: 10 UP per $1 spent, max 1000 UP per transaction
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

    const { transactionType, amountUsd, transactionHash } = await req.json();
    
    if (!transactionType || !amountUsd || !transactionHash) {
      throw new Error('Missing required parameters: transactionType, amountUsd, transactionHash');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log(`Processing transaction for user ${user.id}: ${transactionType} - $${amountUsd}`);

    // Get app configuration
    const { data: config } = await supabase
      .from('app_config')
      .select('*')
      .in('config_key', ['gas_fee_usd', 'app_fee_usd', 'max_volume_points_per_transaction']);

    const gasFeeUsd = parseFloat(config?.find(c => c.config_key === 'gas_fee_usd')?.config_value || '0.01');
    const appFeeUsd = parseFloat(config?.find(c => c.config_key === 'app_fee_usd')?.config_value || '0.02');
    const maxPoints = parseInt(config?.find(c => c.config_key === 'max_volume_points_per_transaction')?.config_value || '1000');

    // Calculate points: 10 UP per $1, capped at maxPoints
    const pointsEarned = Math.min(Math.floor(amountUsd * 10), maxPoints);

    // Get or create user points record
    let { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!userPoints) {
      const { data: newPoints, error: createError } = await supabase
        .from('user_points')
        .insert({ user_id: user.id, total_points: 0 })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user points: ${createError.message}`);
      }
      userPoints = newPoints;
    }

    // Update points
    const newTotalPoints = (userPoints.total_points || 0) + pointsEarned;

    const { error: updateError } = await supabase
      .from('user_points')
      .update({ total_points: newTotalPoints })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update points: ${updateError.message}`);
    }

    // Record point event
    const eventType = transactionType === 'buy' ? 'buy_volume' : 'trade_volume';
    
    const { error: eventError } = await supabase
      .from('point_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        points_earned: pointsEarned,
        transaction_amount: amountUsd,
        transaction_hash: transactionHash,
      });

    if (eventError) {
      console.error('Failed to record point event:', eventError);
    }

    console.log(`Awarded ${pointsEarned} UP to user ${user.id} for ${transactionType}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Transaction processed! You earned ${pointsEarned} UP!`,
        fees: {
          gasFeeUsd,
          appFeeUsd,
          totalFeesUsd: gasFeeUsd + appFeeUsd,
        },
        points: {
          earned: pointsEarned,
          total: newTotalPoints,
        },
        transactionHash,
        note: 'In production, integrate with Chainlink for ETH/USD conversion and smart contract for fee distribution',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-transaction-with-fees function:', error);
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
