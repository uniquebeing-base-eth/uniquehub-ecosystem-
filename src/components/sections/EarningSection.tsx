import { Leaderboard } from "@/components/Leaderboard";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Target, Coins, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DailyCheckInDialog } from "@/components/DailyCheckInDialog";

export const EarningSection = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPoints();
    }
  }, [user]);

  useEffect(() => {
    // Show dialog once per session if user hasn't checked in today
    if (user && userPoints && !hasShownDialog) {
      const lastCheckin = userPoints.last_daily_checkin ? new Date(userPoints.last_daily_checkin) : null;
      const now = new Date();
      const daysSince = lastCheckin ? Math.floor((now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      if (daysSince >= 1) {
        setShowCheckInDialog(true);
        setHasShownDialog(true);
      }
    }
  }, [user, userPoints, hasShownDialog]);

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

  const currentDay = userPoints?.daily_streak || 0; // Day in 6-day cycle (1-6)
  const lastCheckin = userPoints?.last_daily_checkin ? new Date(userPoints.last_daily_checkin) : null;
  const now = new Date();
  const daysSince = lastCheckin ? Math.floor((now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const canCheckIn = daysSince >= 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <DailyCheckInDialog 
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        currentDay={currentDay}
        onSuccess={fetchUserPoints}
      />
      
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

        {/* Daily Check-in - 6 Day Cycle */}
        <div className="bg-background/50 rounded-xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">Daily Check-In</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Check in for 5 days to unlock the Mystery Box!
            </p>
          </div>

          {/* 6-Day Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6].map((day) => {
              const isCurrentDay = day === currentDay;
              const isMysteryBox = day === 6;
              const isCompleted = day < currentDay;

              return (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all ${
                    isCurrentDay
                      ? 'bg-primary/20 ring-2 ring-primary shadow-lg'
                      : isCompleted
                      ? 'bg-primary/10 opacity-50'
                      : 'bg-muted/30'
                  }`}
                >
                  {isMysteryBox ? (
                    <Gift 
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${isCurrentDay ? 'text-primary animate-pulse' : 'text-primary/70'}`} 
                    />
                  ) : (
                    <Coins 
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${isCurrentDay ? 'text-yellow-500 animate-pulse' : isCompleted ? 'text-yellow-500/50' : 'text-yellow-500/70'}`} 
                    />
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {isMysteryBox ? 'Box' : `Day ${day}`}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {isMysteryBox ? '200-1K' : '100 UP'}
                  </span>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() => setShowCheckInDialog(true)}
            disabled={!user || !canCheckIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 sm:py-4"
          >
            {!user ? 'Sign In to Check In' : !canCheckIn ? 'Come Back Tomorrow' : 'Check In Now'}
          </Button>
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
              <p className="font-semibold text-foreground">Daily Check-in: 100 UP</p>
              <p className="text-sm text-muted-foreground">Check in every day (Days 1-5)</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-card rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Mystery Box: 200-1000 UP</p>
              <p className="text-sm text-muted-foreground">Unlock on Day 6 with random rewards!</p>
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

      {/* Check-in Cycle Info */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Mystery Box Rewards</h3>
        </div>
        <p className="text-muted-foreground">
          Complete 5 days of check-ins to unlock the Mystery Box on Day 6! The box contains 
          200-1000 UP points randomly. After opening the box, your cycle resets to Day 1. 
          Keep checking in daily to maximize your rewards! 🎁
        </p>
      </Card>
    </div>
  );
};