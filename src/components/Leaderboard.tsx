import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import animeEarnBg from "@/assets/anime-earn-bg.jpg";

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  farcaster_username: string | null;
  avatar_url: string | null;
  total_points: number;
  daily_streak: number;
  weekly_streak: number;
  monthly_streak: number;
  rank: number;
  total_eth_earned?: number;
  total_usdc_earned?: number;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"points" | "earnings">("points");

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(20);

      if (error) throw error;
      
      // Fetch earnings for each user
      const leadersWithEarnings = await Promise.all(
        (data || []).map(async (leader) => {
          const { data: payments } = await supabase
            .from('course_payments')
            .select('amount, currency, status')
            .eq('seller_user_id', leader.user_id)
            .eq('status', 'completed');
          
          let total_eth_earned = 0;
          let total_usdc_earned = 0;
          
          payments?.forEach(payment => {
            if (payment.currency === 'ETH') {
              total_eth_earned += Number(payment.amount);
            } else if (payment.currency === 'USDC') {
              total_usdc_earned += Number(payment.amount);
            }
          });
          
          return {
            ...leader,
            total_eth_earned,
            total_usdc_earned,
          };
        })
      );
      
      setLeaders(leadersWithEarnings);

      // Fetch user's position if they're not in top 20
      if (user) {
        const { data: userData } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userData && userData.rank > 20) {
          const { data: userPayments } = await supabase
            .from('course_payments')
            .select('amount, currency, status')
            .eq('seller_user_id', userData.user_id)
            .eq('status', 'completed');
          
          let total_eth_earned = 0;
          let total_usdc_earned = 0;
          
          userPayments?.forEach(payment => {
            if (payment.currency === 'ETH') {
              total_eth_earned += Number(payment.amount);
            } else if (payment.currency === 'USDC') {
              total_usdc_earned += Number(payment.amount);
            }
          });

          setUserPosition({
            ...userData,
            total_eth_earned,
            total_usdc_earned,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Trophy className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const renderLeaderCard = (leader: LeaderboardEntry, isUserCard = false) => {
    const showPoints = activeTab === "points";
    const totalEarnings = (leader.total_eth_earned || 0) + (leader.total_usdc_earned || 0);
    
    return (
      <div
        key={leader.user_id}
        className={`relative flex items-center gap-3 p-3 rounded-xl transition-all overflow-hidden ${
          isUserCard
            ? 'ring-2 ring-primary/50'
            : ''
        }`}
      >
        {/* Anime Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${animeEarnBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/95" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3 w-full">
          {/* Rank */}
          <div className="flex items-center justify-center w-8 flex-shrink-0">
            {leader.rank <= 3 ? (
              getRankIcon(leader.rank)
            ) : (
              <span className="text-sm font-bold text-muted-foreground">#{leader.rank}</span>
            )}
          </div>

          {/* Avatar */}
          <Avatar className="w-10 h-10 border-2 border-primary/30 flex-shrink-0">
            <AvatarImage src={leader.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-foreground text-xs font-bold">
              {(leader.display_name || leader.farcaster_username || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            {leader.farcaster_username ? (
              <a 
                href={`https://warpcast.com/${leader.farcaster_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary hover:underline truncate block text-sm transition-colors"
              >
                @{leader.farcaster_username}
              </a>
            ) : (
              <p className="font-semibold text-foreground truncate text-sm">
                {leader.display_name || 'Anonymous'}
              </p>
            )}
            {leader.daily_streak > 0 && (
              <p className="text-xs text-orange-400 font-medium">
                🔥 {leader.daily_streak} day streak
              </p>
            )}
          </div>

          {/* Points/Earnings */}
          <div className="text-right flex-shrink-0">
            {showPoints ? (
              <>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {leader.total_points.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">UP</p>
              </>
            ) : (
              <div className="space-y-0.5">
                {(leader.total_eth_earned && leader.total_eth_earned > 0) && (
                  <p className="text-sm font-bold text-blue-400 leading-tight">
                    Ξ {leader.total_eth_earned.toFixed(4)}
                  </p>
                )}
                {(leader.total_usdc_earned && leader.total_usdc_earned > 0) && (
                  <p className="text-sm font-bold text-green-400 flex items-center justify-end gap-0.5 leading-tight">
                    <DollarSign className="w-3 h-3" />{leader.total_usdc_earned.toFixed(2)}
                  </p>
                )}
                {totalEarnings === 0 && (
                  <p className="text-sm text-muted-foreground">$0.00</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sort leaders by earnings for earnings tab
  const sortedLeaders = activeTab === "earnings" 
    ? [...leaders].sort((a, b) => {
        const aTotal = (a.total_eth_earned || 0) + (a.total_usdc_earned || 0);
        const bTotal = (b.total_eth_earned || 0) + (b.total_usdc_earned || 0);
        return bTotal - aTotal;
      })
    : leaders;

  return (
    <Card className="p-5 bg-card border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Top 20 Leaderboard</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "points" | "earnings")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
          <TabsTrigger value="points" className="text-xs font-semibold">UP Points</TabsTrigger>
          <TabsTrigger value="earnings" className="text-xs font-semibold">Money Earned</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="mt-0">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pb-4">
            {leaders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No leaderboard data yet. Be the first to check in and earn UP!
              </p>
            ) : (
              <>
                {leaders.map((leader) => renderLeaderCard(leader))}
                
                {userPosition && userPosition.rank > 20 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Position</p>
                    {renderLeaderCard(userPosition, true)}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-0">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pb-4">
            {sortedLeaders.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No earnings data yet. Start selling courses to earn!
              </p>
            ) : (
              <>
                {sortedLeaders.map((leader, index) => renderLeaderCard({ ...leader, rank: index + 1 }))}
                
                {userPosition && userPosition.rank > 20 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Position</p>
                    {renderLeaderCard(userPosition, true)}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};