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

    const { taskId, transactionHash } = await req.json();

    // Validate that transaction hash is provided for on-chain claims
    if (!transactionHash) {
      console.error('No transaction hash provided');
      return new Response(
        JSON.stringify({ success: false, message: 'Transaction hash required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing task ${taskId} with tx hash: ${transactionHash}`);

    // Check if task already completed
    const { data: existingTask } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .single();

    if (existingTask) {
      return new Response(
        JSON.stringify({ success: false, message: 'Task already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify task completion based on task type
    let isCompleted = false;
    let pointsToAward = 1000;

    console.log(`Verifying task: ${taskId} for user: ${user.id}`);

    switch (taskId) {
      case 'read-blog-web3':
      case 'read-blog-education':
      case 'read-blog-web3-terms':
      case 'read-blog-about-uniquehub':
      case 'read-blog-uniquehub-features':
      case 'read-blog-meet-uniqbot':
      case 'read-blog-blue-energy-nfts':
      case 'read-blog-creativity-campaign':
        // For blog reading tasks, trust client-side verification
        isCompleted = true;
        pointsToAward = 100;
        console.log(`Blog task ${taskId} marked as completed`);
        break;
      case 'finish-1-course': {
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        
        if (enrollError) {
          console.error('Error checking course enrollments:', enrollError);
          throw enrollError;
        }
        
        isCompleted = (enrollments?.length || 0) >= 1;
        console.log(`User has ${enrollments?.length || 0} completed courses`);
        break;
      }
      case 'finish-5-courses': {
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        
        if (enrollError) {
          console.error('Error checking course enrollments:', enrollError);
          throw enrollError;
        }
        
        isCompleted = (enrollments?.length || 0) >= 5;
        console.log(`User has ${enrollments?.length || 0} completed courses`);
        break;
      }
      case 'list-item': {
        const { data: items, error: itemError } = await supabase
          .from('marketplace_items')
          .select('id')
          .eq('user_id', user.id);
        
        if (itemError) {
          console.error('Error checking marketplace items:', itemError);
          throw itemError;
        }
        
        isCompleted = (items?.length || 0) >= 1;
        console.log(`User has ${items?.length || 0} marketplace items`);
        break;
      }
      case 'list-nft': {
        const { data: nfts, error: nftError } = await supabase
          .from('nft_listings')
          .select('id')
          .eq('user_id', user.id);
        
        if (nftError) {
          console.error('Error checking NFT listings:', nftError);
          throw nftError;
        }
        
        isCompleted = (nfts?.length || 0) >= 1;
        console.log(`User has ${nfts?.length || 0} NFT listings`);
        break;
      }
      case 'follow-uniquehub':
      case 'follow-uniquebeing404':
        // For follow tasks, verification was done client-side via Neynar API
        isCompleted = true;
        pointsToAward = 50;
        console.log(`Follow task ${taskId} marked as completed`);
        break;
      default:
        console.error(`Unknown task ID: ${taskId}`);
        throw new Error(`Invalid task ID: ${taskId}`);
    }

    console.log(`Task ${taskId} verification result: ${isCompleted}`);

    if (!isCompleted) {
      return new Response(
        JSON.stringify({ success: false, message: 'Task not completed yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Record task completion with transaction hash
    const { error: taskError } = await supabase
      .from('task_completions')
      .insert({
        user_id: user.id,
        task_id: taskId,
        points_awarded: pointsToAward,
      });

    if (taskError) {
      throw taskError;
    }

    // Create point event for task completion with transaction hash
    const { error: pointEventError } = await supabase
      .from('point_events')
      .insert({
        user_id: user.id,
        event_type: 'task_completion',
        points_earned: pointsToAward,
        transaction_hash: transactionHash,
      });

    if (pointEventError) {
      console.error('Point event error:', pointEventError);
      throw pointEventError;
    }

    // Update user points
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userPoints) {
      await supabase
        .from('user_points')
        .update({
          total_points: userPoints.total_points + pointsToAward,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: pointsToAward,
        });
    }

    return new Response(
      JSON.stringify({ success: true, pointsAwarded: pointsToAward }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error completing task:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
