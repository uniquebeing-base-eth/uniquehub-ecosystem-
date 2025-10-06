import { Leaderboard } from "@/components/Leaderboard";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Target, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const EarningSection = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingWeekly, setClaimingWeekly] = useState(false);
  const [claimingMonthly, setClaimingMonthly] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPoints();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user points:', error);
      } else if (data) {
        setUserPoints(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (type: 'daily' | 'weekly' | 'monthly') => {
    if (!user) {
      toast.error('Please sign in to claim rewards');
      return;
    }

    const setLoadingState = type === 'daily' ? setClaimingDaily : type === 'weekly' ? setClaimingWeekly : setClaimingMonthly;
    setLoadingState(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-checkin', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message, { duration: 5000 });
        await fetchUserPoints();
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim reward');
    } finally {
      setLoadingState(false);
    }
  };

  const dailyProgress = userPoints?.daily_streak || 0;
  const weeklyProgress = Math.min((dailyProgress / 7) * 100, 100);
  const monthlyProgress = Math.min((dailyProgress / 30) * 100, 100);
  const canClaimWeekly = dailyProgress >= 7;
  const canClaimMonthly = dailyProgress >= 30;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Earn UP Points</h1>
      
      {/* User Stats Card */}
      <Card className="p-4 sm:p-6 bg-gradient-card">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {userPoints?.total_points?.toLocaleString() || 0} UP
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Your Total Points</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-primary">{userPoints?.daily_streak || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-primary">{userPoints?.weekly_streak || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Week Streak</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-primary">{userPoints?.monthly_streak || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Month Streak</p>
          </div>
        </div>

        {/* Daily Check-in Quest */}
        <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Daily Check-in</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Check in every day</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">+10 UP</span>
            </div>
            <Progress value={100} className="h-1.5 sm:h-2 mb-2 sm:mb-3" />
            <Button
              onClick={() => handleClaim('daily')}
              disabled={claimingDaily || !user}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm sm:text-base h-9 sm:h-10"
            >
              {claimingDaily ? 'Claiming...' : 'Claim'}
            </Button>
          </div>

          {/* Weekly Check-in Quest */}
          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Weekly Streak</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Check in 7 days in a row</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">+100 UP</span>
            </div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Progress value={weeklyProgress} className="h-1.5 sm:h-2 flex-1" />
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">{Math.floor(weeklyProgress)}%</span>
            </div>
            <Button
              onClick={() => handleClaim('weekly')}
              disabled={claimingWeekly || !user || !canClaimWeekly}
              variant={canClaimWeekly ? "default" : "outline"}
              className="w-full font-semibold text-sm sm:text-base h-9 sm:h-10"
            >
              {claimingWeekly ? 'Claiming...' : canClaimWeekly ? 'Claim' : `${dailyProgress}/7 days`}
            </Button>
          </div>

          {/* Monthly Check-in Quest */}
          <div className="bg-background/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Target className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">Monthly Streak</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Check in 30 days in a row</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">+500 UP</span>
            </div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Progress value={monthlyProgress} className="h-1.5 sm:h-2 flex-1" />
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap">{Math.floor(monthlyProgress)}%</span>
            </div>
            <Button
              onClick={() => handleClaim('monthly')}
              disabled={claimingMonthly || !user || !canClaimMonthly}
              variant={canClaimMonthly ? "default" : "outline"}
              className="w-full font-semibold text-sm sm:text-base h-9 sm:h-10"
            >
              {claimingMonthly ? 'Claiming...' : canClaimMonthly ? 'Claim' : `${dailyProgress}/30 days`}
            </Button>
          </div>
        </div>
      </Card>

      {/* How to Earn Points */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold text-foreground">How to Earn UP</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Daily Check-in: 10 UP</p>
              <p className="text-sm text-muted-foreground">Check in daily to earn and build streaks</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Weekly Streak: 100 UP</p>
              <p className="text-sm text-muted-foreground">Unlocks after 7 consecutive daily check-ins</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Monthly Streak: 500 UP</p>
              <p className="text-sm text-muted-foreground">Unlocks after 30 consecutive daily check-ins</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Buy Volume: 1 UP per $1</p>
              <p className="text-sm text-muted-foreground">Earn points when you buy courses or NFTs (max 1000 UP per transaction)</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Trade Volume: 1 UP per $1</p>
              <p className="text-sm text-muted-foreground">Earn points when you sell (max 1000 UP per transaction)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Leaderboard */}
      <Leaderboard />

      {/* Streak Rewards Info */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Streak Bonuses</h3>
        </div>
        <p className="text-muted-foreground">
          Keep your streaks alive to maximize your earnings! Consecutive check-ins build your 
          daily, weekly, and monthly streaks. Future updates will reward top streak holders with 
          exclusive NFTs and token airdrops! 🚀
        </p>
      </Card>
    </div>
  );
};