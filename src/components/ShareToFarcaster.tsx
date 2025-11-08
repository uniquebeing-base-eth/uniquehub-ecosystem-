import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
      // Prefer native Farcaster Mini App composer when available
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        if (context) {
          const preparedEmbeds = embeds && embeds.length > 0
            ? (embeds.length === 1
                ? [embeds[0]] as [string]
                : [embeds[0], embeds[1]] as [string, string])
            : undefined;
          await sdk.actions.composeCast({
            text,
            embeds: preparedEmbeds,
          });
          toast.success('Opening Farcaster composer...');
          return; // Stop here if SDK handled it
        }
      } catch (_) {
        // SDK not available or not in Farcaster context; fall back to Warpcast web intent
      }

      // Fallback: open Warpcast web composer
      const encodedText = encodeURIComponent(text);
      let composerUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
      if (embeds && embeds.length > 0) {
        const embedParams = embeds
          .filter(Boolean)
          .map((embed) => `&embeds[]=${encodeURIComponent(embed)}`)
          .join('');
        composerUrl += embedParams;
      }

      window.open(composerUrl, '_blank');
      toast.success('Opening Farcaster composer...');
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      toast.error('Failed to open Farcaster composer');
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
