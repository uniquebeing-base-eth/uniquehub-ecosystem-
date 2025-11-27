import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { base, arbitrum, bsc } from "wagmi/chains";
import { useViemClients } from "@/hooks/useViemClients";
import { MULTI_TOKEN_REWARDS_ABI, MULTI_TOKEN_REWARDS_ADDRESS } from "@/config/wagmi";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import eggsLogo from "@/assets/eggs-token.jpg";
import jesseLogo from "@/assets/jesse-token.jpg";
import celoLogo from "@/assets/celo-logo.png";
import monadLogo from "@/assets/monad-logo.jpg";
import arbitrumLogo from "@/assets/arbitrum-logo.png";
import bnbLogo from "@/assets/bnb-logo.png";

interface Chain {
  id: string;
  name: string;
  token: string;
  logo: string;
  color: string;
  enabled: boolean;
  rewardPerThousand: number;
  isOnChain: boolean; // Whether this uses the on-chain contract
  chainConfig: typeof base | typeof arbitrum | typeof bsc; // Which blockchain to use
  contractAddress: `0x${string}`; // Contract address for this chain
}

const chains: Chain[] = [
  {
    id: "EGGS",
    name: "Base",
    token: "EGGS",
    logo: eggsLogo,
    color: "from-yellow-400 to-green-500",
    enabled: true,
    rewardPerThousand: 0.1,
    isOnChain: true,
    chainConfig: base,
    contractAddress: MULTI_TOKEN_REWARDS_ADDRESS, // Base contract
  },
  {
    id: "JESSE",
    name: "Base",
    token: "JESSE",
    logo: jesseLogo,
    color: "from-purple-500 to-pink-600",
    enabled: true,
    rewardPerThousand: 0.5,
    isOnChain: true,
    chainConfig: base,
    contractAddress: MULTI_TOKEN_REWARDS_ADDRESS, // Base contract
  },
  {
    id: "ARB",
    name: "Arbitrum",
    token: "ARB",
    logo: arbitrumLogo,
    color: "from-blue-500 to-cyan-600",
    enabled: true,
    rewardPerThousand: 0.02,
    isOnChain: true,
    chainConfig: arbitrum,
    contractAddress: "0xF80dC23eC58bCd7F9498b63C5e8D46225eCD4FBC", // Arbitrum contract
  },
  {
    id: "USDC",
    name: "BNB Chain",
    token: "USDC",
    logo: bnbLogo,
    color: "from-yellow-500 to-orange-600",
    enabled: true,
    rewardPerThousand: 0.005,
    isOnChain: true,
    chainConfig: bsc,
    contractAddress: "0xF80dC23eC58bCd7F9498b63C5e8D46225eCD4FBC", // BNB Chain contract
  },
];

