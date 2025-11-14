import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const NFTSection = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
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
      const { data, error } = await supabase
        .from('user_nft_generations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNftData(data);
      }
    } catch (error) {
      console.error('Error loading NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNFT = async () => {
    if (!user) {
      toast.error("Please sign in to generate your NFT");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-nft-character', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

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
      console.error('Error generating NFT:', error);
      toast.error(error.message || "Failed to generate NFT");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadNFT = () => {
    if (!nftData?.image_url) return;
    
    const link = document.createElement('a');
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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
          Unique NFTs
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate your own unique Avatar. Blue energies, unique minds, and infinite possibilities.
        </p>
      </div>

      {!nftData ? (
        <div className="bg-card rounded-2xl border border-border p-8 max-w-2xl mx-auto text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border-2 border-primary/30">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Create Your Avatar</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Generate your own unique Avatar with blue energies, unique minds, and infinite possibilities.
            </p>
          </div>

          <Button
            onClick={generateNFT}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating Your Avatar...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Avatar
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            One generation per account
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden max-w-3xl mx-auto">
          <div className="relative aspect-video bg-gradient-to-br from-background to-primary/5">
            <img
              src={nftData.image_url}
              alt="Your Unique NFT Character"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {nftData.metadata?.display_name || "Your Character"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date(nftData.generated_at).toLocaleDateString()}
                </p>
              </div>
              
              <Button
                onClick={downloadNFT}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-success">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Your unique avatar is ready!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};