-- Add creator points tracking to user_points table
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS creator_points integer DEFAULT 0;

-- Add engagement tracking to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Function to award creator points when enrollment happens
CREATE OR REPLACE FUNCTION public.award_creator_enrollment_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_creator_id uuid;
BEGIN
  -- Get the course creator's user_id
  SELECT user_id INTO v_course_creator_id
  FROM public.courses
  WHERE id = NEW.course_id;
  
  -- Award 100 points to the creator
  INSERT INTO public.user_points (user_id, creator_points)
  VALUES (v_course_creator_id, 100)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    creator_points = user_points.creator_points + 100,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to award points on enrollment
DROP TRIGGER IF EXISTS award_creator_points_on_enrollment ON public.enrollments;
CREATE TRIGGER award_creator_points_on_enrollment
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.award_creator_enrollment_points();

-- Function to increment course views
CREATE OR REPLACE FUNCTION public.increment_course_views(course_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = course_id_param;
END;
$$;

-- Function to toggle course like and award points
CREATE OR REPLACE FUNCTION public.toggle_course_like(course_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_course_creator_id uuid;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM public.course_ratings 
    WHERE course_id = course_id_param AND user_id = user_id_param
  ) INTO v_exists;
  
  -- Get course creator
  SELECT user_id INTO v_course_creator_id
  FROM public.courses
  WHERE id = course_id_param;
  
  IF v_exists THEN
    -- Unlike: remove like and decrease count
    DELETE FROM public.course_ratings 
    WHERE course_id = course_id_param AND user_id = user_id_param;
    
    UPDATE public.courses
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = course_id_param;
    
    -- Remove 10 points from creator
    UPDATE public.user_points
    SET creator_points = GREATEST(creator_points - 10, 0)
    WHERE user_id = v_course_creator_id;
    
    RETURN false;
  ELSE
    -- Like: add like and increase count
    INSERT INTO public.course_ratings (course_id, user_id, rating)
    VALUES (course_id_param, user_id_param, 5)
    ON CONFLICT (course_id, user_id) DO NOTHING;
    
    UPDATE public.courses
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = course_id_param;
    
    -- Award 10 points to creator
    INSERT INTO public.user_points (user_id, creator_points)
    VALUES (v_course_creator_id, 10)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      creator_points = user_points.creator_points + 10,
      updated_at = now();
    
    RETURN true;
  END IF;
END;
$$;

-- Create creator leaderboard view
CREATE OR REPLACE VIEW public.creator_leaderboard AS
SELECT 
  up.user_id,
  up.creator_points,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  COUNT(DISTINCT e.id) as total_students,
  COUNT(DISTINCT c.id) as total_courses,
  SUM(COALESCE(c.views_count, 0)) as total_views,
  SUM(COALESCE(c.likes_count, 0)) as total_likes,
  ROW_NUMBER() OVER (ORDER BY up.creator_points DESC) as rank
FROM public.user_points up
JOIN public.profiles p ON p.user_id = up.user_id
LEFT JOIN public.courses c ON c.user_id = up.user_id AND c.status = 'published'
LEFT JOIN public.enrollments e ON e.course_id = c.id
WHERE up.creator_points > 0
GROUP BY up.user_id, up.creator_points, p.display_name, p.farcaster_username, p.avatar_url
ORDER BY up.creator_points DESC;

COMMENT ON VIEW public.creator_leaderboard IS 'Leaderboard for content creators based on engagement and enrollments';