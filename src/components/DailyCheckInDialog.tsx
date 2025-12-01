import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DailyCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDay: number;
  onSuccess: () => void;
}

export const DailyCheckInDialog = ({ 
  open, 
  onOpenChange, 
  currentDay,
  onSuccess 
}: DailyCheckInDialogProps) => {
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async () => {
    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to check in daily.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-checkin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: data.isMysteryBox ? "🎉 Mystery Box Unlocked!" : "✅ Check-In Successful!",
          description: data.message,
        });
        
        // Wait for animation, then close and refresh
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
        }, 1500);
      } else {
        toast({
          title: "Already Checked In",
          description: data.message,
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-In Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="text-center space-y-6 pt-4">
          <h2 className="text-3xl font-bold text-foreground">Daily Check-In</h2>

          {/* 6-Day Grid */}
          <div className="grid grid-cols-3 gap-4 py-6">
            {[1, 2, 3, 4, 5, 6].map((day) => {
              const isCurrentDay = day === currentDay;
              const isMysteryBox = day === 6;
              const isCompleted = day < currentDay;

              return (
                <div
                  key={day}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    isCurrentDay
                      ? 'bg-primary/20 ring-2 ring-primary shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-primary/10 opacity-50'
                      : 'bg-muted/50'
                  }`}
                >
                  {isMysteryBox ? (
                    <Gift 
                      className={`w-12 h-12 ${isCurrentDay ? 'text-primary animate-pulse' : 'text-primary/70'}`} 
                    />
                  ) : (
                    <Coins 
                      className={`w-12 h-12 ${isCurrentDay ? 'text-yellow-500 animate-pulse' : isCompleted ? 'text-yellow-500/50' : 'text-yellow-500/70'}`} 
                    />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {isMysteryBox ? 'Mystery' : `Day ${day}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isMysteryBox ? '200-1000 UP' : '100 UP'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Check-In Button */}
          <Button
            onClick={handleCheckIn}
            disabled={claiming}
            className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {claiming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-5 w-5" />
                Check In
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
