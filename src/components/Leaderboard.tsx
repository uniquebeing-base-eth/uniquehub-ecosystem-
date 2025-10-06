import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(10);

      if (error) throw error;
      setLeaders(data || []);
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Top UP Earners</h3>
      </div>

      <div className="space-y-3">
        {leaders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No leaderboard data yet. Be the first to check in and earn UP!
          </p>
        ) : (
          leaders.map((leader) => (
            <div
              key={leader.user_id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                leader.rank <= 3
                  ? 'bg-gradient-card border border-primary/20'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(leader.rank)}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarImage src={leader.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                  {(leader.display_name || leader.farcaster_username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {leader.display_name || leader.farcaster_username || 'Anonymous'}
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {leader.daily_streak > 0 && (
                    <span>🔥 {leader.daily_streak}d</span>
                  )}
                  {leader.weekly_streak > 0 && (
                    <span>📊 {leader.weekly_streak}w</span>
                  )}
                  {leader.monthly_streak > 0 && (
                    <span>🏆 {leader.monthly_streak}m</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {leader.total_points.toLocaleString()} UP
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};