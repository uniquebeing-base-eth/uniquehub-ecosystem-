-- Delete duplicate modules, keeping only the first occurrence of each module_number per course
DELETE FROM learning_modules
WHERE id NOT IN (
  SELECT DISTINCT ON (course_id, module_number) id
  FROM learning_modules
  WHERE course_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002')
  ORDER BY course_id, module_number, created_at ASC
)
AND course_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');