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

    const { taskId } = await req.json();

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

    switch (taskId) {
      case 'finish-1-course': {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        isCompleted = (enrollments?.length || 0) >= 1;
        break;
      }
      case 'finish-5-courses': {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        isCompleted = (enrollments?.length || 0) >= 5;
        break;
      }
      case 'list-item': {
        const { data: items } = await supabase
          .from('marketplace_items')
          .select('id')
          .eq('user_id', user.id);
        isCompleted = (items?.length || 0) >= 1;
        break;
      }
      case 'list-nft': {
        const { data: nfts } = await supabase
          .from('nft_listings')
          .select('id')
          .eq('user_id', user.id);
        isCompleted = (nfts?.length || 0) >= 1;
        break;
      }
      case 'follow-uniquehub':
      case 'follow-uniquebeing404':
        // For follow tasks, assume verification was done client-side
        isCompleted = true;
        pointsToAward = 50;
        break;
      default:
        throw new Error('Invalid task ID');
    }

    if (!isCompleted) {
      return new Response(
        JSON.stringify({ success: false, message: 'Task not completed yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Record task completion
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

    // Create point event - use 'purchase' as a valid event_type
    const { error: pointEventError } = await supabase
      .from('point_events')
      .insert({
        user_id: user.id,
        event_type: 'purchase',
        points_earned: pointsToAward,
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
