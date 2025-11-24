-- Drop and recreate the leaderboard view to use learning streaks
DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  up.user_id,
  up.total_points,
  COALESCE(uls.current_streak, 0) as current_streak,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  ROW_NUMBER() OVER (ORDER BY up.total_points DESC, up.updated_at ASC) as rank
FROM public.user_points up
LEFT JOIN public.profiles p ON p.user_id = up.user_id
LEFT JOIN public.user_learning_streaks uls ON uls.user_id = up.user_id
ORDER BY up.total_points DESC, up.updated_at ASC;