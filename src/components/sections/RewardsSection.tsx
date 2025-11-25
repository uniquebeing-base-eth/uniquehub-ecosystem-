import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
}

const chains: Chain[] = [
  {
    id: "eggs",
    name: "Base",
    token: "EGGS",
    logo: eggsLogo,
    color: "from-yellow-400 to-green-500",
    enabled: true,
    rewardPerThousand: 0.1,
  },
  {
    id: "jesse",
    name: "Base",
    token: "JESSE",
    logo: jesseLogo,
    color: "from-purple-500 to-pink-600",
    enabled: true,
    rewardPerThousand: 0.5,
  },
  {
    id: "celo",
    name: "Celo",
    token: "CELO",
    logo: celoLogo,
    color: "from-green-500 to-emerald-600",
    enabled: true,
    rewardPerThousand: 0.02,
  },
  {
    id: "monad",
    name: "Monad",
    token: "MON",
    logo: monadLogo,
    color: "from-purple-500 to-indigo-600",
    enabled: true,
    rewardPerThousand: 0.1,
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    token: "ARB",
    logo: arbitrumLogo,
    color: "from-blue-500 to-cyan-600",
    enabled: true,
    rewardPerThousand: 0.02,
  },
  {
    id: "bnb",
    name: "BNB Chain",
    token: "BNB",
    logo: bnbLogo,
    color: "from-yellow-500 to-orange-600",
    enabled: true,
    rewardPerThousand: 0.00001,
  },
];

export const RewardsSection = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<number>(0);
  const [claimingChain, setClaimingChain] = useState<string | null>(null);
  const [lastClaims, setLastClaims] = useState<Record<string, string>>({});

  // Fetch user points
  useState(() => {
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
    
    fetchPoints();
  });

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

  const handleClaim = async (chain: Chain) => {
    if (!user?.id) {
      toast.error("Please connect your wallet first");
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
      // TODO: Implement actual blockchain claim logic here
      // This would involve:
      // 1. Connecting to the specific chain
      // 2. Calling the claim contract
      // 3. Signing the transaction
      
      // Simulated claim for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Record the claim
      setLastClaims(prev => ({
        ...prev,
        [chain.id]: new Date().toISOString(),
      }));
      
      toast.success(`Successfully claimed ${claimAmount} ${chain.token}!`);
    } catch (error: any) {
      console.error("Claim error:", error);
      toast.error(`Failed to claim ${chain.token}: ${error.message}`);
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

        {/* Points Display */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your Total Points</p>
            <p className="text-5xl font-bold text-foreground">{userPoints.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Claim tokens on each chain based on your points
            </p>
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
                      <h3 className="text-xl font-bold text-foreground">{chain.name}</h3>
                      <p className="text-sm text-muted-foreground">{chain.token}</p>
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
                    disabled={!chain.enabled || !canClaim || isClaiming || claimAmount <= 0}
                    onClick={() => handleClaim(chain)}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Claiming...
                      </>
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

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 p-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">How It Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Earn points by completing courses, enrolling, and engaging with the platform</li>
            <li>• Claim rewards once per day for each token</li>
            <li>• Claim rewards on multiple chains including Base, Celo, Monad, Arbitrum, and BNB</li>
            <li>• Each token has its own independent daily claim</li>
            <li>• Transactions are gasless and automated</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
