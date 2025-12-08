import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verifies course payment transaction and grants access
 * Called immediately after transaction frame execution
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, transactionHash } = await req.json();
    
    if (!paymentId || !transactionHash) {
      throw new Error('Payment ID and transaction hash are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Verifying payment ${paymentId} with tx ${transactionHash}`);

    // Update payment status
    const { data: payment, error: updateError } = await supabase
      .from('course_payments')
      .update({
        status: 'completed',
        transaction_hash: transactionHash,
        completed_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    // Create enrollment for the buyer
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: payment.buyer_user_id,
        course_id: payment.course_id,
        progress_percentage: 0,
      });

    if (enrollmentError) {
      console.error('Failed to create enrollment:', enrollmentError);
      // Don't fail the payment verification if enrollment creation fails
    }

    // Increment enrollment count on the course
    const { error: updateCourseError } = await supabase.rpc('increment_enrollment_count', {
      course_id: payment.course_id
    });

    if (updateCourseError) {
      console.error('Failed to increment enrollment count:', updateCourseError);
      // Don't fail the payment verification if enrollment count update fails
    }

    // Award points for course purchase (10 UP per $1 spent, max 1000 UP)
    const pointsToAward = Math.min(Math.floor(payment.amount * 10), 1000);
    
    // Get or create user points record
    let { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', payment.buyer_user_id)
      .single();

    if (!userPoints) {
      const { data: newPoints } = await supabase
        .from('user_points')
        .insert({ user_id: payment.buyer_user_id, total_points: 0 })
        .select()
        .single();
      userPoints = newPoints;
    }

    // Update total points
    if (userPoints) {
      await supabase
        .from('user_points')
        .update({ total_points: (userPoints.total_points || 0) + pointsToAward })
        .eq('user_id', payment.buyer_user_id);

      // Record point event
      await supabase
        .from('point_events')
        .insert({
          user_id: payment.buyer_user_id,
          event_type: 'course_purchase',
          points_earned: pointsToAward,
          transaction_amount: payment.amount,
          transaction_hash: transactionHash,
        });

      console.log(`Awarded ${pointsToAward} UP to user ${payment.buyer_user_id} for course purchase`);
    }

    console.log(`Payment verified and enrollment created for payment ${paymentId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified and course access granted!',
        paymentId: payment.id,
        courseId: payment.course_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-course-payment function:', error);
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