export const RewardsSection = () => {
  const { user } = useAuth();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { address: farcasterAddress, isConnected: farcasterConnected } = useFarcasterWallet();
  const { connectAsync, connectors } = useConnect();
  
  // Use wagmi address if connected, otherwise use Farcaster address
  const address = wagmiAddress || farcasterAddress;
  const isConnected = wagmiConnected || farcasterConnected;
  
  const { walletClient } = useViemClients(address);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [claimingChain, setClaimingChain] = useState<string | null>(null);
  const [lastClaims, setLastClaims] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastClaimedToken, setLastClaimedToken] = useState<{ token: string; amount: number } | null>(null);

  // Fetch user points
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserPoints(data.total_points);
      }
    };

    // Fetch existing claims for today
    const fetchTodayClaims = async () => {
      if (!user?.id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("multichain_claims")
        .select("chain_id, claimed_at")
        .eq("user_id", user.id)
        .gte("claimed_at", today.toISOString());

      if (data) {
        const claims: Record<string, string> = {};
        data.forEach(claim => {
          claims[claim.chain_id] = claim.claimed_at;
        });
        setLastClaims(claims);
      }
    };
    
    fetchPoints();
    fetchTodayClaims();
  }, [user?.id]);

  const calculateClaimAmount = (points: number, rewardRate: number): number => {
    return Math.floor(points / 1000) * rewardRate;
  };

  const canClaimToday = (chainId: string): boolean => {
    const lastClaim = lastClaims[chainId];
    if (!lastClaim) return true;
    
    const lastClaimDate = new Date(lastClaim);
    const today = new Date();
    
    return lastClaimDate.toDateString() !== today.toDateString();
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const farcasterConnector = connectors.find(
        (c) => (c as any).id === 'farcasterMiniApp' || c.name.toLowerCase().includes('farcaster')
      );
      
      if (farcasterConnector) {
        await connectAsync({ connector: farcasterConnector });
        toast.success("Wallet connected!");
      } else {
        toast.error("Please open this app in Farcaster or Base to connect your wallet");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClaim = async (chain: Chain) => {
    if (!user?.id) {
      toast.error("Please sign in first");
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!walletClient) {
      toast.error("Wallet client not ready. Please try again.");
      return;
    }

    if (!canClaimToday(chain.id)) {
      toast.error(`You've already claimed ${chain.token} today. Come back tomorrow!`);
      return;
    }

    const claimAmount = calculateClaimAmount(userPoints, chain.rewardPerThousand);
    
    if (claimAmount <= 0) {
      toast.error("You need at least 1000 points to claim rewards");
      return;
    }

    setClaimingChain(chain.id);

    try {
      if (chain.isOnChain) {
        // Get signature from edge function
        toast.info("Generating claim signature...");
        
        const { data: signatureData, error: signatureError } = await supabase.functions.invoke(
          'generate-claim-signature',
          {
            body: {
              userId: user.id,
              walletAddress: address,
              tokenId: chain.id,
            },
          }
        );

        if (signatureError || !signatureData?.signature) {
          const errorMsg = signatureData?.error || signatureError?.message || "Failed to generate signature";
          throw new Error(errorMsg);
        }

        console.log("Signature received:", signatureData.signature);
        toast.info(`Please confirm the transaction on ${chain.name}...`);
        
        const hash = await walletClient.writeContract({
          address: chain.contractAddress,
          abi: MULTI_TOKEN_REWARDS_ABI,
          functionName: 'claimReward',
          args: [chain.id, BigInt(signatureData.points), signatureData.signature as `0x${string}`],
          chain: chain.chainConfig,
          account: address,
        });

        toast.info("Transaction submitted! Waiting for confirmation...");
        console.log("Transaction hash:", hash);

        // Record the claim in database
        await supabase.from("multichain_claims").insert({
          user_id: user.id,
          chain_id: chain.id,
          amount: claimAmount,
          transaction_hash: hash,
        });

        setLastClaims(prev => ({
          ...prev,
          [chain.id]: new Date().toISOString(),
        }));
        
        setLastClaimedToken({ token: chain.token, amount: claimAmount });
        toast.success(`Successfully claimed ${claimAmount} ${chain.token}!`);
      } else {
        toast.info(`${chain.token} claiming coming soon!`);
      }
    } catch (error: unknown) {
      console.error("Claim error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle user rejection gracefully
      if (errorMessage.includes("User rejected") || errorMessage.includes("denied")) {
        toast.error("Transaction was cancelled");
      } else {
        toast.error(`Failed to claim ${chain.token}: ${errorMessage}`);
      }
    } finally {
      setClaimingChain(null);
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Multichain Rewards
          </h1>
          <p className="text-muted-foreground">
            Claim tokens on multiple chains based on your points
          </p>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 p-6">
            <div className="text-center space-y-4">
              <Wallet className="w-12 h-12 mx-auto text-primary" />
              <p className="text-muted-foreground">Connect your wallet to claim rewards</p>
              <Button onClick={handleConnectWallet} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Points Display */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your Total Points</p>
            <p className="text-5xl font-bold text-foreground">{userPoints.toLocaleString()}</p>
          </div>
        </Card>

        {/* Chain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains.map((chain) => {
            const isClaiming = claimingChain === chain.id;
            const canClaim = canClaimToday(chain.id);
            const claimAmount = calculateClaimAmount(userPoints, chain.rewardPerThousand);
            
            return (
              <Card
                key={chain.id}
                className="relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${chain.color} opacity-5`} />
                
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center overflow-hidden">
                      <img src={chain.logo} alt={chain.name} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{chain.token}</h3>
                      <p className="text-sm text-muted-foreground">{chain.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Claim:</span>
                      <span className="font-semibold text-foreground">
                        {claimAmount} {chain.token}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={canClaim ? "text-green-500" : "text-orange-500"}>
                        {canClaim ? "Available" : "Claimed Today"}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!chain.enabled || !canClaim || isClaiming || claimAmount <= 0 || !isConnected}
                    onClick={() => handleClaim(chain)}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : !isConnected ? (
                      "Connect Wallet"
                    ) : !canClaim ? (
                      "Claimed Today"
                    ) : claimAmount <= 0 ? (
                      "Need 1000+ Points"
                    ) : (
                      `Claim ${chain.token}`
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Share Success Card */}
        {lastClaimedToken && (
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">🎉 Claim Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  You claimed {lastClaimedToken.amount} ${lastClaimedToken.token}. Share your success!
                </p>
              </div>
              <ShareToFarcaster
                text={`I just claimed my daily reward tokens, ${lastClaimedToken.amount} $${lastClaimedToken.token} on @uniquehub 🎉`}
                embeds={["https://uniquehub.xyz"]}
                variant="default"
                size="default"
                buttonText="Share"
              />
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 p-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">How It Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Earn points by completing courses, enrolling, and engaging with the platform</li>
            <li>• Claim rewards once per day for each token</li>
            <li>• Claim rewards on multiple chains including Base, Arbitrum, and BNB</li>
            <li>• Each token has its own independent daily claim</li>
            <li>• Transactions are gasless and automated</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
