
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Coins, Trophy, Star, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';

interface Achievement {
  id: string;
  title: string;
  icon: string;
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  icon: string;
}

export const EarnSection = () => {
  const { user } = useAuth();
  const { address } = useFarcasterWallet();
  const [points, setPoints] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchAchievements();
      fetchRecentActivity();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch points
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    setPoints(pointsData?.total_points || 0);

    // Calculate tokens (simplified - could be from actual token balance)
    setTokens(Math.floor((pointsData?.total_points || 0) / 10));
  };

  const fetchAchievements = async () => {
    if (!user) return;

    const achievements: Achievement[] = [];

    // Check for completed missions
    const { data: completions } = await supabase
      .from('module_completions')
      .select('id')
      .eq('user_id', user.id);

    if (completions && completions.length > 0) {
      achievements.push({
        id: 'missions',
        title: `${completions.length} Missions Completed`,
        icon: '🏆',
      });
    }

    // Check for points earned
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (pointsData?.total_points && pointsData.total_points > 0) {
      achievements.push({
        id: 'earner',
        title: `$${(pointsData.total_points * 0.0267).toFixed(0)} Total Earned`,
        icon: '💰',
      });
    }

    // Add Rising Star badge if user has any activity
    if (achievements.length > 0) {
      achievements.unshift({
        id: 'rising-star',
        title: 'Rising Star Badge',
        icon: '⭐',
      });
    }

    setAchievements(achievements);
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    const activities: RecentActivity[] = [];

    // Fetch recent point events
    const { data: pointEvents } = await supabase
      .from('point_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (pointEvents) {
      for (const event of pointEvents) {
        let description = '';
        let icon = '💰';
        
        if (event.event_type === 'course_completion') {
          description = `Earned ${event.points_earned} points`;
          icon = '🎓';
        } else if (event.event_type === 'daily_checkin') {
          description = 'Daily check-in bonus';
          icon = '✅';
        } else if (event.event_type === 'task_completion') {
          description = `Task completed - ${event.points_earned} pts`;
          icon = '🎯';
        } else {
          description = `Earned ${event.points_earned} points`;
        }

        activities.push({
          id: event.id,
          description,
          timestamp: formatTimeAgo(event.created_at),
          icon,
        });
      }
    }

    // Fetch recent module completions
    const { data: moduleCompletions } = await supabase
      .from('module_completions')
      .select('*, learning_courses(title)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (moduleCompletions) {
      for (const completion of moduleCompletions) {
        activities.push({
          id: `mc-${completion.id}`,
          description: `Completed "${(completion as any).learning_courses?.title || 'mission'}"`,
          timestamp: formatTimeAgo(completion.completed_at || ''),
          icon: '🎯',
        });
      }
    }

    // Sort by most recent and limit
    activities.sort((a, b) => {
      // Simple comparison - newer items first
      return activities.indexOf(a) - activities.indexOf(b);
    });

    setRecentActivity(activities.slice(0, 5));
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const pointsValue = (points * 0.0267).toFixed(2);
  const tokensValue = (tokens * 0.30).toFixed(2);

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Earn</h1>
      </div>

      {/* Wallet Balance Card */}
      <Card className="p-4 rounded-2xl space-y-4">
        <h3 className="font-semibold text-base text-foreground">Wallet Balance</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Points:</span>
            </div>
            <span className="font-bold text-foreground">
              {points.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">(~${pointsValue})</span>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <span className="text-sm text-muted-foreground">Tokens:</span>
            </div>
            <span className="font-bold text-foreground">
              {tokens} UHT <span className="text-sm font-normal text-muted-foreground">(~${tokensValue})</span>
            </span>
          </div>
        </div>

        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
          Withdraw
        </Button>
      </Card>

      {/* Achievements */}
      <Card className="p-4 rounded-2xl space-y-3">
        <h3 className="font-semibold text-base text-foreground">Achievements</h3>
        
        <div className="space-y-2">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3">
                <span className="text-lg">{achievement.icon}</span>
                <span className="text-sm text-foreground">{achievement.title}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Complete missions to earn achievements!</p>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4 rounded-2xl space-y-3">
        <h3 className="font-semibold text-base text-foreground">Recent Activity</h3>
        
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-sm">
                    {activity.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.timestamp}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Start completing missions to see activity!</p>
          )}
        </div>
      </Card>
    </div>
  );
};
