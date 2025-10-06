import { CheckInButton } from "@/components/CheckInButton";
import { Leaderboard } from "@/components/Leaderboard";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const EarningSection = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Earn UP Points</h1>
      
      {/* User Stats Card */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {userPoints?.total_points?.toLocaleString() || 0} UP
            </h2>
            <p className="text-sm text-muted-foreground">Your Total Points</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{userPoints?.daily_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{userPoints?.weekly_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Week Streak</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{userPoints?.monthly_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Month Streak</p>
          </div>
        </div>

        <CheckInButton />
      </Card>

      {/* How to Earn Points */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">How to Earn UP</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Daily Check-in: 10 UP</p>
              <p className="text-sm text-muted-foreground">Check in once every 24 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Weekly Check-in: 100 UP</p>
              <p className="text-sm text-muted-foreground">Check in once every 7 days</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Monthly Check-in: 500 UP</p>
              <p className="text-sm text-muted-foreground">Check in once each calendar month</p>
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