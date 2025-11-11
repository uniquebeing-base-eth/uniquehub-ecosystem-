-- Update function to set search_path for security
CREATE OR REPLACE FUNCTION increment_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = COALESCE(enrollment_count, 0) + 1,
      updated_at = now()
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';