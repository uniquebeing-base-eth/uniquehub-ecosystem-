import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_level: number;
  milestone_value: number;
  points_awarded: number;
  badge_icon: string;
  badge_color: string;
}

interface AchievementClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: Achievement[];
  onClaimed: () => void;
}

const getAchievementTitle = (type: string, level: number): string => {
  if (type === 'courses') {
    const titles = ['First Course', 'Rising Star', 'Course Master', 'Expert Creator', 'Master Creator'];
    return titles[level - 1] || 'Achievement';
  } else if (type === 'students') {
    const titles = ['First Student', 'Popular Teacher', 'Teaching Legend', 'Education Icon'];
    return titles[level - 1] || 'Achievement';
  }
  return 'Achievement';
};

const getAchievementDescription = (type: string, value: number): string => {
  if (type === 'courses') {
    return `Created ${value} ${value === 1 ? 'course' : 'courses'}`;
  } else if (type === 'students') {
    return `Reached ${value} ${value === 1 ? 'student' : 'students'}`;
  }
  return '';
};

export const AchievementClaimModal = ({ open, onOpenChange, achievements, onClaimed }: AchievementClaimModalProps) => {
  const [claiming, setClaiming] = useState(false);

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points_awarded || 0), 0);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { error } = await supabase
        .from('creator_achievements')
        .update({ is_claimed: true })
        .in('id', achievements.map(a => a.id));

      if (error) throw error;

      toast.success(`Claimed ${achievements.length} ${achievements.length === 1 ? 'achievement' : 'achievements'}! +${totalPoints} points`);
      onClaimed();
      onOpenChange(false);
    } catch (error) {
      console.error('Error claiming achievements:', error);
      toast.error('Failed to claim achievements');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            New Achievements Unlocked!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{achievement.badge_icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">
                    {getAchievementTitle(achievement.achievement_type, achievement.achievement_level)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getAchievementDescription(achievement.achievement_type, achievement.milestone_value)}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    +{achievement.points_awarded} points
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Rewards</span>
            <span className="text-xl font-bold text-primary">+{totalPoints} points</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
            disabled={claiming}
          >
            <X className="w-4 h-4 mr-2" />
            Later
          </Button>
          <Button
            onClick={handleClaim}
            className="flex-1"
            disabled={claiming}
          >
            <Trophy className="w-4 h-4 mr-2" />
            {claiming ? 'Claiming...' : 'Claim All'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
