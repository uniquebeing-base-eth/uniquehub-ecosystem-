-- Create enum for point event types
CREATE TYPE public.point_event_type AS ENUM (
  'daily_checkin',
  'weekly_checkin',
  'monthly_checkin',
  'buy_volume',
  'trade_volume'
);

-- Create user_points table to track total UP points
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  weekly_streak INTEGER NOT NULL DEFAULT 0,
  monthly_streak INTEGER NOT NULL DEFAULT 0,
  last_daily_checkin TIMESTAMP WITH TIME ZONE,
  last_weekly_checkin TIMESTAMP WITH TIME ZONE,
  last_monthly_checkin TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create point_events table to track all point-earning events
CREATE TABLE public.point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type point_event_type NOT NULL,
  points_earned INTEGER NOT NULL,
  transaction_amount NUMERIC,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard view for easy querying
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  up.user_id,
  p.display_name,
  p.farcaster_username,
  p.avatar_url,
  up.total_points,
  up.daily_streak,
  up.weekly_streak,
  up.monthly_streak,
  RANK() OVER (ORDER BY up.total_points DESC) as rank
FROM public.user_points up
LEFT JOIN public.profiles p ON p.user_id = up.user_id
ORDER BY up.total_points DESC;

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view all user points"
  ON public.user_points FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own points"
  ON public.user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.user_points FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for point_events
CREATE POLICY "Users can view their own point events"
  ON public.point_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own point events"
  ON public.point_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for app configuration (treasury wallet, fees, etc.)
CREATE TABLE public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Anyone can view app config"
  ON public.app_config FOR SELECT
  USING (true);

-- Insert default config values
INSERT INTO public.app_config (config_key, config_value) VALUES
  ('treasury_wallet_address', '0x0000000000000000000000000000000000000000'),
  ('gas_fee_usd', '0.01'),
  ('app_fee_usd', '0.02'),
  ('daily_checkin_points', '10'),
  ('weekly_checkin_points', '100'),
  ('monthly_checkin_points', '500'),
  ('max_volume_points_per_transaction', '1000');

-- Trigger to update updated_at on app_config
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();