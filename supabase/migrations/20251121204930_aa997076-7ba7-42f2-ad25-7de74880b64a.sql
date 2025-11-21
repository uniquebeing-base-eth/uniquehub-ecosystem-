-- Update all learning modules to have 100 points reward
UPDATE learning_modules
SET points_reward = 100
WHERE points_reward != 100;