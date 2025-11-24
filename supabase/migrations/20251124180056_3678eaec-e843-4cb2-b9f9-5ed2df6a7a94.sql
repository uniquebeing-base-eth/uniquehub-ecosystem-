
-- Add claimed field to creator_achievements
ALTER TABLE public.creator_achievements 
ADD COLUMN IF NOT EXISTS is_claimed boolean DEFAULT false;

-- Update creator_leaderboard view to show total ratings instead of likes
DROP VIEW IF EXISTS public.creator_leaderboard;

CREATE OR REPLACE VIEW public.creator_leaderboard AS
SELECT 
  up.user_id,
  up.creator_points,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT e.user_id) as total_students,
  COALESCE(SUM(c.views_count), 0) as total_views,
  COUNT(DISTINCT cr.id) as total_ratings,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  ROW_NUMBER() OVER (ORDER BY up.creator_points DESC, up.updated_at ASC) as rank
FROM public.user_points up
LEFT JOIN public.profiles p ON p.user_id = up.user_id
LEFT JOIN public.courses c ON c.user_id = up.user_id AND c.status = 'published'
LEFT JOIN public.enrollments e ON e.course_id = c.id
LEFT JOIN public.course_ratings cr ON cr.course_id = c.id
WHERE up.creator_points > 0
GROUP BY up.user_id, up.creator_points, up.updated_at, p.display_name, p.farcaster_username, p.avatar_url
ORDER BY up.creator_points DESC, up.updated_at ASC;
