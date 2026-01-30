

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Medal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";



interface Pool {
  id: string;
  title: string;
  reward_amount: number;
  number_of_winners: number;
}

interface Participant {
  user_id: string;
  total_points: number;
  modules_completed: number;
  rank: number;
  is_winner: boolean;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

interface PoolLeaderboardProps {
  pool: Pool;
  onBack: () => void;
}

export const PoolLeaderboard = ({ pool, onBack }: PoolLeaderboardProps) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [pool.id]);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('pool_participants')
      .select('*')
      .eq('pool_id', pool.id)
      .order('total_points', { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = data?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    const participantsWithProfiles = data?.map(p => ({
      ...p,
      profiles: {
        display_name: profileMap.get(p.user_id)?.display_name || 'Anonymous',
        avatar_url: profileMap.get(p.user_id)?.avatar_url || ''
      }
    })) || [];

    setParticipants(participantsWithProfiles);
    setLoading(false);
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>

          <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 rounded-xl">
            <h1 className="text-2xl font-bold mb-2">{pool.title}</h1>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Prize: ${pool.reward_amount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                <span>Top {pool.number_of_winners} winners</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading leaderboard...</div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No participants yet. Be the first to join!
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant, index) => {
              const rank = index + 1;
              const isCurrentUser = participant.user_id === user?.id;
              const isWinner = rank <= pool.number_of_winners;

              return (
                <div
                  key={participant.user_id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCurrentUser
                      ? 'border-primary bg-primary/10'
                      : isWinner
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 text-center">
                        {getMedalIcon(rank) || (
                          <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {participant.profiles?.display_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {participant.profiles?.display_name || 'Anonymous'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participant.modules_completed} modules completed
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {participant.total_points}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
