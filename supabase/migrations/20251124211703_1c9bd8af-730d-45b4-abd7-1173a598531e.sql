-- First create the enrollment achievement function
CREATE OR REPLACE FUNCTION check_and_award_achievements_from_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  course_creator_id UUID;
  student_count INTEGER;
BEGIN
  -- Get the course creator's user_id
  SELECT user_id INTO course_creator_id
  FROM courses
  WHERE id = NEW.course_id;
  
  -- Count total students for this creator
  SELECT COUNT(DISTINCT e.user_id) INTO student_count
  FROM courses c
  LEFT JOIN enrollments e ON e.course_id = c.id
  WHERE c.user_id = course_creator_id;
  
  -- Award student milestone achievements
  -- First Student (10 students) - 100 points
  IF student_count >= 10 THEN
    INSERT INTO creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (course_creator_id, 'students', 1, 10, 100, '👥', 'green')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Popular Teacher (50 students) - 500 points
  IF student_count >= 50 THEN
    INSERT INTO creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (course_creator_id, 'students', 2, 50, 500, '🎓', 'blue')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Teaching Legend (100 students) - 1000 points
  IF student_count >= 100 THEN
    INSERT INTO creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (course_creator_id, 'students', 3, 100, 1000, '🏆', 'gold')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  -- Education Icon (500 students) - 5000 points
  IF student_count >= 500 THEN
    INSERT INTO creator_achievements (user_id, achievement_type, achievement_level, milestone_value, points_awarded, badge_icon, badge_color)
    VALUES (course_creator_id, 'students', 4, 500, 5000, '🌟', 'purple')
    ON CONFLICT (user_id, achievement_type, achievement_level) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the enrollment trigger
DROP TRIGGER IF EXISTS trigger_check_achievements_on_enrollment ON enrollments;
CREATE TRIGGER trigger_check_achievements_on_enrollment
AFTER INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION check_and_award_achievements_from_enrollment();