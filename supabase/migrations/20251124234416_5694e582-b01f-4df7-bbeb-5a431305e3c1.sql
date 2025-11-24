-- Create table to track multichain reward claims
CREATE TABLE IF NOT EXISTS public.multichain_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chain_id text NOT NULL,
  amount numeric NOT NULL,
  transaction_hash text,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.multichain_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own claims"
ON public.multichain_claims
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own claims
CREATE POLICY "Users can insert their own claims"
ON public.multichain_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_multichain_claims_user_chain ON public.multichain_claims(user_id, chain_id, claimed_at);

-- Create index on transaction hash for verification
CREATE INDEX idx_multichain_claims_tx_hash ON public.multichain_claims(transaction_hash);