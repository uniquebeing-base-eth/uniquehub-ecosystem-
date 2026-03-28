
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';


export const StatsGlowCard = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUsername(data.display_name || 'User');
      }
    };
    fetchUsername();
  }, [user]);

  const handleGenerateCard = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-stats-card');

      if (error) throw error;

      if (data.success) {
        setGeneratedCardUrl(data.imageUrl);
        toast.success('Profile card generated!');
      }
    } catch (error: any) {
      console.error('Error generating card:', error);
      toast.error(error.message || 'Failed to generate profile card');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <div className="p-6 space-y-4">
        {!generatedCardUrl ? (
          <Button 
            onClick={handleGenerateCard} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Card...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Profile Card
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border shadow-lg">
              <img 
                src={generatedCardUrl} 
                alt="Profile Stats Card" 
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateCard}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              
              <ShareToFarcaster 
                text={`Check out my UniqueHub stats! 🎮\n\n${username} on @uniquehub\n\nLearn, earn, and trade on Base!`}
                embeds={[generatedCardUrl, 'https://uniquehub.xyz']}
                buttonText="Share to Farcaster"
                variant="default"
                size="default"
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
