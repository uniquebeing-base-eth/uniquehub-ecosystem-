
-- Recalculate all creator points based on accurate enrollment counts
WITH creator_stats AS (
  SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) as total_courses,
    SUM(c.enrollment_count) as total_students,
    SUM(c.likes_count) as total_likes
  FROM public.courses c
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
