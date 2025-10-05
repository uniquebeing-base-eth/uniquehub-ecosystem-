import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareToFarcasterProps {
  text: string;
  embeds?: string[];
  className?: string;
}

export const ShareToFarcaster = ({ text, embeds, className }: ShareToFarcasterProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // In a real implementation, you'd get the signer UUID from the user's auth state
      // For now, we'll show a toast indicating the feature
      toast.info('Farcaster sharing will be available after connecting your Farcaster account with proper signer permissions.');
      
      // Example of how this would work with a real signer:
      // const { data, error } = await supabase.functions.invoke('share-to-farcaster', {
      //   body: {
      //     signerUuid: userSignerUuid,
      //     text,
      //     embeds: embeds || [],
      //   }
      // });
      // 
      // if (error) throw error;
      // if (data?.success) {
      //   toast.success('Shared to Farcaster!');
      // }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      toast.error('Failed to share to Farcaster');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4 mr-2" />
      )}
      Share to Farcaster
    </Button>
  );
};
