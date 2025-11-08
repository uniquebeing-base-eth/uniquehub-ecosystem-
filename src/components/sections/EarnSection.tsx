import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Coins, BookOpen, Package, Image, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import animeEarnBg from '@/assets/anime-earn-bg.jpg';
import cardBgEarn from '@/assets/card-bg-earn.jpg';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  type: 'follow' | 'app';
  followUrl?: string;
}

export const EarnSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [verifiedTasks, setVerifiedTasks] = useState<string[]>([]); // Tasks verified and ready to claim
  const [loading, setLoading] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  const tasks: Task[] = [
    {
      id: "follow-uniquehub",
      title: "Follow UniqueHub",
      description: "Follow our official account",
      points: 50,
      icon: UserPlus,
      type: 'follow',
      followUrl: 'https://farcaster.xyz/uniquehub',
    },
    {
      id: "follow-uniquebeing404",
      title: "Follow @uniquebeing404",
      description: "Support our dev on Farcaster",
      points: 50,
      icon: UserPlus,
      type: 'follow',
      followUrl: 'https://farcaster.xyz/uniquebeing404',
    },
    {
      id: "finish-1-course",
      title: "Finish 1 Course",
      description: "Complete your first course",
      points: 1000,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "finish-5-courses",
      title: "Finish 5 Courses",
      description: "Complete 5 courses to master skills",
      points: 1000,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "list-item",
      title: "List an Item",
      description: "List your first item in marketplace",
      points: 1000,
      icon: Package,
      type: 'app',
    },
    {
      id: "list-nft",
      title: "List an NFT",
      description: "List your first NFT for sale",
      points: 1000,
      icon: Image,
      type: 'app',
    },
  ];

  useEffect(() => {
    if (user) {
      loadCompletedTasks();
      loadUserPoints();
    }
  }, [user]);

  const loadCompletedTasks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('user_id', user.id);

    if (data) {
      setCompletedTasks(data.map(t => t.task_id));
    }
  };

  const loadUserPoints = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setTotalPoints(data.total_points);
    }
  };

  const checkFollowStatus = async (taskId: string, username: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-farcaster-follow', {
        body: { targetUsername: username },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.isFollowing || false;
    } catch (error: any) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  };

  const handleVerifyTask = async (task: Task) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete tasks",
        variant: "destructive",
      });
      return;
    }

    setLoading(task.id);

    try {
      if (task.type === 'follow') {
        const username = task.id === 'follow-uniquehub' ? 'uniquehub' : 'uniquebeing404';
        
        toast({
          title: "Checking...",
          description: "Verifying if you've completed the task",
        });

        const isFollowing = await checkFollowStatus(task.id, username);

        if (!isFollowing) {
          window.open(task.followUrl, '_blank');
          toast({
            title: "Not completed yet",
            description: "Please follow the account and try again",
            variant: "destructive",
          });
          setLoading(null);
          return;
        }

        // Mark as verified and ready to claim
        setVerifiedTasks(prev => [...prev, task.id]);
        toast({
          title: "Verified!",
          description: "Click 'Claim Points' to receive your reward",
        });
      }
    } catch (error: any) {
      console.error('Error verifying task:', error);
      toast({
        title: "Verification failed",
        description: "Unable to verify task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleClaimPoints = async (task: Task) => {
    if (!user) return;

    setLoading(task.id);

    try {
      const { data, error } = await supabase.functions.invoke('complete-task', {
        body: { taskId: task.id },
      });

      if (error) throw error;

      if (data?.success) {
        setCompletedTasks(prev => [...prev, task.id]);
        setVerifiedTasks(prev => prev.filter(id => id !== task.id));
        setTotalPoints(prev => prev + data.pointsAwarded);
        
        toast({
          title: "Points claimed! 🎉",
          description: `You earned ${data.pointsAwarded} UP points`,
        });
      } else {
        toast({
          title: "Failed to claim",
          description: data?.message || "Unable to claim points",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error claiming points:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to claim points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isTaskCompleted = (taskId: string) => completedTasks.includes(taskId);
  const isTaskVerified = (taskId: string) => verifiedTasks.includes(taskId);

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold">Earn Rewards</h2>
        <p className="text-xs text-muted-foreground">
          Complete tasks and earn UP points
        </p>
      </div>

      {/* Affiliate Stats */}
      <Card className="p-3 bg-gradient-card relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${cardBgEarn})` }} />
        <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Your Earnings</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-bold text-primary">0</div>
            <div className="text-[10px] text-muted-foreground">Referrals</div>
          </div>
          <div>
            <div className="text-base font-bold text-primary">$0</div>
            <div className="text-[10px] text-muted-foreground">Commission</div>
          </div>
          <div>
            <div className="text-base font-bold text-primary">{totalPoints}</div>
            <div className="text-[10px] text-muted-foreground">UP Points</div>
          </div>
        </div>
        </div>
      </Card>

      {/* Tasks */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold px-1">Available Tasks</h3>
        {tasks.map((task) => {
          const Icon = task.icon;
          const completed = isTaskCompleted(task.id);
          const verified = isTaskVerified(task.id);
          
          return (
            <Card key={task.id} className="p-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgEarn})` }} />
              <div className="relative z-10 flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium">{task.title}</h4>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-primary">
                      +{task.points} UP
                    </span>
                    <Button
                      size="sm"
                      variant={completed ? "outline" : verified ? "default" : "secondary"}
                      className="h-7 text-xs px-3"
                      onClick={() => verified ? handleClaimPoints(task) : handleVerifyTask(task)}
                      disabled={completed || loading === task.id}
                    >
                      {completed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </>
                      ) : loading === task.id ? (
                        "Checking..."
                      ) : verified ? (
                        "Claim Points"
                      ) : (
                        "Complete"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Affiliate Program Info */}
      <Card className="p-3 bg-muted/50">
        <h3 className="text-sm font-semibold mb-2">Affiliate Program</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-1.5">
            <Circle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Earn 10% commission on course sales</span>
          </li>
          <li className="flex items-start gap-1.5">
            <Circle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Get 5% commission on NFT sales</span>
          </li>
          <li className="flex items-start gap-1.5">
            <Circle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Bonus UP points for every referral</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
