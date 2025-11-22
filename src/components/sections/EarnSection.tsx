import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Coins, BookOpen, Package, Image, UserPlus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useViemClients } from "@/hooks/useViemClients";
import { useFarcasterWallet } from "@/hooks/useFarcasterWallet";
import { EARN_POINTS_CLAIM_ABI, EARN_POINTS_CLAIM_ADDRESS, EARN_CLAIM_FEE } from "@/config/wagmi";
import { base } from "viem/chains";
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
  const { address } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [verifiedTasks, setVerifiedTasks] = useState<string[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('verifiedTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [clickedTasks, setClickedTasks] = useState<string[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('clickedTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastClaimedPoints, setLastClaimedPoints] = useState(0);
  const [totalEthEarned, setTotalEthEarned] = useState(0);
  const [totalUsdcEarned, setTotalUsdcEarned] = useState(0);

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
      id: "read-blog-web3",
      title: "Read What is Web3",
      description: "Learn about Web3 fundamentals",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-education",
      title: "Read Education in Web3",
      description: "Understand Web3 education importance",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-web3-terms",
      title: "Read Web3 Terms & Definitions",
      description: "Master essential Web3 terminology",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-about-uniquehub",
      title: "Read About UniqueHub",
      description: "Discover the UniqueHub ecosystem",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-uniquehub-features",
      title: "Read UniqueHub Features",
      description: "Explore platform features and updates",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-meet-uniqbot",
      title: "Read Meet UniqBot",
      description: "Learn about your AI assistant",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-blue-energy-nfts",
      title: "Read Blue Energy NFTs",
      description: "Discover UniqueHub avatars",
      points: 100,
      icon: BookOpen,
      type: 'app',
    },
    {
      id: "read-blog-creativity-campaign",
      title: "Read Creativity Campaign",
      description: "Join the creativity challenge",
      points: 100,
      icon: BookOpen,
      type: 'app',
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

  // Persist verified and clicked tasks to localStorage
  useEffect(() => {
    localStorage.setItem('verifiedTasks', JSON.stringify(verifiedTasks));
  }, [verifiedTasks]);

  useEffect(() => {
    localStorage.setItem('clickedTasks', JSON.stringify(clickedTasks));
  }, [clickedTasks]);

  useEffect(() => {
    if (user) {
      loadCompletedTasks();
      loadUserPoints();
      loadUserEarnings();
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

  const loadUserEarnings = async () => {
    if (!user) return;

    const { data: payments } = await supabase
      .from('course_payments')
      .select('amount, currency, status')
      .eq('seller_user_id', user.id)
      .eq('status', 'completed');
    
    let eth_earned = 0;
    let usdc_earned = 0;
    
    payments?.forEach(payment => {
      if (payment.currency === 'ETH') {
        eth_earned += Number(payment.amount);
      } else if (payment.currency === 'USDC') {
        usdc_earned += Number(payment.amount);
      }
    });
    
    setTotalEthEarned(eth_earned);
    setTotalUsdcEarned(usdc_earned);
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

    // Handle blog reading tasks - navigate to blog section
    if (task.id === 'read-blog-web3' || 
        task.id === 'read-blog-education' ||
        task.id === 'read-blog-web3-terms' ||
        task.id === 'read-blog-about-uniquehub' ||
        task.id === 'read-blog-uniquehub-features' ||
        task.id === 'read-blog-meet-uniqbot' ||
        task.id === 'read-blog-blue-energy-nfts' ||
        task.id === 'read-blog-creativity-campaign') {
      
      // First click - open blog section
      if (!clickedTasks.includes(task.id)) {
        // Update localStorage immediately before navigation
        const updated = [...clickedTasks, task.id];
        localStorage.setItem('clickedTasks', JSON.stringify(updated));
        setClickedTasks(updated);
        
        toast({
          title: "Opening blog section",
          description: "Read the article, then come back and click Complete again",
        });
        
        // Navigate to blog section after a short delay to ensure state is saved
        setTimeout(() => {
          const event = new CustomEvent('navigateToSection', { detail: 'blog' });
          window.dispatchEvent(event);
        }, 100);
        return;
      }
      
      // Second click - mark as verified and ready to claim
      const updatedVerified = [...verifiedTasks, task.id];
      localStorage.setItem('verifiedTasks', JSON.stringify(updatedVerified));
      setVerifiedTasks(updatedVerified);
      
      toast({
        title: "Verified! ✓",
        description: "Click 'Claim Points' to receive your reward",
      });
      return;
    }

    // Handle follow tasks
    if (task.type === 'follow') {
      // First click - open the link
      if (!clickedTasks.includes(task.id)) {
        if (task.followUrl) {
          window.open(task.followUrl, '_blank');
          setClickedTasks(prev => [...prev, task.id]);
          toast({
            title: "Follow the account",
            description: "After following, come back and click Complete again",
          });
        }
        return;
      }

      // Second click - verify follow status
      setLoading(task.id);

      try {
        const username = task.id === 'follow-uniquehub' ? 'uniquehub' : 'uniquebeing404';
        
        toast({
          title: "Checking...",
          description: "Verifying if you've completed the task",
        });

        const isFollowing = await checkFollowStatus(task.id, username);

        if (!isFollowing) {
          toast({
            title: "Not followed yet",
            description: "Please follow the account first, then try again",
            variant: "destructive",
          });
          setLoading(null);
          return;
        }

        // Mark as verified and ready to claim
        setVerifiedTasks(prev => [...prev, task.id]);
        toast({
          title: "Verified! ✓",
          description: "Click 'Claim Points' to receive your reward",
        });
      } catch (error: any) {
        console.error('Error verifying task:', error);
        
        // Check if error is due to no Farcaster account
        if (error.message && error.message.includes('No Farcaster account linked')) {
          toast({
            title: "Farcaster account required",
            description: "Please connect your Farcaster account to verify follow tasks",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Verification failed",
            description: "Unable to verify. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(null);
      }
      return;
    }

    // Handle other app-based tasks (courses, listings, etc.)
    setLoading(task.id);
    
    try {
      // Verify the task was actually completed
      let isVerified = false;
      
      if (task.id === 'finish-1-course') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        isVerified = (enrollments?.length || 0) >= 1;
      } else if (task.id === 'finish-5-courses') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null);
        isVerified = (enrollments?.length || 0) >= 5;
      } else if (task.id === 'list-item') {
        const { data: items } = await supabase
          .from('marketplace_items')
          .select('id')
          .eq('user_id', user.id);
        isVerified = (items?.length || 0) >= 1;
      } else if (task.id === 'list-nft') {
        const { data: nfts } = await supabase
          .from('nft_listings')
          .select('id')
          .eq('user_id', user.id);
        isVerified = (nfts?.length || 0) >= 1;
      }
      
      if (isVerified) {
        setVerifiedTasks(prev => [...prev, task.id]);
        toast({
          title: "Verified! ✓",
          description: "Click 'Claim Points' to receive your reward",
        });
      } else {
        toast({
          title: "Not completed yet",
          description: "Complete this task first, then come back to claim",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying task:', error);
      toast({
        title: "Verification failed",
        description: "Unable to verify. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleClaimPoints = async (task: Task) => {
    if (!user || !address || !walletClient) {
      toast({
        title: "Wallet required",
        description: "Please connect your wallet to claim points",
        variant: "destructive",
      });
      return;
    }

    setLoading(task.id);

    try {
      console.log(`Claiming points on-chain for task: ${task.id}`);
      
      // Call the smart contract to claim points
      const hash = await walletClient.writeContract({
        address: EARN_POINTS_CLAIM_ADDRESS,
        abi: EARN_POINTS_CLAIM_ABI,
        functionName: 'claimPoints',
        args: [task.id, BigInt(task.points)],
        value: EARN_CLAIM_FEE,
        chain: base,
        account: address,
      });

      toast({
        title: "Transaction submitted",
        description: "Waiting for confirmation...",
      });

      // Wait for transaction confirmation
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log('On-chain claim successful, calling backend...');
        
        // Now call the backend to record the completion
        const { data, error } = await supabase.functions.invoke('complete-task', {
          body: { taskId: task.id },
        });

        if (error) throw error;

        if (data?.success) {
          setCompletedTasks(prev => [...prev, task.id]);
          // Clear from verified and clicked tasks
          setVerifiedTasks(prev => {
            const updated = prev.filter(id => id !== task.id);
            localStorage.setItem('verifiedTasks', JSON.stringify(updated));
            return updated;
          });
          setClickedTasks(prev => {
            const updated = prev.filter(id => id !== task.id);
            localStorage.setItem('clickedTasks', JSON.stringify(updated));
            return updated;
          });
          
          const newTotalPoints = totalPoints + data.pointsAwarded;
          setTotalPoints(newTotalPoints);
          setLastClaimedPoints(data.pointsAwarded);
          
          await loadUserPoints();
          
          toast({
            title: "Points claimed! 🎉",
            description: `You earned ${data.pointsAwarded} UP points`,
          });

          setShowShareDialog(true);
        } else {
          toast({
            title: "Backend update failed",
            description: data?.message || "Points claimed on-chain but backend update failed",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Error claiming points:', error);
      
      let errorMessage = "Failed to claim points. Please try again.";
      
      if (error.message) {
        if (error.message.includes('User rejected')) {
          errorMessage = "Transaction cancelled";
        } else if (error.message.includes('already completed')) {
          errorMessage = "You've already completed this task.";
        } else if (error.message.includes('Points already claimed')) {
          errorMessage = "Points already claimed for this task.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
      <Card className="p-4 relative overflow-hidden border-primary/30">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-50" 
          style={{ backgroundImage: `url(${animeEarnBg})` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 to-background/90" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Your Earnings</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/40">
              <div className="text-xl font-bold text-foreground">{totalPoints}</div>
              <div className="text-xs text-muted-foreground font-medium">UP Points</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/40">
              <div className="text-sm font-bold text-foreground">
                {totalEthEarned > 0 && <div className="text-blue-400">Ξ {totalEthEarned.toFixed(4)}</div>}
                {totalUsdcEarned > 0 && <div className="text-green-400 flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" />{totalUsdcEarned.toFixed(2)}
                </div>}
                {totalEthEarned === 0 && totalUsdcEarned === 0 && <div>$0</div>}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Money Earned</div>
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Congratulations! 🎉</DialogTitle>
            <DialogDescription>
              You just earned {lastClaimedPoints} UP points! Share your achievement on Farcaster.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <ShareToFarcaster
              text={`Just earned ${lastClaimedPoints} UP points on @uniquehub! 🎉 Join me and start earning rewards for completing tasks! 💎`}
              embeds={[
                'https://uniqueehub.vercel.app/opengraph-image.png',
                'https://uniqueehub.vercel.app'
              ]}
              buttonText="Share on Farcaster"
              variant="default"
              size="sm"
              className="w-full"
            />
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
              className="w-full"
            >
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
