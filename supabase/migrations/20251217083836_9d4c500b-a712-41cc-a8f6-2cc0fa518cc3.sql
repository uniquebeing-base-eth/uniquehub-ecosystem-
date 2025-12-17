-- Create bloomers_mints table to track Bloomers NFT mints
CREATE TABLE public.bloomers_mints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_id INTEGER,
  transaction_hash TEXT UNIQUE,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_bloomers_wallet ON public.bloomers_mints(wallet_address);

-- Enable RLS
ALTER TABLE public.bloomers_mints ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view bloomers mints (for leaderboard)
CREATE POLICY "Anyone can view bloomers mints"
ON public.bloomers_mints
FOR SELECT
USING (true);

-- Allow service role to manage mints
CREATE POLICY "Service role can manage bloomers mints"
ON public.bloomers_mints
FOR ALL
USING (auth.role() = 'service_role');