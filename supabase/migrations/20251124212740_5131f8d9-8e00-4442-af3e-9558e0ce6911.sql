-- Drop and recreate the course milestones trigger function with updated achievements
DROP FUNCTION IF EXISTS public.check_course_milestones() CASCADE;

CREATE OR REPLACE FUNCTION public.check_course_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_courses integer;
BEGIN
  -- Count total published courses for this creator
  SELECT COUNT(*) INTO total_courses
  FROM public.courses
  WHERE user_id = NEW.user_id AND status = 'published';
  
  -- Rookie Creator (1 course) - 50 points
  IF total_courses = 1 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 1, 1, 50, '🎯', 'green')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Content Crafter (3 courses) - 100 points
  IF total_courses = 3 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 2, 3, 100, '✍️', 'blue')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Course Master (5 courses) - 200 points
  IF total_courses = 5 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 3, 5, 200, '💎', 'cyan')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Course Sage (10 courses) - 500 points
  IF total_courses = 10 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 4, 10, 500, '🧙', 'purple')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Knowledge Artisan (15 courses) - 750 points
  IF total_courses = 15 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 5, 15, 750, '🎨', 'orange')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Education Architect (20 courses) - 1000 points
  IF total_courses = 20 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 6, 20, 1000, '🏗️', 'yellow')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Learning Legend (30 courses) - 2000 points
  IF total_courses = 30 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 7, 30, 2000, '🔥', 'red')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Grand Instructor (50 courses) - 5000 points
  IF total_courses = 50 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (NEW.user_id, 'courses', 8, 50, 5000, '👑', 'gold')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop and recreate the student milestones trigger function with updated achievements
DROP FUNCTION IF EXISTS public.check_student_milestones() CASCADE;

CREATE OR REPLACE FUNCTION public.check_student_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  creator_user_id uuid;
  total_students integer;
BEGIN
  -- Get the course creator
  SELECT user_id INTO creator_user_id
  FROM public.courses
  WHERE id = NEW.course_id;
  
  -- Count total unique students for this creator
  SELECT COUNT(DISTINCT e.user_id) INTO total_students
  FROM public.enrollments e
  JOIN public.courses c ON c.id = e.course_id
  WHERE c.user_id = creator_user_id;
  
  -- Student Spark (5 students) - 100 points
  IF total_students = 5 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 1, 5, 100, '⚡', 'green')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Rising Mentor (10 students) - 200 points
  IF total_students = 10 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 2, 10, 200, '🌟', 'blue')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Student Master (20 students) - 500 points
  IF total_students = 20 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 3, 20, 500, '🎓', 'cyan')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Audience Builder (50 students) - 1000 points
  IF total_students = 50 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 4, 50, 1000, '📢', 'purple')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Edu Influencer (100 students) - 2000 points
  IF total_students = 100 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 5, 100, 2000, '💫', 'orange')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Community Mentor (200 students) - 3000 points
  IF total_students = 200 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 6, 200, 3000, '🤝', 'yellow')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Knowledge Magnet (500 students) - 5000 points
  IF total_students = 500 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 7, 500, 5000, '🧲', 'red')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Master Educator (1000 students) - 10000 points
  IF total_students = 1000 THEN
    INSERT INTO public.creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (creator_user_id, 'students', 8, 1000, 10000, '🏆', 'gold')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate triggers
CREATE TRIGGER trigger_check_course_milestones
  AFTER INSERT ON public.courses
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION public.check_course_milestones();

CREATE TRIGGER trigger_check_student_milestones
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_student_milestones();