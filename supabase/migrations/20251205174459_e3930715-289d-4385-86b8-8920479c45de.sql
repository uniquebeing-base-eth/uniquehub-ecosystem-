-- Fix module content structure: change correctAnswer to correct, and add lesson property
UPDATE learning_modules
SET content = jsonb_build_object(
  'lesson', content->'sections'->0->>'content',
  'quiz', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'question', q->>'question',
        'options', q->'options',
        'correct', (q->>'correctAnswer')::int
      )
    )
    FROM jsonb_array_elements(content->'quiz') AS q
  )
)
WHERE course_id IN (
  SELECT id FROM learning_courses 
  WHERE title IN (
    'DeFi for Beginners',
    'Smart Contracts Basics', 
    'AI Basics',
    'Prompt Engineering',
    'Intro to Cybersecurity',
    'How to Stay Safe in Crypto'
  )
)
AND content->'quiz' IS NOT NULL;