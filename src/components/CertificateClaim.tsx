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

  // Minting temporarily disabled
  
  const downloadCertificate = () => {
    if (!certificate) return;
    window.open(certificate.image_url, '_blank');
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
              <p className="text-xs text-success font-semibold">✅ Certificate Generated!</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={downloadCertificate}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
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
          </div>
        )}
      </div>
    </Card>
  );
};
