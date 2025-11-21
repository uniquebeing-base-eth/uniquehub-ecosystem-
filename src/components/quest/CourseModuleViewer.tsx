import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Star, Trophy, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface Course {
  id: string;
  title: string;
  category: string;
  total_modules: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface ModuleContent {
  lesson: string;
  quiz: QuizQuestion[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  module_number: number;
  points_reward: number;
  is_locked: boolean;
  content: ModuleContent | null;
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
  const [viewState, setViewState] = useState<'lesson' | 'quiz' | 'complete'>('lesson');
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

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
      const modulesWithContent = (data || []).map(module => ({
        ...module,
        content: module.content as unknown as ModuleContent | null
      }));
      setModules(modulesWithContent);
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

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    if (!selectedModule?.content?.quiz) return;
    
    const allAnswered = userAnswers.length === selectedModule.content.quiz.length;
    if (!allAnswered) {
      toast.error("Please answer all questions");
      return;
    }

    const correctAnswers = selectedModule.content.quiz.filter(
      (q, i) => q.correct === userAnswers[i]
    ).length;

    const passed = correctAnswers >= Math.ceil(selectedModule.content.quiz.length * 0.7);
    
    if (passed) {
      setQuizSubmitted(true);
      setViewState('complete');
      toast.success(`Great job! You got ${correctAnswers}/${selectedModule.content.quiz.length} correct!`);
    } else {
      toast.error(`You need at least ${Math.ceil(selectedModule.content.quiz.length * 0.7)} correct answers. Try again!`);
      setUserAnswers([]);
    }
  };

  const resetModuleView = () => {
    setSelectedModule(null);
    setViewState('lesson');
    setUserAnswers([]);
    setQuizSubmitted(false);
  };

  if (selectedModule) {
    const content = selectedModule.content;

    // Lesson View
    if (viewState === 'lesson' && content?.lesson) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto p-6">
            <Button variant="ghost" onClick={resetModuleView} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Card className="p-8 bg-gradient-card border-2">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
                  <p className="text-sm text-muted-foreground">Module {selectedModule.module_number}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-lg leading-relaxed">{content.lesson}</p>
              </div>

              <Button 
                size="lg" 
                onClick={() => setViewState('quiz')}
                className="w-full"
              >
                Continue to Quiz
              </Button>
            </Card>
          </div>
        </div>
      );
    }

    // Quiz View
    if (viewState === 'quiz' && content?.quiz) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto p-6">
            <Button variant="ghost" onClick={() => setViewState('lesson')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lesson
            </Button>

            <Card className="p-8 bg-gradient-card border-2">
              <h2 className="text-2xl font-bold mb-6">Quiz Time! 📝</h2>

              <div className="space-y-6 mb-8">
                {content.quiz.map((question, qIndex) => (
                  <div key={qIndex} className="space-y-3">
                    <p className="font-semibold text-lg">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleQuizAnswer(qIndex, oIndex)}
                          className={`
                            w-full p-4 text-left rounded-lg border-2 transition-all
                            ${userAnswers[qIndex] === oIndex
                              ? 'bg-primary/20 border-primary'
                              : 'bg-card border-border hover:border-primary/50'
                            }
                          `}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                onClick={handleSubmitQuiz}
                disabled={userAnswers.length !== content.quiz.length}
                className="w-full"
              >
                Submit Quiz
              </Button>
            </Card>
          </div>
        </div>
      );
    }

    // Complete View
    if (viewState === 'complete') {
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
                  onClick={resetModuleView}
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
