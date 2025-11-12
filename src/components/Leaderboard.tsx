import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
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

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(10);

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

      // Fetch user's position if they're not in top 10
      if (user) {
        const { data: userData } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userData && userData.rank > 10) {
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

  const renderLeaderCard = (leader: LeaderboardEntry, isUserCard = false) => (
    <div
      key={leader.user_id}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.75)), url(${animeEarnBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all shadow-lg border ${
        leader.rank <= 3
          ? 'border-primary/40 shadow-primary/20'
          : isUserCard
          ? 'border-accent/40'
          : 'border-border/40'
      }`}
    >
      <div className="flex items-center justify-center w-10 h-10">
        {getRankIcon(leader.rank)}
      </div>

      <Avatar className="w-12 h-12 border-2 border-primary/30">
        <AvatarImage src={leader.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
          {(leader.display_name || leader.farcaster_username || 'U').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {leader.farcaster_username ? (
          <a 
            href={`https://warpcast.com/${leader.farcaster_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline truncate block text-base"
          >
            @{leader.farcaster_username}
          </a>
        ) : (
          <p className="font-semibold text-foreground truncate text-base">
            {leader.display_name || 'Anonymous'}
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-sm mt-1">
          {leader.daily_streak > 0 && (
            <span className="text-orange-400 font-medium">🔥 {leader.daily_streak}d</span>
          )}
          {(leader.total_eth_earned && leader.total_eth_earned > 0) && (
            <span className="text-crypto-eth font-semibold">Ξ {leader.total_eth_earned.toFixed(4)}</span>
          )}
          {(leader.total_usdc_earned && leader.total_usdc_earned > 0) && (
            <span className="text-crypto-usdc font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" />{leader.total_usdc_earned.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-bold text-primary">
          {leader.total_points.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">UP</p>
      </div>
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Top 10 UP Earners</h3>
      </div>

      <div className="space-y-3">
        {leaders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No leaderboard data yet. Be the first to check in and earn UP!
          </p>
        ) : (
          <>
            {leaders.map((leader) => renderLeaderCard(leader))}
            
            {userPosition && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3 font-medium">Your Position</p>
                {renderLeaderCard(userPosition, true)}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};