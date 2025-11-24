import { useState, useEffect } from 'react';
import { base, celo } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, ExternalLink, Loader2 } from 'lucide-react';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useViemClients } from '@/hooks/useViemClients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';
import {
  CERTIFICATE_CONTRACT_ABI,
  CERTIFICATE_CONTRACT_ADDRESS,
  CELO_CERTIFICATE_CONTRACT_ADDRESS,
  CERTIFICATE_MINT_FEE
} from '@/config/wagmi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedChain, setSelectedChain] = useState<'base' | 'celo'>('base');

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
      toast.error("Please connect your wallet");
      return;
    }

    const contractAddress = selectedChain === 'celo' 
      ? CELO_CERTIFICATE_CONTRACT_ADDRESS 
      : CERTIFICATE_CONTRACT_ADDRESS;

    const chain = selectedChain === 'celo' ? celo : base;
    const explorerUrl = selectedChain === 'celo' 
      ? 'https://celoscan.io/tx/'
      : 'https://basescan.org/tx/';

    if (selectedChain === 'celo' && contractAddress === '0x0000000000000000000000000000000000000000') {
      toast.error("CELO contract not yet deployed. Coming soon for Proof-of-Ship!");
      return;
    }

    setIsMinting(true);
    try {
      // Call the mint function on the contract
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: CERTIFICATE_CONTRACT_ABI,
        functionName: 'mintCertificate',
        args: [certificate.image_url],
        value: CERTIFICATE_MINT_FEE,
        chain,
        account: address,
      });

      toast.success(`Minting transaction submitted on ${selectedChain.toUpperCase()}!`);

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      // Update certificate record with transaction hash and chain
      await supabase
        .from('certificates')
        .update({ 
          transaction_hash: hash,
          minted_at: new Date().toISOString()
        })
        .eq('id', certificate.id);

      toast.success(`Certificate minted successfully on ${selectedChain.toUpperCase()}!`);
      await checkExistingCertificate();
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
            
            <div className="space-y-2">
              {!certificate.minted_at ? (
                <>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Certificate generated! Choose a blockchain and mint it as an NFT.
                    </p>
                    <Select value={selectedChain} onValueChange={(value: 'base' | 'celo') => setSelectedChain(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Base Mainnet</SelectItem>
                        <SelectItem value="celo">CELO (Proof-of-Ship) 🌿</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={mintCertificate}
                    disabled={isMinting || !address}
                    className="w-full bg-gradient-primary"
                    size="sm"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Minting NFT on {selectedChain.toUpperCase()}...
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5 mr-1.5" />
                        Mint on {selectedChain.toUpperCase()} (0.000003 {selectedChain === 'celo' ? 'CELO' : 'ETH'})
                      </>
                    )}
                  </Button>
                </>
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
                    text={`I just earned my "${courseTitle}" certificate NFT on @uniquehub! 🎓✨`}
                    embeds={[certificate.image_url, 'https://uniqueehub.vercel.app']}
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
