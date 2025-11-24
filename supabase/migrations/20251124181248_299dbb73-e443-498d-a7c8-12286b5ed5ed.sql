
-- Fix creator_leaderboard to accurately count students and remove views
DROP VIEW IF EXISTS public.creator_leaderboard;

CREATE OR REPLACE VIEW public.creator_leaderboard AS
WITH creator_stats AS (
  SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT e.user_id) as total_students,
    COUNT(DISTINCT cr.id) as total_ratings
  FROM public.courses c
  LEFT JOIN public.enrollments e ON e.course_id = c.id
  LEFT JOIN public.course_ratings cr ON cr.course_id = c.id
  WHERE c.status = 'published'
  GROUP BY c.user_id
)
SELECT 
  cs.user_id,
  up.creator_points,
  cs.total_courses,
  cs.total_students,
  cs.total_ratings,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  ROW_NUMBER() OVER (ORDER BY up.creator_points DESC, up.updated_at ASC) as rank
FROM creator_stats cs
JOIN public.user_points up ON up.user_id = cs.user_id
LEFT JOIN public.profiles p ON p.user_id = cs.user_id
WHERE up.creator_points > 0
ORDER BY up.creator_points DESC, up.updated_at ASC;
