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
      // Build Farcaster composer URL with intent
      const encodedText = encodeURIComponent(text);
      let composerUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
      
      // Add embeds if provided
      if (embeds && embeds.length > 0) {
        const embedParams = embeds.map(embed => `&embeds[]=${encodeURIComponent(embed)}`).join('');
        composerUrl += embedParams;
      }
      
      // Open in new window/tab or in the current app
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
