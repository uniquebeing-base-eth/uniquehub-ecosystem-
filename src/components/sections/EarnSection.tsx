import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Coins, Share2, UserPlus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  completed?: boolean;
}

export const EarnSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const tasks: Task[] = [
    {
      id: "follow-uniquehub",
      title: "Follow UniqueHub",
      description: "Follow our official account",
      points: 50,
      icon: UserPlus,
    },
    {
      id: "follow-dev",
      title: "Follow @uniquebeing404",
      description: "Support our dev on Farcaster",
      points: 50,
      icon: UserPlus,
    },
    {
      id: "share-course",
      title: "Share a Course",
      description: "Help tutors by sharing their courses",
      points: 100,
      icon: Share2,
    },
    {
      id: "promote-nft",
      title: "Promote an NFT",
      description: "Help market NFTs and earn commission",
      points: 150,
      icon: TrendingUp,
    },
  ];

  const handleCompleteTask = (taskId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete tasks",
        variant: "destructive",
      });
      return;
    }

    setCompletedTasks([...completedTasks, taskId]);
    const task = tasks.find(t => t.id === taskId);
    
    toast({
      title: "Task completed! 🎉",
      description: `You earned ${task?.points} UP points`,
    });
  };

  const isTaskCompleted = (taskId: string) => completedTasks.includes(taskId);

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold">Earn Rewards</h2>
        <p className="text-xs text-muted-foreground">
          Complete tasks and earn UP points
        </p>
      </div>

      {/* Affiliate Stats */}
      <Card className="p-3 bg-gradient-card">
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
            <div className="text-base font-bold text-primary">0</div>
            <div className="text-[10px] text-muted-foreground">UP Points</div>
          </div>
        </div>
      </Card>

      {/* Tasks */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold px-1">Available Tasks</h3>
        {tasks.map((task) => {
          const Icon = task.icon;
          const completed = isTaskCompleted(task.id);
          
          return (
            <Card key={task.id} className="p-3">
              <div className="flex items-start gap-2">
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
                      variant={completed ? "outline" : "default"}
                      className="h-7 text-xs px-3"
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={completed}
                    >
                      {completed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Done
                        </>
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
