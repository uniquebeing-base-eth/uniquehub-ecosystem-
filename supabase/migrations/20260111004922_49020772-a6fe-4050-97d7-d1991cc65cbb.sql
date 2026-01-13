
-- Create sandbox_wallets table for test balances
CREATE TABLE public.sandbox_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  usdc_balance DECIMAL(18, 2) NOT NULL DEFAULT 10000.00,
  eth_balance DECIMAL(18, 6) NOT NULL DEFAULT 5.000000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sandbox_wallets ENABLE ROW LEVEL SECURITY;

-- Policies for sandbox_wallets
CREATE POLICY "Users can view their own wallet" 
ON public.sandbox_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.sandbox_wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
ON public.sandbox_wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create creator_coins table
CREATE TABLE public.creator_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  icon_url TEXT,
  total_supply DECIMAL(18, 0) NOT NULL DEFAULT 1000000,
  circulating_supply DECIMAL(18, 0) NOT NULL DEFAULT 0,
  holders_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_user_id),
  UNIQUE(symbol)
);

-- Enable RLS
ALTER TABLE public.creator_coins ENABLE ROW LEVEL SECURITY;

-- Policies for creator_coins
CREATE POLICY "Creator coins are viewable by everyone" 
ON public.creator_coins 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own coin" 
ON public.creator_coins 
FOR INSERT 
WITH CHECK (auth.uid() = creator_user_id);

CREATE POLICY "Users can update their own coin" 
ON public.creator_coins 
FOR UPDATE 
USING (auth.uid() = creator_user_id);

-- Create course_coins table (auto-created for each course)
CREATE TABLE public.course_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL UNIQUE,
  creator_coin_id UUID REFERENCES public.creator_coins(id),
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(15) NOT NULL,
  total_supply DECIMAL(18, 0) NOT NULL DEFAULT 100000,
  circulating_supply DECIMAL(18, 0) NOT NULL DEFAULT 0,
  holders_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_coins ENABLE ROW LEVEL SECURITY;

-- Policies for course_coins
CREATE POLICY "Course coins are viewable by everyone" 
ON public.course_coins 
FOR SELECT 
USING (true);

CREATE POLICY "Course owners can insert coins" 
ON public.course_coins 
FOR INSERT 
WITH CHECK (true);

-- Create user_token_balances table (holds all token balances)
CREATE TABLE public.user_token_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('creator_coin', 'course_coin', 'platform')),
  token_id UUID,
  token_symbol VARCHAR(15) NOT NULL,
  balance DECIMAL(18, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token_type, token_id)
);

-- Enable RLS
ALTER TABLE public.user_token_balances ENABLE ROW LEVEL SECURITY;

-- Policies for user_token_balances
CREATE POLICY "Users can view their own balances" 
ON public.user_token_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balances" 
ON public.user_token_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balances" 
ON public.user_token_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create sandbox_transactions table
CREATE TABLE public.sandbox_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('course_purchase', 'token_transfer', 'token_receive', 'coin_creation', 'nft_purchase', 'nft_sale')),
  amount DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(20) NOT NULL,
  token_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sandbox_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for sandbox_transactions
CREATE POLICY "Users can view transactions they are part of" 
ON public.sandbox_transactions 
FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create transactions" 
ON public.sandbox_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

-- Create user_onboarding table to track tutorial completion
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tutorial_completed BOOLEAN NOT NULL DEFAULT false,
  tutorial_skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Policies for user_onboarding
CREATE POLICY "Users can view their own onboarding" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" 
ON public.user_onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" 
ON public.user_onboarding 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to initialize sandbox wallet for new users
CREATE OR REPLACE FUNCTION public.initialize_sandbox_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create sandbox wallet with default balances
  INSERT INTO public.sandbox_wallets (user_id, usdc_balance, eth_balance)
  VALUES (NEW.user_id, 10000.00, 5.000000)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create onboarding record
  INSERT INTO public.user_onboarding (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to initialize wallet when profile is created
CREATE TRIGGER on_profile_created_init_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_sandbox_wallet();

-- Create updated_at triggers
CREATE TRIGGER update_sandbox_wallets_updated_at
  BEFORE UPDATE ON public.sandbox_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_coins_updated_at
  BEFORE UPDATE ON public.creator_coins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_token_balances_updated_at
  BEFORE UPDATE ON public.user_token_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
