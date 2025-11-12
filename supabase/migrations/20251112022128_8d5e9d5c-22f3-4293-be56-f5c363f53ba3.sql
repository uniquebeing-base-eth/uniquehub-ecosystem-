-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  certificate_id TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  token_id BIGINT,
  token_uri TEXT,
  transaction_hash TEXT,
  minted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX idx_certificates_user_course ON public.certificates(user_id, course_id);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
  ON public.certificates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.certificates IS 'Stores course completion certificates (NFTs)';
COMMENT ON COLUMN public.certificates.certificate_id IS 'Unique certificate identifier used on-chain';
COMMENT ON COLUMN public.certificates.token_id IS 'NFT token ID after minting';
COMMENT ON COLUMN public.certificates.token_uri IS 'IPFS or storage URL for NFT metadata';