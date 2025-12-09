-- Reset daily check-in for uniquebeing404 to test the new on-chain flow
UPDATE user_points 
SET 
  last_daily_checkin = NULL,
  daily_streak = 0
WHERE user_id = '2c97aed8-8499-4fd4-af03-cd39694d2554';