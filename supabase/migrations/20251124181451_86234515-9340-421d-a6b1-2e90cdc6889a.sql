
-- Fix the creator_leaderboard to avoid duplication from ratings join
DROP VIEW IF EXISTS public.creator_leaderboard;

CREATE OR REPLACE VIEW public.creator_leaderboard AS
WITH creator_course_stats AS (
  SELECT 
    user_id,
    COUNT(DISTINCT id) as total_courses,
    SUM(enrollment_count) as total_students
  FROM public.courses
  WHERE status = 'published'
  GROUP BY user_id
),
creator_rating_stats AS (
  SELECT 
    c.user_id,
    COUNT(DISTINCT cr.id) as total_ratings
  FROM public.courses c
  LEFT JOIN public.course_ratings cr ON cr.course_id = c.id
  WHERE c.status = 'published'
  GROUP BY c.user_id
)
SELECT 
  ccs.user_id,
  up.creator_points,
  ccs.total_courses,
  COALESCE(ccs.total_students, 0) as total_students,
  COALESCE(crs.total_ratings, 0) as total_ratings,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  ROW_NUMBER() OVER (ORDER BY up.creator_points DESC, up.updated_at ASC) as rank
FROM creator_course_stats ccs
JOIN public.user_points up ON up.user_id = ccs.user_id
LEFT JOIN creator_rating_stats crs ON crs.user_id = ccs.user_id
LEFT JOIN public.profiles p ON p.user_id = ccs.user_id
WHERE up.creator_points > 0
ORDER BY up.creator_points DESC, up.updated_at ASC;
