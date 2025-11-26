import { useState, useEffect } from 'react';
import { base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, ExternalLink, Loader2 } from 'lucide-react';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useViemClients } from '@/hooks/useViemClients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CERTIFICATE_CONTRACT_ABI,
  CERTIFICATE_CONTRACT_ADDRESS,
  CERTIFICATE_MINT_FEE
} from '@/config/wagmi';

interface CertificateClaimProps {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
}

export const CertificateClaim = ({ courseId, courseTitle, isCompleted }: CertificateClaimProps) => {
  const { address } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [certificate, setCertificate] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [hasAlreadyMintedOnChain, setHasAlreadyMintedOnChain] = useState(false);
  const [checkingOnChain, setCheckingOnChain] = useState(false);

  // Check if certificate already exists in DB and on-chain
  useEffect(() => {
    if (isCompleted && address) {
      checkExistingCertificate();
      checkOnChainMintStatus();
    }
  }, [isCompleted, address]);

  const checkOnChainMintStatus = async () => {
    if (!publicClient || !address) return;
    
    setCheckingOnChain(true);
    try {
      // @ts-ignore - viem types issue with readContract
      const hasMinted = await publicClient.readContract({
        address: CERTIFICATE_CONTRACT_ADDRESS,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'hasUserMinted',
        args: [address],
      }) as boolean;
      setHasAlreadyMintedOnChain(hasMinted);
    } catch (error) {
      console.error('Error checking on-chain mint status:', error);
    } finally {
      setCheckingOnChain(false);
    }
  };

  const checkExistingCertificate = async () => {
    const { data } = await supabase
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (data) {
      setCertificate(data);
    }
  };

  const generateCertificate = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId }
      });

      if (error) throw error;

      setCertificate(data.certificate);
      toast.success("Certificate generated! Ready to mint.");
    } catch (error: any) {
      console.error('Generate certificate error:', error);
      toast.error(error.message || "Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  const mintCertificate = async () => {
    if (!certificate || !address || !walletClient || !publicClient) {
      toast.error("Please connect your wallet");
      return;
    }

    // Double-check on-chain status before minting
    try {
      // @ts-ignore - viem types issue with readContract
      const hasMinted = await publicClient.readContract({
        address: CERTIFICATE_CONTRACT_ADDRESS,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'hasUserMinted',
        args: [address],
      }) as boolean;
      
      if (hasMinted) {
        setHasAlreadyMintedOnChain(true);
        toast.error("You have already minted a certificate NFT. The contract only allows one per wallet.");
        return;
      }
    } catch (error) {
      console.error('Error checking mint status:', error);
    }

    setIsMinting(true);
    try {
      // Call the mint function on the contract
      const hash = await walletClient.writeContract({
        address: CERTIFICATE_CONTRACT_ADDRESS,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'mintCertificate',
        args: [certificate.token_uri || certificate.image_url],
        value: CERTIFICATE_MINT_FEE,
        chain: base,
        account: address,
      });

      toast.success("Minting transaction submitted!");

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      // Update certificate record with transaction hash
      await supabase
        .from('certificates')
        .update({ 
          transaction_hash: hash,
          minted_at: new Date().toISOString()
        })
        .eq('id', certificate.id);

      toast.success("Certificate minted successfully!");
      setHasAlreadyMintedOnChain(true);
      await checkExistingCertificate();
    } catch (error: any) {
      console.error('Mint error:', error);
      // Check for specific revert reason
      if (error.message?.includes('Already minted') || error.message?.includes('already minted')) {
        setHasAlreadyMintedOnChain(true);
        toast.error("You have already minted a certificate NFT.");
      } else {
        toast.error(error.shortMessage || error.message || "Failed to mint certificate");
      }
    } finally {
      setIsMinting(false);
    }
  };

  if (!isCompleted) return null;

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Course Completion Certificate</h3>
        </div>

        {!certificate ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Congratulations on completing this course! Claim your NFT certificate to showcase your achievement.
            </p>
            <Button
              onClick={generateCertificate}
              disabled={isGenerating || !address}
              className="w-full bg-gradient-primary"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating Certificate...
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Generate Certificate
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img
                src={certificate.image_url}
                alt="Certificate"
                className="w-4/5 max-w-sm rounded-lg border border-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              {!certificate.minted_at ? (
                hasAlreadyMintedOnChain ? (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertDescription className="text-xs">
                      You've already minted a certificate NFT from another course. The current contract only allows one certificate NFT per wallet. Your certificate image is saved and viewable above.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Certificate generated! Mint it as an NFT on Base blockchain.
                    </p>
                    <Button
                      onClick={mintCertificate}
                      disabled={isMinting || !address || checkingOnChain}
                      className="w-full bg-gradient-primary"
                      size="sm"
                    >
                      {checkingOnChain ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Checking...
                        </>
                      ) : isMinting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Minting NFT...
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5 mr-1.5" />
                          Mint Certificate NFT (0.000003 ETH)
                        </>
                      )}
                    </Button>
                  </>
                )
              ) : (
                <>
                  <p className="text-xs text-success font-semibold">✅ Certificate Minted!</p>
                  {certificate.transaction_hash && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`https://basescan.org/tx/${certificate.transaction_hash}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View on Basescan
                    </Button>
                  )}
                  <ShareToFarcaster
                    text={`I just minted my certificate NFT for completing "${courseTitle}" on @uniquehub! 🎓✨\n\nView: ${certificate.image_url}`}
                    embeds={['https://uniqueehub.vercel.app']}
                    buttonText="Share Certificate"
                    variant="default"
                    size="sm"
                    className="w-full bg-gradient-primary"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
