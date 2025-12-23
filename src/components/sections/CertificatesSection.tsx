
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import { toast } from "sonner";



interface Certificate {
  id: string;
  course_id: string;
  course_title: string;
  user_id: string;
  token_id: number;
  image_url: string;
  minted_at: string;
  transaction_hash: string;
}

export const CertificatesSection = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('certificates')
          .select(`
            *,
            courses:course_id (
              title
            )
          `)
          .eq('user_id', user.id)
          .not('minted_at', 'is', null)
          .order('minted_at', { ascending: false });

        if (error) throw error;
        
        // Map the data to include course_title
        const mappedData = (data || []).map((cert: any) => ({
          ...cert,
          course_title: cert.courses?.title || 'Unknown Course'
        }));
        
        setCertificates(mappedData);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        toast.error('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  const handleDownload = async (imageUrl: string, courseTitle: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseTitle.replace(/\s+/g, '_')}_certificate.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-24">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
          <p className="text-sm text-muted-foreground">Loading your achievements...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="space-y-6 pb-24">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
          <p className="text-sm text-muted-foreground">Your NFT course completion certificates</p>
        </div>
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">No Certificates Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Complete courses and mint your achievement certificates as NFTs. They'll appear here!
            </p>
          </div>
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 'courses' }))}
            variant="default"
            className="mt-4"
          >
            Browse Courses
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="text-sm text-muted-foreground">
          {certificates.length} NFT {certificates.length === 1 ? 'Certificate' : 'Certificates'} Minted
        </p>
      </div>

      <div className="space-y-4">
        {certificates.map((cert) => (
          <Card key={cert.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <div className="relative">
              <img
                src={cert.image_url}
                alt={`${cert.course_title} Certificate`}
                className="w-full h-48 object-cover"
              />
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              >
                <Award className="w-3 h-3 mr-1" />
                NFT #{cert.token_id}
              </Badge>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-foreground leading-tight mb-1">
                  {cert.course_title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Minted on {new Date(cert.minted_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(cert.image_url, cert.course_title)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1"
                >
                  <a
                    href={`https://basescan.org/tx/${cert.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Basescan
                  </a>
                </Button>

                <ShareToFarcaster
                  text={`I just earned my "${cert.course_title}" certificate NFT on UniqueHub! 🎓✨`}
                  embeds={[cert.image_url, 'https://uniquehub.xyz']}
                  variant="outline"
                  size="sm"
                  buttonText="Share"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
