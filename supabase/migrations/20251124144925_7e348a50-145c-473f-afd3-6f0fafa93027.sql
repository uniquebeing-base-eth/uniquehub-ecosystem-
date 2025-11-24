-- Add chain column to certificates table to track which blockchain the certificate was minted on
ALTER TABLE public.certificates 
ADD COLUMN chain text DEFAULT 'base';

-- Add comment to explain the column
COMMENT ON COLUMN public.certificates.chain IS 'Blockchain where the certificate NFT was minted (base or celo)';

-- Create index for faster queries by chain
CREATE INDEX idx_certificates_chain ON public.certificates(chain);