import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import animeEarnBg from "@/assets/anime-earn-bg.jpg";

interface LearnerEntry {
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

export const LearnerLeaderboard = () => {
  const { user } = useAuth();
  const [learners, setLearners] = useState<LearnerEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LearnerEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearnerLeaderboard();
  }, [user]);

  const fetchLearnerLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(20);

      if (error) throw error;
      
      setLearners(data || []);

      // Fetch user's position if they're not in top 20
      if (user) {
        const { data: userData } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userData && userData.rank > 20) {
          setUserPosition(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching learner leaderboard:', error);
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
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const renderLearnerCard = (learner: LearnerEntry, isUserCard = false) => {
    return (
      <div
        key={learner.user_id}
        className={`relative flex items-center gap-3 p-4 rounded-xl transition-all overflow-hidden ${
          isUserCard ? 'ring-2 ring-primary/50' : ''
        }`}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${animeEarnBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/95" />
        
        <div className="relative z-10 flex items-center gap-3 w-full">
          <div className="flex items-center justify-center w-10 flex-shrink-0">
            {learner.rank <= 3 ? (
              getRankIcon(learner.rank)
            ) : (
              <span className="text-sm font-bold text-muted-foreground">#{learner.rank}</span>
            )}
          </div>

          <Avatar className="w-12 h-12 border-2 border-primary/30 flex-shrink-0">
            <AvatarImage src={learner.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-foreground text-sm font-bold">
              {(learner.display_name || learner.farcaster_username || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {learner.farcaster_username ? (
              <a 
                href={`https://warpcast.com/${learner.farcaster_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary hover:underline truncate block transition-colors"
              >
                @{learner.farcaster_username}
              </a>
            ) : (
              <p className="font-semibold text-foreground truncate">
                {learner.display_name || 'Anonymous'}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {learner.daily_streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-xs font-bold text-orange-500">
                    {learner.daily_streak}
                  </span>
                </div>
              )}
              {learner.weekly_streak > 0 && (
                <div className="px-2 py-0.5 bg-blue-500/20 rounded-full">
                  <span className="text-xs font-bold text-blue-500">
                    {learner.weekly_streak}W
                  </span>
                </div>
              )}
              {learner.monthly_streak > 0 && (
                <div className="px-2 py-0.5 bg-purple-500/20 rounded-full">
                  <span className="text-xs font-bold text-purple-500">
                    {learner.monthly_streak}M
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-primary leading-tight">
              {learner.total_points.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">UP</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {learners.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            No learners yet. Start learning and checking in daily to appear here!
          </p>
        </div>
      ) : (
        <>
          {learners.map((learner) => renderLearnerCard(learner))}
          
          {userPosition && userPosition.rank > 20 && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3 font-semibold">Your Position</p>
              {renderLearnerCard(userPosition, true)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
