import { Card } from '@/components/ui/card';
import { Image } from 'lucide-react';
import { ShareToFarcaster } from './ShareToFarcaster';

interface LatestNFTCardProps {
  nft: {
    id: string;
    name: string | null;
    description: string | null;
    image_url: string | null;
    price_amount: number;
    price_currency: string;
    token_address: string;
    token_id: string;
    chain: string;
  };
}

export const LatestNFTCard = ({ nft }: LatestNFTCardProps) => {
  return (
    <Card className="p-4 hover:border-primary/50 transition-all duration-300">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          {nft.image_url ? (
            <img
              src={nft.image_url}
              alt={nft.name || 'NFT'}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Image className="w-10 h-10 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">
            {nft.name || `NFT #${nft.token_id.slice(0, 8)}`}
          </h4>
          {nft.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {nft.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">
                {nft.price_amount} {nft.price_currency}
              </span>
              <span className="text-xs text-muted-foreground">
                on {nft.chain}
              </span>
            </div>
            <ShareToFarcaster
              text={`Check out this NFT: ${nft.name || 'NFT'} on @uniquehub! 💎✨`}
              shareType="nft"
              shareTitle={nft.name || `NFT #${nft.token_id.slice(0, 8)}`}
              shareSubtitle={`${nft.price_amount} ${nft.price_currency} on ${nft.chain}`}
              shareUsername="UniqueHub"
              frameUrl={`https://uniqueehub.vercel.app?nft=${nft.id}`}
              variant="ghost"
              size="icon"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
