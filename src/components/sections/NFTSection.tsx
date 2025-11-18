import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import nftPlaceholder from "@/assets/nft-placeholder.png";

export const NFTSection = () => {
  const { user } = useAuth();
  const { address } = useFarcasterWallet();
  const [isGenerating, setIsGenerating] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadExistingNFT();
  }, [user]);

  const loadExistingNFT = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
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

  // Ensure we have a public HTTP image URL for Farcaster embeds
  useEffect(() => {
    const prepareShareImage = async () => {
      const url = nftData?.image_url as string | undefined;
      if (!url) {
        setShareImageUrl(null);
        return;
      }
      // If already http(s), we're good
      if (/^https?:\/\//i.test(url)) {
        setShareImageUrl(url);
        return;
      }
      // Convert data URL to a public URL via Supabase Storage
      if (typeof url === 'string' && url.startsWith('data:')) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const avatarId = nftData?.id || crypto.randomUUID();
          const pngPath = `avatars/${user?.id || address}/${avatarId}-share.png`;
          const { error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(pngPath, blob, { contentType: 'image/png' });
          if (uploadError && !String(uploadError.message || uploadError).includes('already exists')) {
            throw uploadError as any;
          }
          const { data: pub } = supabase.storage.from('certificates').getPublicUrl(pngPath);
          setShareImageUrl(pub.publicUrl);
        } catch (e) {
          console.error('Failed to prepare share image URL', e);
          setShareImageUrl(null);
        }
      } else {
        // Fallback
        setShareImageUrl(url);
      }
    };

    prepareShareImage();
  }, [nftData?.image_url, nftData?.id, user?.id, address]);

  const generateNFT = async () => {
    if (!user) {
      toast.error("Please sign in to generate your NFT");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-nft-character",
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (error) throw error;

      if (data?.error) {
        if (data.existing) {
          setNftData(data.existing);
          toast.info("You already have a unique NFT character!");
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.nft) {
        setNftData(data.nft);
        toast.success("Your unique NFT character has been generated!");
      }
    } catch (error: any) {
      console.error("Error generating NFT:", error);
      toast.error(error.message || "Failed to generate NFT");
    } finally {
      setIsGenerating(false);
    }
  };

  // Minting temporarily disabled

  const downloadNFT = () => {
    if (!nftData?.image_url) return;

    const link = document.createElement("a");
    link.href = nftData.image_url;
    link.download = `uniquehub-nft-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("NFT image downloaded!");
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
          Generate your own unique Avatar. Blue energies, unique minds, and
          infinite possibilities.
        </p>
      </div>

      {!nftData ? (
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20">
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-1">
                <img 
                  src={nftPlaceholder} 
                  alt="NFT Placeholder"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Create Your Avatar
                </h3>
              </div>
              <Button
                onClick={generateNFT}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate My Avatar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                One generation per account
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
            <div className="space-y-6">
              <div className="aspect-square rounded-xl overflow-hidden bg-background/50">
                <img
                  src={nftData.image_url}
                  alt="Your unique NFT avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Display Name</p>
                    <p className="font-medium">
                      {nftData.metadata?.displayName || nftData.metadata?.display_name || "UniqueHub User"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hair Style</p>
                    <p className="font-medium">
                      {nftData.metadata?.hairStyle || nftData.metadata?.hair_style || "Blue"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={downloadNFT}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <ShareToFarcaster
                      text="Check out my unique avatar on @uniquehub! 🎨✨"
                      embeds={
                        shareImageUrl
                          ? [shareImageUrl, "https://uniqueehub.vercel.app"]
                          : ["https://uniqueehub.vercel.app"]
                      }
                      variant="outline"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
