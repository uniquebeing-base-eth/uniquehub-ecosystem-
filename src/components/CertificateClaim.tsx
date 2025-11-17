import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
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

  // Check if certificate already exists
  useEffect(() => {
    if (isCompleted && address) {
      checkExistingCertificate();
    }
  }, [isCompleted, address]);

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
      toast.error('Wallet not connected');
      return;
    }

    setIsMinting(true);
    try {
      toast.info('Please confirm the transaction in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: CERTIFICATE_CONTRACT_ADDRESS,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'mintCertificate',
        args: [
          address,
          courseId,
          courseTitle,
          certificate.certificate_id,
          certificate.token_uri || certificate.image_url
        ],
        value: CERTIFICATE_MINT_FEE,
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Minting transaction submitted. Waiting for confirmation...');
      
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Update database with transaction hash
      await supabase
        .from('certificates')
        .update({
          transaction_hash: hash,
          minted_at: new Date().toISOString()
        })
        .eq('id', certificate.id);
      
      await checkExistingCertificate();
      toast.success("Certificate NFT minted successfully! 🎉");
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || "Failed to mint certificate");
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
            
            {!certificate.minted_at ? (
              <div className="space-y-2">
                <Alert className="border-blue-500/20 bg-blue-500/5">
                  <AlertCircle className="h-3 w-3 text-blue-500" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    Your wallet may show a security warning. This is expected for new contracts. 
                    The transaction is safe. Click "Continue anyway" to proceed.
                  </AlertDescription>
                </Alert>
                <p className="text-xs text-muted-foreground">
                  Mint your certificate as an NFT for 0.0000001 ETH (~$0.0003)
                </p>
                <Button
                  onClick={mintCertificate}
                  disabled={isMinting || !address || !walletClient}
                  className="w-full bg-gradient-primary"
                  size="sm"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5 mr-1.5" />
                      Mint Certificate NFT (0.0000001 ETH)
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-success font-semibold">✅ Certificate Minted!</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(certificate.image_url, '_blank')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`https://basescan.org/tx/${certificate.transaction_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View on Basescan
                  </Button>
                </div>
                <ShareToFarcaster
                  text={`I just earned my certificate for completing "${courseTitle}" on @uniquehub! 🎓✨`}
                  embeds={[certificate.image_url, 'https://uniqueehub.vercel.app']}
                  buttonText="Share Certificate"
                  variant="default"
                  size="sm"
                  className="w-full bg-gradient-primary"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
