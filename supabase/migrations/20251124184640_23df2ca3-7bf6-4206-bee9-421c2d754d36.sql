-- Update points reward for all learning modules to 100
UPDATE learning_modules SET points_reward = 100 WHERE points_reward = 10;