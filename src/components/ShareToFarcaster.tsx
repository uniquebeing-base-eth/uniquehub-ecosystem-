import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sdk } from '@farcaster/miniapp-sdk';

interface ShareToFarcasterProps {
  text: string;
  embeds?: string[];
  className?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  // For dynamic frame generation
  frameTitle?: string;
  frameDescription?: string;
  frameImage?: string;
  frameUrl?: string;
}

export const ShareToFarcaster = ({ 
  text, 
  embeds, 
  className, 
  buttonText,
  variant = "ghost", 
  size = "icon",
  frameTitle,
  frameDescription,
  frameImage,
  frameUrl
}: ShareToFarcasterProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      let embedsToShare: [] | [string] | [string, string] | undefined;
      
      // If frame props provided, create TWO embeds for side-by-side display
      if (frameTitle && frameImage && frameUrl) {
        const frameParams = new URLSearchParams({
          title: frameTitle,
          description: frameDescription || frameTitle,
          image: 'https://uniqueehub.vercel.app/opengraph-image.png', // Use anime background for frame
          url: frameUrl
        });
        const dynamicFrameUrl = `https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/farcaster-frame?${frameParams.toString()}`;
        
        // Two embeds: [actual image, frame with anime background + launch button]
        embedsToShare = [frameImage, dynamicFrameUrl] as [string, string];
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
