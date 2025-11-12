import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Award, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';

interface Certificate {
  id: string;
  certificate_id: string;
  course_id: string;
  image_url: string;
  token_uri: string | null;
  transaction_hash: string | null;
  minted_at: string | null;
  created_at: string;
  courses: {
    title: string;
  };
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
            id,
            certificate_id,
            course_id,
            image_url,
            token_uri,
            transaction_hash,
            minted_at,
            created_at,
            courses (
              title
            )
          `)
          .eq('user_id', user.id)
          .not('minted_at', 'is', null)
          .order('minted_at', { ascending: false });

        if (error) throw error;

        setCertificates(data || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Your NFT course completion certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="p-8 text-center">
          <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-2">No certificates yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete courses to earn NFT certificates
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">
                      {cert.courses.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Minted on {new Date(cert.minted_at!).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <img
                    src={cert.image_url}
                    alt={`Certificate for ${cert.courses.title}`}
                    className="w-full max-w-sm rounded-lg border border-primary/20"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(cert.image_url, '_blank')}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`https://basescan.org/tx/${cert.transaction_hash}`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View on Basescan
                  </Button>
                </div>

                <ShareToFarcaster
                  text={`Check out my certificate for completing "${cert.courses.title}" on @uniquehub! 🎓✨`}
                  embeds={[cert.image_url, 'https://uniqueehub.vercel.app']}
                  buttonText="Share Certificate"
                  variant="default"
                  size="sm"
                  className="w-full bg-gradient-primary"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
