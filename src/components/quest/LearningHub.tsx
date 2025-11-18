import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Lock, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CourseModuleViewer } from "./CourseModuleViewer";

interface LearningHubProps {
  onBack: () => void;
}

interface Course {
  id: string;
  title: string;
  category: string;
  total_modules: number;
  difficulty_level: string;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_modules_completed: number;
}

export const LearningHub = ({ onBack }: LearningHubProps) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchStreak();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('learning_courses')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      toast.error("Failed to load courses");
      console.error(error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchStreak = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_learning_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
    } else if (data) {
      setStreak(data);
    }
  };

  if (selectedCourse) {
    return (
      <CourseModuleViewer
        course={selectedCourse}
        onBack={() => {
          setSelectedCourse(null);
          fetchStreak();
        }}
      />
    );
  }

  const isStreakActive = streak?.last_activity_date === new Date().toISOString().split('T')[0];

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
            Back to Quest Hub
          </Button>

          {/* Streak Display */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Flame className={`w-10 h-10 ${isStreakActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <div>
                <div className="text-3xl font-bold text-primary">
                  {streak?.current_streak || 0}
                </div>
                <div className="text-sm text-muted-foreground">day streak</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Longest</div>
              <div className="text-2xl font-bold">{streak?.longest_streak || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Choose a Course</h2>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No courses available yet</p>
            <p className="text-sm text-muted-foreground">Check back soon for new learning content!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="group relative p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/50 transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                        {course.category}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {course.difficulty_level}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {course.total_modules} modules
                      </span>
                    </div>
                  </div>
                  <Star className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
