import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Star, Trophy, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  category: string;
  total_modules: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  module_number: number;
  points_reward: number;
  is_locked: boolean;
}

interface ModuleCompletion {
  module_id: string;
  points_earned: number;
}

interface CourseModuleViewerProps {
  course: Course;
  onBack: () => void;
}

export const CourseModuleViewer = ({ course, onBack }: CourseModuleViewerProps) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchModules();
      fetchCompletions();
    }
  }, [user, course.id]);

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('course_id', course.id)
      .order('module_number', { ascending: true });

    if (error) {
      toast.error("Failed to load modules");
      console.error(error);
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  const fetchCompletions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('module_completions')
      .select('module_id')
      .eq('user_id', user.id)
      .eq('course_id', course.id);

    if (error) {
      console.error(error);
    } else {
      setCompletedModules(new Set(data?.map(c => c.module_id) || []));
    }
  };

  const handleCompleteModule = async (module: Module) => {
    if (!user || completing) return;

    setCompleting(true);

    const { error } = await supabase
      .from('module_completions')
      .insert({
        user_id: user.id,
        module_id: module.id,
        course_id: course.id,
        points_earned: module.points_reward,
      });

    if (error) {
      if (error.code === '23505') {
        toast.info("You've already completed this module!");
      } else {
        toast.error("Failed to complete module");
        console.error(error);
      }
    } else {
      // Success animation
      setCompletedModules(prev => new Set([...prev, module.id]));
      toast.success(`🎉 Module completed! +${module.points_reward} UP points`, {
        description: "You've earned today's streak!",
      });
    }

    setCompleting(false);
    setSelectedModule(null);
  };

  const progress = (completedModules.size / modules.length) * 100;
  const isModuleUnlocked = (moduleNumber: number) => {
    if (moduleNumber === 1) return true;
    return completedModules.has(modules.find(m => m.module_number === moduleNumber - 1)?.id || '');
  };

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-12 rounded-3xl border-2 border-primary/30 text-center animate-scale-in">
            <Star className="w-24 h-24 mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold mb-4">{selectedModule.title}</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Complete this module to earn {selectedModule.points_reward} UP points
            </p>
            
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={() => handleCompleteModule(selectedModule)}
                disabled={completing}
                className="w-full text-lg py-6"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    Complete Module
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSelectedModule(null)}
                disabled={completing}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>

          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{completedModules.size} / {modules.length} modules completed</span>
              <Progress value={progress} className="flex-1 max-w-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading modules...</div>
        ) : (
          <div className="space-y-4">
            {modules.map((module) => {
              const isCompleted = completedModules.has(module.id);
              const isUnlocked = isModuleUnlocked(module.module_number);

              return (
                <button
                  key={module.id}
                  onClick={() => isUnlocked && !isCompleted && setSelectedModule(module)}
                  disabled={!isUnlocked || isCompleted}
                  className={`
                    w-full p-6 rounded-xl border-2 text-left transition-all duration-300
                    ${isCompleted 
                      ? 'bg-primary/10 border-primary/30 opacity-75' 
                      : isUnlocked
                        ? 'bg-gradient-card border-border hover:border-primary/50 hover:scale-[1.02] hover:shadow-glow'
                        : 'bg-muted/50 border-muted opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                          Module {module.module_number}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold mb-1">{module.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">{module.points_reward} UP</span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {isCompleted ? (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-primary" />
                        </div>
                      ) : isUnlocked ? (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="w-8 h-8 text-primary" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
