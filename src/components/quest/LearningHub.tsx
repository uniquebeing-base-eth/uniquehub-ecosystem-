import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Lock, Star, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CourseModuleViewer } from "./CourseModuleViewer";
import cryptoBg from "@/assets/course-crypto-basics-bg.jpg";
import web3Bg from "@/assets/course-web3-basics-bg.jpg";
import placeholderBg from "@/assets/course-placeholder-bg.jpg";

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

interface CourseCompletion {
  course_id: string;
  completed_count: number;
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
  const [courseCompletions, setCourseCompletions] = useState<Map<string, number>>(new Map());
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchStreak();
      fetchCourseCompletions();
    }
  }, [user]);

  const getCourseBackground = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('crypto') || lowerTitle.includes('wallet')) return cryptoBg;
    if (lowerTitle.includes('web3')) return web3Bg;
    if (lowerTitle.includes('blockchain') || lowerTitle.includes('nft')) return placeholderBg;
    return placeholderBg;
  };

  const fetchCourseCompletions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('module_completions')
      .select('course_id')
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
    } else {
      const completionMap = new Map<string, number>();
      data?.forEach(completion => {
        const count = completionMap.get(completion.course_id) || 0;
        completionMap.set(completion.course_id, count + 1);
      });
      setCourseCompletions(completionMap);
    }
  };

  const isCourseCompleted = (courseId: string, totalModules: number) => {
    const completedCount = courseCompletions.get(courseId) || 0;
    return completedCount >= totalModules;
  };

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

  const filteredCourses = courses.filter(course => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesTitle = course.title.toLowerCase().includes(query);
    const matchesCategory = course.category.toLowerCase().includes(query);
    
    // Check for common keywords
    const keywords = query.split(' ').filter(k => k.length > 0);
    const matchesKeywords = keywords.some(keyword => 
      course.title.toLowerCase().includes(keyword) ||
      course.category.toLowerCase().includes(keyword)
    );
    
    return matchesTitle || matchesCategory || matchesKeywords;
  });

  if (selectedCourse) {
    return (
      <CourseModuleViewer
        course={selectedCourse}
        onBack={() => {
          setSelectedCourse(null);
          fetchStreak();
          fetchCourseCompletions();
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
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-xl border border-primary/10">
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
              <div className="text-2xl font-bold text-foreground">{streak?.longest_streak || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Choose a Course</h2>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses by keyword (e.g., NFTs, web3, blockchain, crypto)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery.trim() ? `No courses found for "${searchQuery}"` : "No courses available yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim() ? "Try a different search term" : "Check back soon for new learning content!"}
            </p>
            {searchQuery.trim() && (
              <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCourses.map((course) => {
              const isCompleted = isCourseCompleted(course.id, course.total_modules);
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="group relative overflow-hidden p-6 rounded-xl border border-border hover:border-primary/50 transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-glow bg-card"
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ backgroundImage: `url(${getCourseBackground(course.title)})` }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-card/95 via-card/90 to-card/85 group-hover:from-card/90 group-hover:via-card/85 group-hover:to-card/80 transition-all duration-300" />
                  
                  {/* Content */}
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium backdrop-blur-sm">
                          {course.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground backdrop-blur-sm">
                          {course.difficulty_level}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors text-foreground">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${isCompleted ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          {course.total_modules} modules
                        </span>
                      </div>
                    </div>
                    <Star 
                      className={`w-8 h-8 group-hover:scale-110 transition-transform ${
                        isCompleted 
                          ? 'fill-yellow-500 text-yellow-500' 
                          : 'text-primary'
                      }`} 
                    />
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
