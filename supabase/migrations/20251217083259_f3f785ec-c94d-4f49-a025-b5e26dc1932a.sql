-- Add policy to allow viewing all minted NFTs for the leaderboard
CREATE POLICY "Anyone can view minted NFTs for leaderboard"
ON public.user_nft_generations
FOR SELECT
USING (is_minted = true);