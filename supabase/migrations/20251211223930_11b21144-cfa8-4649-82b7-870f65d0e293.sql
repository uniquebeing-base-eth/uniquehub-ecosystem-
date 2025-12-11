-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily reminder notification at 8 PM UTC (20:00)
-- This gives users ~4 hours before midnight to claim their daily reward
SELECT cron.schedule(
  'send-daily-checkin-reminder',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/send-daily-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWNyaGZjZmxyZXBzZGxjdnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDk4ODIsImV4cCI6MjA3NDMyNTg4Mn0.hJJJ9drHMwaYqG6l05urZGnHWPdtTaXZEBatFc-axfE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);