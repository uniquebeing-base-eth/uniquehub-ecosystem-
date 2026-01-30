

import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Lock, Star, Users, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PoolLeaderboard } from "./PoolLeaderboard";


interface LearningPoolProps {
  onBack: () => void;
}


interface Pool {
  id: string;
  title: string;
  description: string;
  required_streak: number;
  reward_amount: number;
  number_of_winners: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface UserStreak {
  current_streak: number;
}

export const LearningPool = ({ onBack }: LearningPoolProps) => {
  const { user } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPools();
      fetchStreak();
    }
  }, [user]);

  const fetchPools = async () => {
    const { data, error } = await supabase
      .from('learning_pools')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load pools");
      console.error(error);
    } else {
      setPools(data || []);
    }
    setLoading(false);
  };

  const fetchStreak = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_learning_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStreak(data);
    }
  };

  const handleJoinPool = async (pool: Pool) => {
    if (!user) {
      toast.error("Please sign in to join pools");
      return;
    }

    if ((streak?.current_streak || 0) < pool.required_streak) {
      toast.error(`You need a ${pool.required_streak}-day streak to join this pool`);
      return;
    }

    const { error } = await supabase
      .from('pool_participants')
      .insert({
        pool_id: pool.id,
        user_id: user.id,
      });

    if (error) {
      if (error.code === '23505') {
        toast.info("You've already joined this pool!");
      } else {
        toast.error("Failed to join pool");
        console.error(error);
      }
    } else {
      toast.success("Successfully joined the pool!");
      setSelectedPool(pool);
    }
  };

  if (selectedPool) {
    return <PoolLeaderboard pool={selectedPool} onBack={() => setSelectedPool(null)} />;
  }

  const canJoinPool = (pool: Pool) => {
    return (streak?.current_streak || 0) >= pool.required_streak;
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
            Back to Quest Hub
          </Button>

          <h1 className="text-3xl font-bold mb-2 text-primary">Learning Pools</h1>
          <p className="text-muted-foreground">Compete for rewards and prizes</p>
        </div>
      </div>

      {/* Streak Info */}
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <Trophy className="w-5 h-5 text-primary" />
          <AlertDescription>
            Your current streak: <span className="font-bold text-primary">{streak?.current_streak || 0} days</span>
          </AlertDescription>
        </Alert>

        {/* Pool List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading pools...</div>
        ) : pools.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No active pools right now</p>
            <p className="text-sm text-muted-foreground">Check back soon for new competitions!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pools.map((pool) => {
              const eligible = canJoinPool(pool);
              const daysLeft = Math.ceil(
                (new Date(pool.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={pool.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    eligible
                      ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 hover:border-primary hover:shadow-glow'
                      : 'bg-muted/30 border-muted opacity-75'
                  }`}
                >
                  {!eligible && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-2">{pool.title}</h3>
                    <p className="text-muted-foreground">{pool.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Prize Pool</div>
                        <div className="font-bold">${pool.reward_amount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-accent" />
                      <div>
                        <div className="text-xs text-muted-foreground">Winners</div>
                        <div className="font-bold">{pool.number_of_winners}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Required</div>
                        <div className="font-bold">{pool.required_streak} days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Time Left</div>
                        <div className="font-bold">{daysLeft}d</div>
                      </div>
                    </div>
                  </div>

                  {eligible ? (
                    <Button
                      onClick={() => handleJoinPool(pool)}
                      className="w-full"
                      size="lg"
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      Join Pool
                    </Button>
                  ) : (
                    <div className="text-center py-3 px-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        🔒 Build a {pool.required_streak}-day streak to unlock
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
