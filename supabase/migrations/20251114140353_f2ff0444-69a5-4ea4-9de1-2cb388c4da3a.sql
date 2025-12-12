-- Create table for user NFT generations
CREATE TABLE IF NOT EXISTS public.user_nft_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  metadata JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_nft UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_nft_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own NFT generation"
ON public.user_nft_generations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NFT generation"
ON public.user_nft_generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_nft_generations_user_id ON public.user_nft_generations(user_id);

