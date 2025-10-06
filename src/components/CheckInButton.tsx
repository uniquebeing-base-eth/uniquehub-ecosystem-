import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const CheckInButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!user) {
      toast.error('Please sign in to check in');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-checkin', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        const { pointsAwarded, streaks, checkIns } = data;
        
        let message = `🎉 ${data.message}\n\n`;
        
        if (checkIns.includes('daily_checkin')) {
          message += `📅 Daily Check-in Streak: ${streaks.daily} days\n`;
        }
        if (checkIns.includes('weekly_checkin')) {
          message += `📊 Weekly Check-in Streak: ${streaks.weekly} weeks\n`;
        }
        if (checkIns.includes('monthly_checkin')) {
          message += `🏆 Monthly Check-in Streak: ${streaks.monthly} months\n`;
        }

        toast.success(message, { duration: 5000 });
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to process check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckIn}
      disabled={loading || !user}
      className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-bold"
    >
      <Calendar className="w-4 h-4 mr-2" />
      {loading ? 'Processing...' : 'Daily Check-In'}
      <Trophy className="w-4 h-4 ml-2" />
    </Button>
  );
};