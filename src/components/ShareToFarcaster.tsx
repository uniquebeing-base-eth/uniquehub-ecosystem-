import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sdk } from '@farcaster/miniapp-sdk';
import { supabase } from '@/integrations/supabase/client';

interface ShareToFarcasterProps {
  text: string;
  embeds?: string[];
  className?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  // For dynamic frame generation with template
  shareType?: 'course' | 'certificate' | 'nft' | 'marketplace' | 'general';
  shareTitle?: string;
  shareSubtitle?: string;
  shareUsername?: string;
  shareAvatar?: string;
  frameUrl?: string;
}

export const ShareToFarcaster = ({ 
  text, 
  embeds, 
  className, 
  buttonText,
  variant = "ghost", 
  size = "icon",
  shareType = 'general',
  shareTitle,
  shareSubtitle,
  shareUsername,
  shareAvatar,
  frameUrl
}: ShareToFarcasterProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      let embedsToShare: [] | [string] | [string, string] | undefined;
      
      // If share props provided, generate template-based share image
      if (shareType && shareTitle && frameUrl) {
        console.log('Generating template-based share image...');
        
        // Generate share image using template
        const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-share-image', {
          body: {
            type: shareType,
            title: shareTitle,
            subtitle: shareSubtitle,
            username: shareUsername || 'UniqueHub User',
            avatar: shareAvatar
          }
        });

        if (imageError) {
          console.error('Error generating share image:', imageError);
          throw imageError;
        }

        const shareImageUrl = imageData?.imageUrl;
        console.log('Generated share image URL:', shareImageUrl);

        // Create frame URL with generated image
        const frameParams = new URLSearchParams({
          title: shareTitle,
          description: shareSubtitle || shareTitle,
          image: shareImageUrl,
          url: frameUrl
        });
        const dynamicFrameUrl = `https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/farcaster-frame?${frameParams.toString()}`;
        embedsToShare = [dynamicFrameUrl] as [string];
      } else if (embeds) {
        // Use provided embeds (max 2 URLs)
        embedsToShare = embeds.slice(0, 2) as [] | [string] | [string, string] | undefined;
      }
      
      const result = await sdk.actions.composeCast({
        text,
        embeds: embedsToShare,
      });
      
      console.log('Compose cast result:', result);
    } catch (error: any) {
      console.error('Error sharing to Farcaster:', error);
      if (error?.message && !error.message.includes('cancel')) {
        toast.error('Failed to share cast');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
      title={buttonText || "Share to Farcaster"}
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      {buttonText && size !== "icon" && <span className="ml-2">{buttonText}</span>}
    </Button>
  );
};
