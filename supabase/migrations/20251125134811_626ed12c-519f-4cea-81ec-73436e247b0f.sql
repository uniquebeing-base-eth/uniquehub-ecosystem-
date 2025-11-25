-- Add minting tracking fields to user_nft_generations table
ALTER TABLE user_nft_generations
ADD COLUMN IF NOT EXISTS is_minted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS minted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS token_id bigint,
ADD COLUMN IF NOT EXISTS transaction_hash text;

-- Drop existing update policy if it exists and create new one
DROP POLICY IF EXISTS "Users can update their own NFT generation" ON user_nft_generations;

CREATE POLICY "Users can update their own NFT generation"
ON user_nft_generations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);