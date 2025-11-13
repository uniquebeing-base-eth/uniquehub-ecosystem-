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
}

export const ShareToFarcaster = ({ 
  text, 
  embeds, 
  className, 
  buttonText,
  variant = "ghost", 
  size = "icon" 
}: ShareToFarcasterProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Use Farcaster SDK composeCast action for native sharing
      // Farcaster embeds support max 2 URLs
      const embedsToShare = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
      
      const result = await sdk.actions.composeCast({
        text,
        embeds: embedsToShare,
      });
      
      // Only show success if cast was actually created (not cancelled)
      console.log('Compose cast result:', result);
    } catch (error: any) {
      console.error('Error sharing to Farcaster:', error);
      // Only show error if it's not a user cancellation
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
