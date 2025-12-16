
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import animeEarnBg from "@/assets/anime-earn-bg.jpg";

interface CreatorEntry {
  user_id: string;
  creator_points: number;
  display_name: string | null;
  farcaster_username: string | null;
  avatar_url: string | null;
  total_students: number;
  total_courses: number;
  total_ratings: number;
  rank: number;
}

export const CreatorLeaderboard = () => {
  const { user } = useAuth();
  const [creators, setCreators] = useState<CreatorEntry[]>([]);
  const [userPosition, setUserPosition] = useState<CreatorEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorLeaderboard();
  }, [user]);

  const fetchCreatorLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_leaderboard')
        .select('*')
        .limit(20);

      if (error) throw error;
      
      setCreators(data || []);

      // Fetch user's position if they're not in top 20
      if (user) {
        const { data: userData } = await supabase
          .from('creator_leaderboard')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userData && userData.rank > 20) {
          setUserPosition(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching creator leaderboard:', error);
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

  const renderCreatorCard = (creator: CreatorEntry, isUserCard = false) => {
    return (
      <div
        key={creator.user_id}
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
            {creator.rank <= 3 ? (
              getRankIcon(creator.rank)
            ) : (
              <span className="text-sm font-bold text-muted-foreground">#{creator.rank}</span>
            )}
          </div>

          <Avatar className="w-12 h-12 border-2 border-primary/30 flex-shrink-0">
            <AvatarImage src={creator.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-foreground text-sm font-bold">
              {(creator.display_name || creator.farcaster_username || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {creator.farcaster_username ? (
              <a 
                href={`https://warpcast.com/${creator.farcaster_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary hover:underline truncate block transition-colors"
              >
                @{creator.farcaster_username}
              </a>
            ) : (
              <p className="font-semibold text-foreground truncate">
                {creator.display_name || 'Anonymous'}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {creator.total_students}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {creator.total_ratings}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-primary leading-tight">
              {creator.creator_points.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {creators.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            No creators yet. Upload a course and get students to appear here!
          </p>
        </div>
      ) : (
        <>
          {creators.map((creator) => renderCreatorCard(creator))}
          
          {userPosition && userPosition.rank > 20 && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3 font-semibold">Your Position</p>
              {renderCreatorCard(userPosition, true)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
