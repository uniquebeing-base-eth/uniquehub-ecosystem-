
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Lock, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'complete';
  tasksCompleted: number;
  totalTasks: number;
  reward: string;
  rewardTokens?: string;
  isLocked?: boolean;
  tasks: MissionTask[];
}

interface MissionTask {
  id: string;
  title: string;
  completed: boolean;
  proofUrl?: string;
  proofRequired?: boolean;
}

export const MissionsSection = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, [user]);

  const fetchMissions = async () => {
    setIsLoading(true);
    
    // Fetch learning courses as missions
    const { data: courses } = await supabase
      .from('learning_courses')
      .select(`
        *,
        learning_modules(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (courses) {
      const formattedMissions: Mission[] = [];

      for (const course of courses) {
        const modules = course.learning_modules || [];
        
        // Get user's completions for this course
        let completedModules: string[] = [];
        if (user) {
          const { data: completions } = await supabase
            .from('module_completions')
            .select('module_id')
            .eq('user_id', user.id)
            .eq('course_id', course.id);
          completedModules = completions?.map(c => c.module_id) || [];
        }

        const tasks: MissionTask[] = modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          completed: completedModules.includes(m.id),
          proofRequired: false,
        }));

        const completedCount = tasks.filter(t => t.completed).length;
        let status: Mission['status'] = 'not_started';
        if (completedCount === tasks.length && tasks.length > 0) {
          status = 'complete';
        } else if (completedCount > 0) {
          status = 'in_progress';
        }

        // Calculate total reward points
        const totalReward = modules.reduce((sum: number, m: any) => sum + (m.points_reward || 10), 0);

        formattedMissions.push({
          id: course.id,
          title: course.title,
          description: course.description || '',
          status,
          tasksCompleted: completedCount,
          totalTasks: tasks.length,
          reward: `${totalReward} Points`,
          tasks,
          isLocked: formattedMissions.length > 0 && formattedMissions[formattedMissions.length - 1].status !== 'complete',
        });
      }

      // Unlock first mission and missions after completed ones
      if (formattedMissions.length > 0) {
        formattedMissions[0].isLocked = false;
        for (let i = 1; i < formattedMissions.length; i++) {
          if (formattedMissions[i - 1].status === 'complete') {
            formattedMissions[i].isLocked = false;
          }
        }
      }

      setMissions(formattedMissions);
    }

    setIsLoading(false);
  };

  const handleCompleteTask = async (missionId: string, taskId: string) => {
    if (!user) {
      toast.error('Please sign in to complete tasks');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('complete-module', {
        body: { moduleId: taskId, courseId: missionId },
      });

      if (error) throw error;

      toast.success('Task completed! Points earned.');
      fetchMissions();
      
      // Update selected mission if viewing
      if (selectedMission) {
        setSelectedMission(prev => {
          if (!prev) return null;
          const updatedTasks = prev.tasks.map(t => 
            t.id === taskId ? { ...t, completed: true } : t
          );
          return {
            ...prev,
            tasks: updatedTasks,
            tasksCompleted: updatedTasks.filter(t => t.completed).length,
          };
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mission Detail View
  if (selectedMission) {
    const progress = (selectedMission.tasksCompleted / selectedMission.totalTasks) * 100;
    
    return (
      <div className="space-y-4 pb-24 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedMission(null)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{selectedMission.title}</h1>
            <p className="text-sm text-muted-foreground">
              In Progress • {selectedMission.tasksCompleted} / {selectedMission.totalTasks} Tasks
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-1.5">
          {[...Array(selectedMission.totalTasks)].map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < selectedMission.tasksCompleted ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Mission Card */}
        <Card className="bg-primary text-primary-foreground p-4 rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-base">{selectedMission.title}</h3>
            <p className="text-sm opacity-80">
              In Progress • {selectedMission.tasksCompleted} / {selectedMission.totalTasks} Tasks
            </p>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {selectedMission.tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-white/50 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? 'opacity-70 line-through' : ''}`}>
                    {task.title}
                  </p>
                  {task.proofUrl && (
                    <a 
                      href={task.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-white/70 flex items-center gap-1 hover:text-white"
                    >
                      View Proof <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {!task.completed && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7 bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => handleCompleteTask(selectedMission.id, task.id)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Reward */}
          <div className="pt-2 border-t border-white/20">
            <p className="text-sm">
              <span className="opacity-70">Reward: </span>
              <span className="font-semibold">{selectedMission.reward}</span>
              {selectedMission.rewardTokens && (
                <span className="font-semibold"> + {selectedMission.rewardTokens}</span>
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2 bg-white/20" />

          {/* Action Button */}
          {selectedMission.status === 'complete' ? (
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
              ✓ Mission Complete
            </Button>
          ) : (
            <Button 
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={() => {
                const nextTask = selectedMission.tasks.find(t => !t.completed);
                if (nextTask) {
                  handleCompleteTask(selectedMission.id, nextTask.id);
                }
              }}
            >
              Continue Mission
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Missions List View
  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Missions</h1>
        <Badge variant="outline" className="text-xs">EDUTMENT</Badge>
      </div>

      {/* Missions List */}
      <div className="space-y-3">
        {missions.map((mission) => {
          const progress = (mission.tasksCompleted / mission.totalTasks) * 100;
          
          return (
            <Card 
              key={mission.id}
              className={`p-4 rounded-2xl transition-all ${
                mission.isLocked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:border-primary/50'
              } ${mission.status === 'complete' ? 'border-green-500/50' : ''}`}
              onClick={() => !mission.isLocked && setSelectedMission(mission)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">{mission.title}</h3>
                    {/* Progress dots */}
                    <div className="flex gap-1">
                      {[...Array(Math.min(mission.totalTasks, 5))].map((_, i) => (
                        <div 
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < mission.tasksCompleted ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {mission.status === 'complete' ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </span>
                    ) : mission.status === 'in_progress' ? (
                      `In Progress • ${mission.tasksCompleted} / ${mission.totalTasks} Tasks`
                    ) : (
                      `${mission.totalTasks} Tasks`
                    )}
                  </p>

                  {/* Preview tasks */}
                  <div className="space-y-1">
                    {mission.tasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <Circle className="w-3 h-3" />
                        )}
                        <span className={task.completed ? 'line-through opacity-70' : ''}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reward and Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      Reward: <span className="text-foreground font-medium">{mission.reward}</span>
                    </span>
                    {mission.isLocked ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </Badge>
                    ) : mission.status === 'complete' ? (
                      <Badge className="text-[10px] bg-green-500">✓ Moof</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                        {mission.status === 'in_progress' ? 'Continue' : 'Begin Mission'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {missions.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No missions available yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
