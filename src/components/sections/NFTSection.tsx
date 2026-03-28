

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShareButtons } from "@/components/ShareButtons";
import nftPlaceholder from "@/assets/nft-placeholder.png";

export const NFTSection = () => {
  const { user } = useAuth();
  const [nftData, setNftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExistingNFT();
  }, [user]);

  const loadExistingNFT = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("user_nft_generations")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setNftData(data);
      }
    } catch (error) {
      console.error("Error loading NFT:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Unique NFTs
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Avatar minting has been retired. Thank you to all early minters! 🎨
        </p>
      </div>

      {nftData ? (
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden border-primary/20">
            <div className="aspect-square rounded-xl overflow-hidden bg-background/50 m-4">
              <img
                src={nftData.image_url}
                alt="Your unique NFT avatar"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">
                  {nftData.metadata?.displayName || nftData.metadata?.display_name || "Your Unique Avatar"}
                </h3>
                {nftData.is_minted && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    ✓ Minted
                  </Badge>
                )}
              </div>

              {nftData.is_minted && nftData.token_id && (
                <a
                  href={`https://basescan.org/nft/0x8610701D16e6e75d751bf362bef981F2D273b129/${nftData.token_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View on Basescan →
                </a>
              )}

              <ShareButtons
                text="Check out my unique avatar on @uniquehub! 🎨✨"
                url="https://uniquehub.xyz"
                embeds={
                  nftData.image_url?.startsWith('http')
                    ? [nftData.image_url, "https://uniquehub.xyz"]
                    : ["https://uniquehub.xyz"]
                }
              />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="max-w-md mx-auto p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Avatar Minting Retired</h3>
            <p className="text-sm text-muted-foreground">
              Avatar NFT minting is no longer available. Check out our courses and earn certificates instead!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
