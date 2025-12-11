import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Lock, CheckCircle, ChevronDown, ChevronRight, 
  Clock, ArrowLeft, BookOpen 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  lesson_order: number;
  is_preview: boolean;
  duration_seconds: number | null;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  lessons: LessonData[];
}

interface LessonProgress {
  lesson_id: string;
  progress_percentage: number;
  completed_at: string | null;
}

interface CourseModulePlayerProps {
  courseId: string;
  isEnrolled: boolean;
  onBack?: () => void;
}

export const CourseModulePlayer = ({ courseId, isEnrolled, onBack }: CourseModulePlayerProps) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    fetchModulesAndProgress();
  }, [courseId, user]);

  const fetchModulesAndProgress = async () => {
    try {
      // Fetch modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      if (modulesError) throw modulesError;

      if (modulesData) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (mod) => {
            const { data: lessonsData } = await supabase
              .from('course_lessons')
              .select('*')
              .eq('module_id', mod.id)
              .order('lesson_order');

            return {
              ...mod,
              lessons: lessonsData || [],
            };
          })
        );

        setModules(modulesWithLessons);

        // Auto-expand first module
        if (modulesWithLessons.length > 0) {
          setExpandedModules(new Set([modulesWithLessons[0].id]));
        }
      }

      // Fetch user's progress if enrolled
      if (user && isEnrolled) {
        const { data: progressData } = await supabase
          .from('lesson_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        if (progressData) {
          const progressMap: Record<string, LessonProgress> = {};
          progressData.forEach((p) => {
            progressMap[p.lesson_id] = {
              lesson_id: p.lesson_id,
              progress_percentage: p.progress_percentage || 0,
              completed_at: p.completed_at,
            };
          });
          setLessonProgress(progressMap);
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const canAccessLesson = (lesson: LessonData) => {
    return isEnrolled || lesson.is_preview;
  };

  const playLesson = (lesson: LessonData) => {
    if (!canAccessLesson(lesson)) {
      toast.error('Please enroll to access this lesson');
      return;
    }
    setCurrentLesson(lesson);
    setVideoProgress(lessonProgress[lesson.id]?.progress_percentage || 0);
  };

  const handleVideoProgress = async () => {
    if (!videoRef.current || !currentLesson || !user || !isEnrolled) return;

    const video = videoRef.current;
    const progress = Math.floor((video.currentTime / video.duration) * 100);
    setVideoProgress(progress);

    // Save progress at 25%, 50%, 75%, and completion milestones
    const milestones = [25, 50, 75, 100];
    const currentMilestone = milestones.find((m) => progress >= m && progress < m + 5);
    const savedProgress = lessonProgress[currentLesson.id]?.progress_percentage || 0;

    if (currentMilestone && currentMilestone > savedProgress) {
      try {
        const isComplete = progress >= 95;
        
        await supabase.from('lesson_completions').upsert(
          {
            user_id: user.id,
            lesson_id: currentLesson.id,
            course_id: courseId,
            progress_percentage: progress,
            completed_at: isComplete ? new Date().toISOString() : null,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );

        setLessonProgress((prev) => ({
          ...prev,
          [currentLesson.id]: {
            lesson_id: currentLesson.id,
            progress_percentage: progress,
            completed_at: isComplete ? new Date().toISOString() : prev[currentLesson.id]?.completed_at || null,
          },
        }));

        if (isComplete) {
          toast.success('Lesson completed! 🎉');
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const getModuleProgress = (module: ModuleData) => {
    if (!module.lessons.length) return 0;
    const completed = module.lessons.filter((l) => lessonProgress[l.id]?.completed_at).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  const getTotalProgress = () => {
    const allLessons = modules.flatMap((m) => m.lessons);
    if (!allLessons.length) return 0;
    const completed = allLessons.filter((l) => lessonProgress[l.id]?.completed_at).length;
    return Math.round((completed / allLessons.length) * 100);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">This course doesn't have modules yet.</p>
        <p className="text-sm text-muted-foreground">Check back later for updated content.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Player */}
      {currentLesson && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentLesson(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold text-foreground flex-1 truncate">{currentLesson.title}</h3>
          </div>
          
          {currentLesson.video_url ? (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={currentLesson.video_url}
                className="w-full h-full"
                controls
                controlsList="nodownload"
                onTimeUpdate={handleVideoProgress}
                onEnded={handleVideoProgress}
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Video not available</p>
            </div>
          )}

          {currentLesson.description && (
            <p className="mt-3 text-sm text-muted-foreground">{currentLesson.description}</p>
          )}

          {isEnrolled && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{videoProgress}%</span>
              </div>
              <Progress value={videoProgress} className="h-1" />
            </div>
          )}
        </Card>
      )}

      {/* Overall Progress */}
      {isEnrolled && !currentLesson && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Course Progress</span>
            <span className="text-sm text-muted-foreground">{getTotalProgress()}%</span>
          </div>
          <Progress value={getTotalProgress()} className="h-2" />
        </Card>
      )}

      {/* Modules List */}
      {!currentLesson && (
        <div className="space-y-3">
          {modules.map((module, moduleIndex) => {
            const moduleProgress = getModuleProgress(module);
            const isExpanded = expandedModules.has(module.id);

            return (
              <Card key={module.id} className="overflow-hidden">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Module {moduleIndex + 1}</span>
                      {moduleProgress === 100 && (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground">{module.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {isEnrolled && (
                    <div className="w-12 h-12">
                      <div className="relative">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${moduleProgress * 1.26} 126`}
                            className="text-primary"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {moduleProgress}%
                        </span>
                      </div>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const progress = lessonProgress[lesson.id];
                      const isCompleted = !!progress?.completed_at;
                      const canAccess = canAccessLesson(lesson);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => playLesson(lesson)}
                          disabled={!canAccess}
                          className={`w-full p-3 flex items-center gap-3 border-b last:border-b-0 transition-colors ${
                            canAccess ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : canAccess ? (
                              <Play className="w-4 h-4 text-primary" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                              {lesson.is_preview && !isEnrolled && (
                                <Badge variant="outline" className="text-xs h-5">Preview</Badge>
                              )}
                            </div>
                            {lesson.duration_seconds && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDuration(lesson.duration_seconds)}
                              </div>
                            )}
                          </div>

                          {isEnrolled && progress && !isCompleted && (
                            <div className="w-10">
                              <Progress value={progress.progress_percentage} className="h-1" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
