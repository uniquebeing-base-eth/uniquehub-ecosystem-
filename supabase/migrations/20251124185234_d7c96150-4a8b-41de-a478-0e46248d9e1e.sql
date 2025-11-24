-- Fix module content structure for new courses
-- Update modules to use "lesson" instead of "text" for consistency

-- NFTs Basics modules
UPDATE learning_modules 
SET content = jsonb_set(
  content - 'text',
  '{lesson}',
  content->'text'
)
WHERE course_id IN (SELECT id FROM learning_courses WHERE title = 'NFTs Basics')
AND content ? 'text';

-- Blockchain for Beginners modules  
UPDATE learning_modules 
SET content = jsonb_set(
  content - 'text',
  '{lesson}',
  content->'text'
)
WHERE course_id IN (SELECT id FROM learning_courses WHERE title = 'Blockchain for Beginners')
AND content ? 'text';

-- How to Use a Crypto Wallet modules
UPDATE learning_modules 
SET content = jsonb_set(
  content - 'text',
  '{lesson}',
  content->'text'
)
WHERE course_id IN (SELECT id FROM learning_courses WHERE title = 'How to Use a Crypto Wallet')
AND content ? 'text';