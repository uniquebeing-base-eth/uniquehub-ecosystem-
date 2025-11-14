import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { useViemClients } from "@/hooks/useViemClients";
import { useReadContract } from "wagmi";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import {
  UNIQUE_NFT_ABI,
  UNIQUE_NFT_ADDRESS,
  USDC_ABI,
  USDC_ADDRESS,
  NFT_MINT_PRICE,
} from "@/config/wagmi";
import nftPlaceholder from "@/assets/nft-placeholder.png";

export const NFTSection = () => {
  const { user } = useAuth();
  const { address } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);

  // Check if user has minted on-chain
  const { data: hasMintedOnChain, refetch: refetchHasMinted } = useReadContract({
    address: UNIQUE_NFT_ADDRESS,
    abi: UNIQUE_NFT_ABI,
    functionName: "hasUserMinted",
    args: address ? [address] : undefined,
  });

  // Get user's token ID
  const { data: userTokenId, refetch: refetchUserTokenId } = useReadContract({
    address: UNIQUE_NFT_ADDRESS,
    abi: UNIQUE_NFT_ABI,
    functionName: "getUserTokenId",
    args: address ? [address] : undefined,
  });

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, UNIQUE_NFT_ADDRESS] : undefined,
  });

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

  const mintNFT = async () => {
    if (!nftData?.image_url || !address || !walletClient || !publicClient) {
      toast.error("Please generate an NFT first and connect your wallet");
      return;
    }

    setIsMinting(true);
    try {
      const required = NFT_MINT_PRICE;
      let currentAllowance: bigint = 0n;
      try {
        currentAllowance = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "allowance",
          args: [address, UNIQUE_NFT_ADDRESS],
        } as any)) as bigint;
      } catch (e) {
        // fallback to hook value if read fails
        currentAllowance = (allowance as bigint | undefined) ?? 0n;
      }

      if (currentAllowance < required) {
        // Reset non-zero allowance to 0 first for USDC compatibility
        if (currentAllowance > 0n) {
          toast.info("Resetting existing USDC allowance...");
          const resetHash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "approve",
            args: [UNIQUE_NFT_ADDRESS, 0n],
            account: address,
            chain: walletClient.chain,
          } as any);
          await publicClient.waitForTransactionReceipt({ hash: resetHash });
        }

        toast.info("Approving USDC...");
        const approveHash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [UNIQUE_NFT_ADDRESS, required],
          account: address,
          chain: walletClient.chain,
        } as any);
        toast.info("Approval submitted. Waiting for confirmation...");
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        await refetchAllowance?.();
        toast.success("USDC approved!");
      }

      // Prepare a short tokenURI (avoid huge base64 in calldata)
      toast.info("Preparing NFT metadata...");
      let tokenUri: string | undefined = nftData?.metadata?.token_uri as string | undefined;
      try {
        if (!tokenUri) {
          // Ensure image is a short public URL
          let imagePublicUrl: string = nftData.image_url as string;
          if (typeof imagePublicUrl === 'string' && imagePublicUrl.startsWith('data:')) {
            const res = await fetch(imagePublicUrl);
            const blob = await res.blob();
            const avatarId = nftData.id || crypto.randomUUID();
            const pngPath = `avatars/${user?.id || address}/${avatarId}.png`;
            const { error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(pngPath, blob, { contentType: 'image/png' });
            if (uploadError && !String(uploadError.message || uploadError).includes('already exists')) {
              throw uploadError;
            }
            const { data: pub } = supabase.storage.from('certificates').getPublicUrl(pngPath);
            imagePublicUrl = pub.publicUrl;
          }

          // Create ERC721 metadata JSON
          const meta = {
            name: 'UniqueHub Avatar',
            description: 'Your unique on-chain avatar on UniqueHub',
            image: imagePublicUrl,
            attributes: [
              { trait_type: 'Display Name', value: nftData.metadata?.display_name || nftData.metadata?.displayName || 'User' },
              { trait_type: 'Hair Style', value: nftData.metadata?.hair_style || nftData.metadata?.hairStyle || 'Blue' },
            ],
          };
          const avatarId = nftData.id || crypto.randomUUID();
          const metaPath = `avatars/${user?.id || address}/${avatarId}-metadata.json`;
          const { error: metaError } = await supabase.storage
            .from('certificates')
            .upload(metaPath, new Blob([JSON.stringify(meta)], { type: 'application/json' }));
          if (metaError && !String(metaError.message || metaError).includes('already exists')) {
            throw metaError;
          }
          const { data: metaPub } = supabase.storage.from('certificates').getPublicUrl(metaPath);
          tokenUri = metaPub.publicUrl;

          // Cache token_uri so next attempt skips uploads
          setNftData((prev: any) => prev ? { ...prev, metadata: { ...prev.metadata, token_uri: tokenUri } } : prev);
        }
      } catch (prepErr) {
        console.error('Metadata prep error:', prepErr);
        toast.error('Failed to prepare NFT metadata');
        throw prepErr;
      }

      // Directly write without simulate to mirror reliable certificate flow
      toast.info("Minting your NFT...");
      const mintHash = await walletClient.writeContract({
        address: UNIQUE_NFT_ADDRESS,
        abi: UNIQUE_NFT_ABI,
        functionName: "mintAvatar",
        args: [tokenUri || nftData.image_url],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info("Mint transaction submitted. Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash: mintHash });

      await Promise.all([refetchHasMinted?.(), refetchUserTokenId?.()]);
      toast.success("NFT minted successfully!");
    } catch (error: any) {
      console.error("Minting error:", error);
      const msg =
        error?.shortMessage ||
        error?.message ||
        (typeof error === "string" ? error : "Failed to mint NFT");
      if (/timed out|timeout|expired/i.test(msg)) {
        toast.error("Transaction took too long and may still confirm. Please check BaseScan and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsMinting(false);
    }
  };
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
                  {!hasMintedOnChain ? (
                    <Button
                      onClick={mintNFT}
                      disabled={isMinting || !address}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isMinting ? "Minting..." : "Mint for 0.2 USDC"}
                    </Button>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Minted on-chain #{userTokenId?.toString()}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            window.open(
                              `https://basescan.org/token/${UNIQUE_NFT_ADDRESS}?a=${userTokenId}`,
                              "_blank"
                            );
                          }}
                          className="flex-1"
                        >
                          View on BaseScan
                        </Button>
                        <ShareToFarcaster
                          text={`Just minted my unique avatar on UniqueHub! 🎨✨\n\n#UniqueHub #NFT #Base`}
                          embeds={[
                            nftData.image_url,
                            `https://basescan.org/token/${UNIQUE_NFT_ADDRESS}?a=${userTokenId}`
                          ]}
                          variant="outline"
                          size="icon"
                        />
                        <Button onClick={downloadNFT} variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
