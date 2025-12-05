-- Update all modules for the 6 new courses to have 100 points instead of 10
UPDATE learning_modules 
SET points_reward = 100
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
);