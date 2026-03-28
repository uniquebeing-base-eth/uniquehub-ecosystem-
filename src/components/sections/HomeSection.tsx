
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, Trophy, Coins, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
  userName?: string;
}

interface UserStats {
  totalPoints: number;
  missionsCompleted: number;
  totalMissions: number;
}

interface RecentAchievement {
  id: string;
  type: string;
  description: string;
  avatar_url?: string;
  display_name?: string;
  created_at: string;
}

export const HomeSection = ({ onNavigate, userName }: HomeSectionProps) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    missionsCompleted: 0,
    totalMissions: 3,
  });
  const [nextMission, setNextMission] = useState<any>(null);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchNextMission();
      fetchRecentAchievements();
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

    // Fetch completed courses/missions
    const { data: completions } = await supabase
      .from('module_completions')
      .select('id')
      .eq('user_id', user.id);

    // Count unique courses completed
    const { data: courseCompletions } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    setUserStats({
      totalPoints: pointsData?.total_points || 0,
      missionsCompleted: courseCompletions?.length || 0,
      totalMissions: 3,
    });
  };

  const fetchNextMission = async () => {
    // Fetch next available learning course as mission
    const { data: courses } = await supabase
      .from('learning_courses')
      .select('*, learning_modules(*)')
      .eq('is_active', true)
      .limit(1);

    if (courses && courses.length > 0) {
      const course = courses[0];
      
      // Get completion status for this user
      let completedModules = 0;
      if (user) {
        const { data: completions } = await supabase
          .from('module_completions')
          .select('module_id')
          .eq('user_id', user.id)
          .eq('course_id', course.id);
        completedModules = completions?.length || 0;
      }

      const totalModules = course.learning_modules?.length || 0;
      const tasks = [
        { id: 1, title: 'Connect Wallet', completed: true },
        { id: 2, title: `Complete ${completedModules}/${totalModules} modules`, completed: completedModules > 0 },
        { id: 3, title: 'Earn your first points', completed: userStats.totalPoints > 0 },
      ];

      setNextMission({
        title: course.title || 'Build Your Base Presence',
        tasks,
        reward: '50 Points',
      });
    } else {
      // Default mission
      setNextMission({
        title: 'Build Your Base Presence',
        tasks: [
          { id: 1, title: 'Connect Wallet', completed: true },
          { id: 2, title: 'Do 3 Onchain Actions (2/3)', completed: false },
          { id: 3, title: 'Post Your First gBase Cast', completed: false },
        ],
        reward: '50 Points',
      });
    }
  };

  const fetchRecentAchievements = async () => {
    // Fetch recent activity from various sources
    const achievements: RecentAchievement[] = [];

    // Get recent module completions with user info
    const { data: completions } = await supabase
      .from('module_completions')
      .select(`
        id,
        completed_at,
        points_earned,
        course_id,
        learning_courses(title)
      `)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (completions) {
      for (const completion of completions) {
        achievements.push({
          id: completion.id,
          type: 'mission',
          description: `completed "${(completion as any).learning_courses?.title || 'a mission'}"`,
          created_at: completion.completed_at || '',
        });
      }
    }

    // Get recent point events
    const { data: pointEvents } = await supabase
      .from('point_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (pointEvents) {
      for (const event of pointEvents) {
        if (event.event_type === 'course_completion') {
          achievements.push({
            id: event.id,
            type: 'earn',
            description: `earned ${event.points_earned} points`,
            created_at: event.created_at,
          });
        }
      }
    }

    // Sort and limit
    achievements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentAchievements(achievements.slice(0, 3));
  };

  const pointsValue = (userStats.totalPoints * 0.0267).toFixed(2);

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* User Profile Card */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          Hello, {userName || profile?.display_name || 'User'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Status: Rising Star</p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-foreground">Missions Completed: <strong>{userStats.missionsCompleted} / {userStats.totalMissions}</strong></span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <Coins className="w-4 h-4 text-primary" />
        <span className="text-foreground">Points: <strong>{userStats.totalPoints}</strong> (~${pointsValue})</span>
      </div>

      {/* Next Mission Card */}
      {nextMission && (
        <Card className="bg-primary text-primary-foreground p-4 rounded-2xl space-y-3">
          <h3 className="font-semibold text-sm">Next Mission: {nextMission.title}</h3>
          <div className="space-y-2">
            {nextMission.tasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                {task.completed ? (
                  <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border-2 border-white/50" />
                )}
                <span className={task.completed ? 'opacity-70' : ''}>{task.title}</span>
              </div>
            ))}
          </div>
          <Button 
            variant="secondary" 
            className="bg-white text-primary hover:bg-white/90 font-semibold rounded-xl"
            onClick={() => onNavigate?.('missions')}
          >
            Start Mission <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      )}

      {/* Recent Achievements */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base text-foreground">Recent Achievements</h3>
        <div className="space-y-2">
          {recentAchievements.length > 0 ? (
            recentAchievements.map((achievement) => (
              <Card 
                key={achievement.id}
                className="p-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={achievement.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {achievement.type === 'mission' ? '🎯' : '💰'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {achievement.display_name || 'User'} {achievement.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Card>
            ))
          ) : (
            <>
              <Card className="p-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 rounded-xl">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">🎯</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Complete your first mission to see achievements</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
