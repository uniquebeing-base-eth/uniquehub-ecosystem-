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
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 mx-auto text-primary" />
          <h3 className="text-xl font-bold text-foreground">Profile Stats Card</h3>
          <p className="text-sm text-muted-foreground">
            Generate a shareable card with your UniqueHub stats
          </p>
        </div>

        {!generatedCardUrl ? (
          <Button
            onClick={handleGenerateCard}
            disabled={isGenerating}
            className="w-full bg-gradient-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Profile Card...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Profile Card
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-primary/20">
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
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            <ShareToFarcaster
              text={`Check out my UniqueHub stats! 🎮✨\n\n${username} on @uniquehub\n\nLearn, earn, and trade on Base!`}
              embeds={[generatedCardUrl, 'https://uniqueehub.vercel.app']}
              buttonText="Share to Farcaster"
              variant="default"
              size="default"
              className="w-full bg-gradient-primary"
            />
          </div>
        )}
      </div>
    </Card>
  );
};
