
-- Backfill creator points for existing courses and enrollments

-- First, ensure all course creators have a user_points record
INSERT INTO public.user_points (user_id, creator_points)
SELECT DISTINCT c.user_id, 0
FROM public.courses c
WHERE c.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_points up WHERE up.user_id = c.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Calculate and update creator points based on existing data
WITH creator_stats AS (
  SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT e.user_id) as total_students,
    COALESCE(SUM(c.likes_count), 0) as total_likes
  FROM public.courses c
  LEFT JOIN public.enrollments e ON e.course_id = c.id
  WHERE c.status = 'published'
  GROUP BY c.user_id
),
calculated_points AS (
  SELECT 
    user_id,
    -- Course milestone points (cumulative)
    (CASE 
      WHEN total_courses >= 50 THEN 5000 + 1000 + 500 + 200 + 50
      WHEN total_courses >= 20 THEN 1000 + 500 + 200 + 50
      WHEN total_courses >= 10 THEN 500 + 200 + 50
      WHEN total_courses >= 5 THEN 200 + 50
      WHEN total_courses >= 1 THEN 50
      ELSE 0
    END) +
    -- Student milestone points (cumulative)
    (CASE 
      WHEN total_students >= 500 THEN 5000 + 1000 + 500 + 100
      WHEN total_students >= 100 THEN 1000 + 500 + 100
      WHEN total_students >= 50 THEN 500 + 100
      WHEN total_students >= 10 THEN 100
      ELSE 0
    END) +
    -- Points per enrollment (100 each)
    (total_students * 100) +
    -- Points per like (10 each)
    (total_likes * 10) AS creator_points
  FROM creator_stats
)
UPDATE public.user_points up
SET 
  creator_points = cp.creator_points,
  updated_at = now()
FROM calculated_points cp
WHERE up.user_id = cp.user_id;

-- Insert achievement records for course milestones
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'courses',
  1,
  1,
  50,
  '🎯',
  'green'
FROM (
  SELECT user_id, COUNT(*) as course_count
  FROM public.courses
  WHERE status = 'published'
  GROUP BY user_id
  HAVING COUNT(*) >= 1
) c
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Rising Star achievement (5 courses)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'courses',
  2,
  5,
  200,
  '💎',
  'blue'
FROM (
  SELECT user_id, COUNT(*) as course_count
  FROM public.courses
  WHERE status = 'published'
  GROUP BY user_id
  HAVING COUNT(*) >= 5
) c
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Course Master achievement (10 courses)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'courses',
  3,
  10,
  500,
  '🔥',
  'orange'
FROM (
  SELECT user_id, COUNT(*) as course_count
  FROM public.courses
  WHERE status = 'published'
  GROUP BY user_id
  HAVING COUNT(*) >= 10
) c
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Expert Creator achievement (20 courses)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'courses',
  4,
  20,
  1000,
  '⭐',
  'yellow'
FROM (
  SELECT user_id, COUNT(*) as course_count
  FROM public.courses
  WHERE status = 'published'
  GROUP BY user_id
  HAVING COUNT(*) >= 20
) c
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Student milestone achievements
-- First Student (10 students)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'students',
  1,
  10,
  100,
  '👥',
  'green'
FROM public.courses c
JOIN (
  SELECT c2.user_id, COUNT(DISTINCT e.user_id) as student_count
  FROM public.courses c2
  JOIN public.enrollments e ON e.course_id = c2.id
  GROUP BY c2.user_id
  HAVING COUNT(DISTINCT e.user_id) >= 10
) stats ON stats.user_id = c.user_id
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Popular Teacher (50 students)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'students',
  2,
  50,
  500,
  '🎓',
  'blue'
FROM public.courses c
JOIN (
  SELECT c2.user_id, COUNT(DISTINCT e.user_id) as student_count
  FROM public.courses c2
  JOIN public.enrollments e ON e.course_id = c2.id
  GROUP BY c2.user_id
  HAVING COUNT(DISTINCT e.user_id) >= 50
) stats ON stats.user_id = c.user_id
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;

-- Teaching Legend (100 students)
INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
SELECT DISTINCT
  c.user_id,
  'students',
  3,
  100,
  1000,
  '🏆',
  'gold'
FROM public.courses c
JOIN (
  SELECT c2.user_id, COUNT(DISTINCT e.user_id) as student_count
  FROM public.courses c2
  JOIN public.enrollments e ON e.course_id = c2.id
  GROUP BY c2.user_id
  HAVING COUNT(DISTINCT e.user_id) >= 100
) stats ON stats.user_id = c.user_id
ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
