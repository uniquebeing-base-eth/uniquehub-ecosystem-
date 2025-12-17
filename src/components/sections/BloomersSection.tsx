import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Flower2 } from "lucide-react";
import { toast } from "sonner";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { useViemClients } from "@/hooks/useViemClients";
import { BloomersLeaderboard } from "@/components/BloomersLeaderboard";
import { base } from "wagmi/chains";
import { parseAbi } from "viem";

// Bloomers NFT Contract on Base
const BLOOMERS_CONTRACT = "0x31031d10988169e6cac45F47469BA87d8B394E1e" as `0x${string}`;

const BLOOMERS_ABI = parseAbi([
  "function mint() public payable",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)",
]);

export const BloomersSection = () => {
  const { address } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [isMinting, setIsMinting] = useState(false);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  useEffect(() => {
    loadContractData();
  }, [address, publicClient]);

  const loadContractData = async () => {
    if (!publicClient) return;

    try {
      const supply = await publicClient.readContract({
        address: BLOOMERS_CONTRACT,
        abi: BLOOMERS_ABI,
        functionName: "totalSupply",
      } as any);
      setTotalSupply(Number(supply));

      if (address) {
        const balance = await publicClient.readContract({
          address: BLOOMERS_CONTRACT,
          abi: BLOOMERS_ABI,
          functionName: "balanceOf",
          args: [address],
        } as any);
        setUserBalance(Number(balance));
      }
    } catch (error) {
      console.error("Error loading contract data:", error);
    }
  };

  const mintBloomer = async () => {
    if (!address || !walletClient) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsMinting(true);
    try {
      // Mint price - adjust based on contract
      const mintPrice = 800000000000000n; // 0.0008 ETH

      const hash = await walletClient.writeContract({
        address: BLOOMERS_CONTRACT,
        abi: BLOOMERS_ABI,
        functionName: "mint",
        value: mintPrice,
        chain: base,
        account: address,
      });

      toast.success("Minting transaction submitted!");

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        toast.success("Bloomer minted successfully! 🌸");
        loadContractData();
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error(error.shortMessage || error.message || "Failed to mint");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Flower2 className="h-10 w-10 text-pink-500" />
          Bloomers
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Little beings of glow and cheer. Born from your aura.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl p-8 border border-pink-500/20">
          <div className="text-center space-y-6">
            {/* Bloomer Image Placeholder */}
            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Flower2 className="h-24 w-24 text-pink-500 opacity-50" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Total Minted</p>
                <p className="font-bold text-lg text-pink-500">
                  {totalSupply !== null ? totalSupply : "..."}
                </p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Your Bloomers</p>
                <p className="font-bold text-lg text-pink-500">
                  {userBalance !== null ? userBalance : "..."}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={mintBloomer}
                disabled={isMinting || !address}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                {isMinting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Mint Now
                  </>
                )}
              </Button>
              <BloomersLeaderboard />
            </div>

            <p className="text-xs text-muted-foreground">
              Mint fee: 0.0008 ETH • Each mint = 300 Bloom Points
            </p>

            {/* Token Airdrop Notice */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-4 border border-pink-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                <span className="font-semibold text-sm">$BLOOM Airdrop Coming!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The more Bloomers you mint, the more $BLOOM tokens you'll receive when the token launches!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
