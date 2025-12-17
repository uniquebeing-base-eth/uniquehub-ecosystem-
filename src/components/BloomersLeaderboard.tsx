import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trophy, Flower2, Coins, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BloomersUser {
  wallet_address: string;
  display_name: string | null;
  farcaster_username: string | null;
  avatar_url: string | null;
  bloomer_count: number;
  bloom_points: number;
  tokens: number;
}

export const BloomersLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<BloomersUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Get all bloomers mints grouped by wallet
      const { data: mints, error: mintError } = await supabase
        .from("bloomers_mints")
        .select("wallet_address");

      if (mintError) throw mintError;

      // Count bloomers per wallet (case-insensitive)
      const walletBloomers: Record<string, number> = {};
      mints?.forEach((mint) => {
        const wallet = mint.wallet_address.toLowerCase();
        walletBloomers[wallet] = (walletBloomers[wallet] || 0) + 1;
      });

      // Get unique wallet addresses
      const walletAddresses = Object.keys(walletBloomers);
      
      if (walletAddresses.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles that match these wallets (case-insensitive)
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_address, display_name, farcaster_username, avatar_url");

      if (profileError) throw profileError;

      // Build leaderboard data
      const leaderboardData: BloomersUser[] = walletAddresses.map((wallet) => {
        // Find matching profile (case-insensitive)
        const profile = profiles?.find((p) => 
          p.wallet_address?.toLowerCase() === wallet.toLowerCase()
        );
        const bloomerCount = walletBloomers[wallet];
        const bloomPoints = bloomerCount * 300;
        const tokens = bloomPoints * 10;

        return {
          wallet_address: wallet,
          display_name: profile?.display_name || null,
          farcaster_username: profile?.farcaster_username || null,
          avatar_url: profile?.avatar_url || null,
          bloomer_count: bloomerCount,
          bloom_points: bloomPoints,
          tokens: tokens,
        };
      });

      // Sort by bloom points descending
      leaderboardData.sort((a, b) => b.bloom_points - a.bloom_points);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error loading bloomers leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const handleUsernameClick = (username: string | null, wallet: string) => {
    if (username) {
      window.open(`https://warpcast.com/${username}`, "_blank");
    } else {
      window.open(`https://basescan.org/address/${wallet}`, "_blank");
    }
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Flower2 className="h-6 w-6 text-pink-500" />
            Bloomers Leaderboard
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Each bloomer = 300 Bloom Points • Tokens = Bloom Points × 10
          </p>
        </SheetHeader>

        {/* Token Airdrop Notice */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-4 mb-4 border border-pink-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            <span className="font-semibold text-sm">$BLOOM Token Airdrop Coming Soon!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            $BLOOM token will launch soon. Users will be able to claim their token allocation based on their Bloom Points. The more you mint, the more tokens you'll receive!
          </p>
        </div>

        {/* Leaderboard Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs font-semibold text-muted-foreground mb-2">
          <div className="col-span-1">#</div>
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">🌸</div>
          <div className="col-span-2 text-center">Points</div>
          <div className="col-span-3 text-center">Tokens</div>
        </div>

        {/* Leaderboard Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-280px)] space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flower2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-pink-500" />
              <p>No bloomers yet. Be the first to mint!</p>
            </div>
          ) : (
            leaderboard.map((user, index) => (
              <div
                key={user.wallet_address}
                className={`grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-xl transition-colors ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border border-gray-400/30"
                    : index === 2
                    ? "bg-gradient-to-r from-orange-600/20 to-amber-700/20 border border-orange-600/30"
                    : "bg-card/50 border border-border/50"
                }`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <span
                    className={`font-bold text-sm ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : index === 2
                        ? "text-orange-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* User */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-pink-500/20 text-xs">
                      {(user.display_name || user.farcaster_username || "B")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => handleUsernameClick(user.farcaster_username, user.wallet_address)}
                    className="truncate text-sm font-medium hover:text-pink-500 transition-colors text-left"
                  >
                    {user.display_name || user.farcaster_username || formatWallet(user.wallet_address)}
                  </button>
                </div>

                {/* Bloomers Count */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold text-pink-500">
                    {user.bloomer_count}
                  </span>
                </div>

                {/* Bloom Points */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-foreground">
                    {user.bloom_points.toLocaleString()}
                  </span>
                </div>

                {/* Tokens */}
                <div className="col-span-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-3 w-3 text-pink-500" />
                    <span className="text-sm font-bold text-pink-500">
                      {user.tokens.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Summary */}
        {!isLoading && leaderboard.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-pink-500">
                  {leaderboard.reduce((sum, u) => sum + u.bloomer_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Bloomers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {leaderboard.reduce((sum, u) => sum + u.bloom_points, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-500">
                  {leaderboard.reduce((sum, u) => sum + u.tokens, 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
