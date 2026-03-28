

import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Star, Trophy, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { QUEST_LEARNING_HUB_ABI, QUEST_LEARNING_HUB_ADDRESS, MODULE_COMPLETION_FEE } from '@/config/wagmi';
import { base } from 'wagmi/chains';
import { CourseCompletionShareDialog } from './CourseCompletionShareDialog';


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

interface Section {
  type: string;
  content?: string;
  questions?: QuizQuestion[];
}

interface ModuleContent {
  type: string;
  sections?: Section[];
  lesson?: string;
  quiz?: QuizQuestion[];
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
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'lesson' | 'quiz' | 'complete'>('lesson');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [finalScore, setFinalScore] = useState(100);
  const [showCourseCompletionDialog, setShowCourseCompletionDialog] = useState(false);
  const [totalCoursePoints, setTotalCoursePoints] = useState(0);

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
    if (!user || !address || completing) return;

    setCompleting(true);

    try {
      toast.info("Initiating transaction...");
      
      writeContract({
        address: QUEST_LEARNING_HUB_ADDRESS,
        abi: QUEST_LEARNING_HUB_ABI,
        functionName: 'completeModule',
        args: [course.id, module.id],
        value: MODULE_COMPLETION_FEE,
        chain: base,
        account: address,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed");
      setCompleting(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isTxSuccess && selectedModule) {
      recordModuleCompletion(selectedModule);
    }
  }, [isTxSuccess]);

  const recordModuleCompletion = async (module: Module) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('complete-module', {
        body: {
          moduleId: module.id,
          courseId: course.id,
          pointsEarned: finalScore,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const newCompletedModules = new Set([...completedModules, module.id]);
        setCompletedModules(newCompletedModules);
        
        const streak = data.streak;
        let description = "Keep up the great work!";
        
        if (streak) {
          description = `🔥 ${streak.current_streak} day streak!`;
          if (streak.current_streak === streak.longest_streak && streak.current_streak > 1) {
            description += " New record! 🏆";
          }
        }
        
        toast.success(`🎉 Module completed! +${finalScore} UP points`, {
          description,
        });

        // Check if course is fully completed
        const isCourseComplete = newCompletedModules.size === modules.length;
        
        if (isCourseComplete) {
          // Calculate total points earned in this course
          const totalPoints = Array.from(newCompletedModules).reduce((sum) => sum + 100, 0);
          setTotalCoursePoints(totalPoints);
          setShowCourseCompletionDialog(true);
        }

        // Reset to module list so user can continue to next module
        resetModuleView();
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (error: any) {
      toast.error("Failed to record completion");
      console.error(error);
    }

    setCompleting(false);
    setSelectedModule(null);
  };

  const progress = (completedModules.size / modules.length) * 100;
  const isModuleUnlocked = (moduleNumber: number) => {
    if (moduleNumber === 1) return true;
    return completedModules.has(modules.find(m => m.module_number === moduleNumber - 1)?.id || '');
  };

  const handleAnswerSubmit = () => {
    if (!selectedModule?.content) return;
    
    const quizSection = selectedModule.content.sections?.find(s => s.type === 'quiz');
    const quizQuestions = selectedModule.content.quiz || quizSection?.questions;
    if (!quizQuestions || selectedAnswer === null) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = currentQuestion.correct === selectedAnswer;

    if (!isCorrect) {
      setWrongAnswersCount(prev => prev + 1);
      setShowCorrectAnswer(true);
    } else {
      // Move to next question or complete
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    if (!selectedModule?.content) return;
    
    const quizSection = selectedModule.content.sections?.find(s => s.type === 'quiz');
    const quizQuestions = selectedModule.content.quiz || quizSection?.questions;
    if (!quizQuestions) return;

    setSelectedAnswer(null);
    setShowCorrectAnswer(false);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz complete
      const score = 100 - (wrongAnswersCount * 10);
      setFinalScore(score);
      setViewState('complete');
      toast.success(`Quiz complete! Score: ${score} points`);
    }
  };

  const resetModuleView = () => {
    setSelectedModule(null);
    setViewState('lesson');
    setCurrentQuestionIndex(0);
    setWrongAnswersCount(0);
    setSelectedAnswer(null);
    setShowCorrectAnswer(false);
    setFinalScore(100);
  };

  if (selectedModule) {
    const content = selectedModule.content;
    
    // Extract lesson and quiz from sections if present
    const lessonSection = content?.sections?.find(s => s.type === 'explanation');
    const quizSection = content?.sections?.find(s => s.type === 'quiz');
    const lessonContent = content?.lesson || lessonSection?.content;
    const quizQuestions = content?.quiz || quizSection?.questions;

    // Lesson View
    if (viewState === 'lesson' && lessonContent) {
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto p-6">
            <Button variant="ghost" onClick={resetModuleView} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Card className="p-8 bg-card border-2">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedModule.title}</h2>
                  <p className="text-sm text-muted-foreground">Module {selectedModule.module_number}</p>
                </div>
              </div>

              <div className="prose prose-invert dark:prose-invert prose-neutral light:prose max-w-none mb-8">
                <p className="text-lg leading-relaxed text-foreground">{lessonContent}</p>
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
    if (viewState === 'quiz' && quizQuestions && quizQuestions.length > 0) {
      const currentQuestion = quizQuestions[currentQuestionIndex];
      const totalQuestions = quizQuestions.length;
      const currentScore = 100 - (wrongAnswersCount * 10);

      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto p-6">
            <Button variant="ghost" onClick={() => setViewState('lesson')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lesson
            </Button>

            <Card className="p-8 bg-card border-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Quiz Time! 📝</h2>
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>

              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Current Score:</span>
                  <span className="text-xl font-bold text-primary">{currentScore} points</span>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <p className="font-semibold text-xl text-foreground">
                  {currentQuestion.question}
                </p>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, oIndex) => {
                    const isSelected = selectedAnswer === oIndex;
                    const isCorrect = currentQuestion.correct === oIndex;
                    const showResult = showCorrectAnswer;

                    return (
                      <button
                        key={oIndex}
                        onClick={() => !showCorrectAnswer && setSelectedAnswer(oIndex)}
                        disabled={showCorrectAnswer}
                        className={`
                          w-full p-4 text-left rounded-lg border-2 transition-all
                          ${showResult && isCorrect
                            ? 'bg-green-500/20 border-green-500'
                            : showResult && isSelected && !isCorrect
                              ? 'bg-red-500/20 border-red-500'
                              : isSelected
                                ? 'bg-primary/20 border-primary'
                                : 'bg-card border-border hover:border-primary/50'
                          }
                          ${showCorrectAnswer ? 'cursor-not-allowed' : ''}
                        `}
                      >
                        {option}
                        {showResult && isCorrect && (
                          <span className="ml-2 text-green-500">✓ Correct Answer</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showCorrectAnswer && (
                <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg">
                  <p className="text-red-500 font-semibold mb-2">Incorrect! -10 points</p>
                  <p className="text-sm text-muted-foreground">
                    The correct answer is highlighted above. Review it before continuing.
                  </p>
                </div>
              )}

              <Button 
                size="lg" 
                onClick={showCorrectAnswer ? handleNextQuestion : handleAnswerSubmit}
                disabled={selectedAnswer === null && !showCorrectAnswer}
                className="w-full"
              >
                {showCorrectAnswer 
                  ? currentQuestionIndex < totalQuestions - 1 
                    ? 'Next Question' 
                    : 'Complete Quiz'
                  : 'Submit Answer'
                }
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
              <Trophy className="w-24 h-24 mx-auto mb-6 text-primary animate-pulse" />
              <h2 className="text-3xl font-bold mb-4 text-foreground">Module Complete! 🎉</h2>
              <div className="mb-8">
                <p className="text-muted-foreground mb-4 text-lg">
                  {selectedModule.title}
                </p>
                <div className="text-5xl font-bold text-primary mb-2">
                  {finalScore} Points
                </div>
                <p className="text-sm text-muted-foreground">
                  {wrongAnswersCount > 0 
                    ? `${wrongAnswersCount} wrong answer${wrongAnswersCount > 1 ? 's' : ''} (-${wrongAnswersCount * 10} points)`
                    : 'Perfect score!'}
                </p>
              </div>
              
              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={() => handleCompleteModule(selectedModule)}
                  disabled={completing || isTxPending || isTxConfirming}
                  className="w-full text-lg py-6"
                >
                  {isTxPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Confirm in wallet...
                    </>
                  ) : isTxConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Confirming transaction...
                    </>
                  ) : completing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Recording completion...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      Claim {finalScore} Points
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
    <>
      <CourseCompletionShareDialog
        open={showCourseCompletionDialog}
        onOpenChange={setShowCourseCompletionDialog}
        courseTitle={course.title}
        totalModules={modules.length}
        totalPoints={totalCoursePoints}
      />
      
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
                        ? 'bg-card border-border hover:border-primary/50 hover:scale-[1.02] hover:shadow-glow'
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
                      <h3 className="text-lg font-bold mb-1 text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-primary font-semibold">{module.points_reward} UP</span>
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
    </>
  );
};
