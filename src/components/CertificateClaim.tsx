import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';

const CERTIFICATE_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const; // UPDATE AFTER DEPLOYMENT
const CERTIFICATE_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'courseId', type: 'string' },
      { name: 'courseName', type: 'string' },
      { name: 'certificateId', type: 'string' },
      { name: 'tokenURI', type: 'string' }
    ],
    name: 'mintCertificate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

interface CertificateClaimProps {
  courseId: string;
  courseTitle: string;
  isCompleted: boolean;
}

export const CertificateClaim = ({ courseId, courseTitle, isCompleted }: CertificateClaimProps) => {
  const { address } = useAccount();
  const [certificate, setCertificate] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { writeContract, data: hash, isPending: isMinting } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Check if certificate already exists
  useState(() => {
    if (isCompleted && address) {
      checkExistingCertificate();
    }
  });

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
      toast({ title: "Please connect your wallet", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId }
      });

      if (error) throw error;

      setCertificate(data.certificate);
      toast({ title: "Certificate generated! Ready to mint." });
    } catch (error: any) {
      console.error('Generate certificate error:', error);
      toast({
        title: "Failed to generate certificate",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const mintCertificate = async () => {
    if (!certificate || !address) return;

    try {
      await writeContract({
        address: CERTIFICATE_CONTRACT_ADDRESS,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'mintCertificate',
        args: [
          address,
          courseId,
          courseTitle,
          certificate.certificate_id,
          certificate.token_uri
        ],
        value: parseEther('0.0000001')
      });

      // Update certificate with transaction hash after confirmation
      if (hash) {
        await supabase
          .from('certificates')
          .update({
            transaction_hash: hash,
            minted_at: new Date().toISOString()
          })
          .eq('id', certificate.id);
      }

      toast({ title: "Certificate NFT minted successfully! 🎉" });
    } catch (error: any) {
      console.error('Mint error:', error);
      toast({
        title: "Failed to mint certificate",
        description: error.message,
        variant: "destructive"
      });
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
            <img
              src={certificate.image_url}
              alt="Certificate"
              className="w-full rounded-lg border border-primary/20"
            />
            
            {!certificate.minted_at ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Mint your certificate as an NFT for 0.0000001 ETH (~$0.0003)
                </p>
                <Button
                  onClick={mintCertificate}
                  disabled={isMinting || isConfirming || !address}
                  className="w-full bg-gradient-primary"
                  size="sm"
                >
                  {isMinting || isConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      {isMinting ? 'Minting...' : 'Confirming...'}
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
