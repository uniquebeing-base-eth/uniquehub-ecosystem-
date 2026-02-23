
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  text: string;
  url?: string;
  embeds?: string[];
  className?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showFarcaster?: boolean;
  showTwitter?: boolean;
}

export const ShareButtons = ({
  text,
  url = 'https://uniquehub.xyz',
  embeds,
  className,
  buttonText,
  variant = "ghost",
  size = "sm",
  showFarcaster = true,
  showTwitter = true,
}: ShareButtonsProps) => {
  const [isSharingFc, setIsSharingFc] = useState(false);

  const handleShareFarcaster = async () => {
    setIsSharingFc(true);
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const embedsToShare = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
      await sdk.actions.composeCast({ text, embeds: embedsToShare });
    } catch (error: any) {
      if (error?.message && !error.message.includes('cancel')) {
        toast.error('Failed to share to Farcaster');
      }
    } finally {
      setIsSharingFc(false);
    }
  };

  const handleShareTwitter = () => {
    const tweetText = encodeURIComponent(text);
    const tweetUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {showFarcaster && (
        <Button
          variant={variant}
          size={size}
          onClick={handleShareFarcaster}
          disabled={isSharingFc}
          title="Share to Farcaster"
        >
          {isSharingFc ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          {size !== "icon" && <span className="ml-1.5">Farcaster</span>}
        </Button>
      )}
      {showTwitter && (
        <Button
          variant={variant}
          size={size}
          onClick={handleShareTwitter}
          title="Share to X/Twitter"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {size !== "icon" && <span className="ml-1.5">X/Twitter</span>}
        </Button>
      )}
    </div>
  );
};
