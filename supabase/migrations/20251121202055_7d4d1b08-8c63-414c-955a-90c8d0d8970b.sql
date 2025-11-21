-- Deactivate all courses except Web3 Basics and Crypto Basics
UPDATE learning_courses 
SET is_active = false 
WHERE id NOT IN (
  '550e8400-e29b-41d4-a716-446655440001', -- Web3 Basics
  '550e8400-e29b-41d4-a716-446655440002'  -- Crypto Basics
);