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
      // Get signer UUID from Farcaster SDK context
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const context = await sdk.context;
      
      // Check if we have a signer UUID from the context
      let signerUuid = null;
      if (context && typeof context === 'object' && 'client' in context) {
        const client = (context as any).client;
        if (client && typeof client === 'object' && 'signerUuid' in client) {
          signerUuid = client.signerUuid;
        }
      }
      
      if (!signerUuid) {
        toast.error('Farcaster signer not available. Please open in Farcaster app.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('share-to-farcaster', {
        body: {
          signerUuid,
          text,
          embeds: embeds || [],
        }
      });
      
      if (error) throw error;
      if (data?.success) {
        toast.success('Shared to Farcaster!');
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      toast.error('Failed to share to Farcaster. Make sure you have posting permissions.');
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
