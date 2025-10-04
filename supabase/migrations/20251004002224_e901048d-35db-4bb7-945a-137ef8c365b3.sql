-- Create course_payments table for tracking course purchases
CREATE TABLE public.course_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USDC', 'ETH')),
  transaction_hash TEXT,
  chain TEXT NOT NULL DEFAULT 'base',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on course_payments
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases and sales
CREATE POLICY "Users can view their own course payments"
ON public.course_payments
FOR SELECT
USING (auth.uid() = buyer_user_id OR auth.uid() = seller_user_id);

-- Authenticated users can create payment records
CREATE POLICY "Authenticated users can create course payments"
ON public.course_payments
FOR INSERT
WITH CHECK (auth.uid() = buyer_user_id);

-- Create nft_listings table for marketplace
CREATE TABLE public.nft_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  token_standard TEXT NOT NULL CHECK (token_standard IN ('ERC721', 'ERC1155')),
  chain TEXT NOT NULL DEFAULT 'base',
  price_amount NUMERIC NOT NULL,
  price_currency TEXT NOT NULL CHECK (price_currency IN ('USDC', 'ETH')),
  name TEXT,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_user_id UUID
);

-- Enable RLS on nft_listings
ALTER TABLE public.nft_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active listings
CREATE POLICY "Everyone can view active NFT listings"
ON public.nft_listings
FOR SELECT
USING (status = 'active' OR auth.uid() = user_id OR auth.uid() = buyer_user_id);

-- Users can create their own listings
CREATE POLICY "Users can create their own NFT listings"
ON public.nft_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update their own NFT listings"
ON public.nft_listings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete their own NFT listings"
ON public.nft_listings
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updating nft_listings updated_at
CREATE TRIGGER update_nft_listings_updated_at
BEFORE UPDATE ON public.nft_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_course_payments_buyer ON public.course_payments(buyer_user_id);
CREATE INDEX idx_course_payments_seller ON public.course_payments(seller_user_id);
CREATE INDEX idx_course_payments_course ON public.course_payments(course_id);
CREATE INDEX idx_nft_listings_user ON public.nft_listings(user_id);
CREATE INDEX idx_nft_listings_status ON public.nft_listings(status);
CREATE INDEX idx_nft_listings_token ON public.nft_listings(token_address, token_id);