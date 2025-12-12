-- Create table for storing Farcaster notification tokens
CREATE TABLE IF NOT EXISTS public.farcaster_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL UNIQUE,
  notification_token TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farcaster_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (notifications are managed by backend)
CREATE POLICY "Service role can manage notifications"
ON public.farcaster_notifications
FOR ALL
USING (auth.role() = 'service_role');

-- Delete all test data from courses
DELETE FROM public.courses;

-- Delete all test data from marketplace_items  
DELETE FROM public.marketplace_items;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_farcaster_notifications_fid 
ON public.farcaster_notifications(fid);

