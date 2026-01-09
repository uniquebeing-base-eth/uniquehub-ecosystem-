
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Rocket, Star, Users, DollarSign, ChevronRight, TrendingUp, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseUpload } from '@/components/CourseUpload';

interface CreatorStats {
  earnings: number;
  learners: number;
  totalSales: number;
  weeklyChange: number;
}

interface CreatorCourse {
  id: string;
  title: string;
  thumbnail_url?: string;
  learners: number;
  earnings: number;
  rating: number;
  ratingCount: number;
}

export const CreatorSection = () => {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [stats, setStats] = useState<CreatorStats>({
    earnings: 0,
    learners: 0,
    totalSales: 0,
    weeklyChange: 0,
  });
  const [courses, setCourses] = useState<CreatorCourse[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkUnlockStatus();
      fetchCreatorData();
    }
  }, [user]);

  const checkUnlockStatus = async () => {
    if (!user) return;

    // Count completed missions/courses
    const { data: completions } = await supabase
      .from('module_completions')
      .select('course_id')
      .eq('user_id', user.id);

    // Count unique courses with completions
    const uniqueCourses = new Set(completions?.map(c => c.course_id) || []);
    const completed = uniqueCourses.size;
    
    setMissionsCompleted(completed);
    setIsUnlocked(completed >= 2);
  };

  const fetchCreatorData = async () => {
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

    // Fetch creator's courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (coursesData) {
      const formattedCourses: CreatorCourse[] = coursesData.map(course => ({
        id: course.id,
        title: course.title,
        thumbnail_url: course.thumbnail_url || undefined,
        learners: course.enrollment_count || 0,
        earnings: 0, // Will be calculated from payments
        rating: course.rating || 0,
        ratingCount: 0,
      }));

      setCourses(formattedCourses);

      // Calculate total learners
      const totalLearners = formattedCourses.reduce((sum, c) => sum + c.learners, 0);

      // Fetch earnings from payments
      const { data: payments } = await supabase
        .from('course_payments')
        .select('amount, currency')
        .eq('seller_user_id', user.id)
        .eq('status', 'completed');

      let totalEarnings = 0;
      if (payments) {
        payments.forEach(p => {
          if (p.currency === 'USDC') {
            totalEarnings += p.amount / 1e6;
          } else if (p.currency === 'ETH') {
            totalEarnings += (p.amount / 1e18) * 2500; // Approximate ETH to USD
          }
        });
      }

      setStats({
        earnings: totalEarnings,
        learners: totalLearners,
        totalSales: payments?.length || 0,
        weeklyChange: 74, // Placeholder
      });
    }
  };

  // Locked State
  if (!isUnlocked) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="text-center pt-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Creator Tools Locked</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Complete {2 - missionsCompleted} more mission{2 - missionsCompleted !== 1 ? 's' : ''} to unlock creator tools and start earning as a creator.
          </p>
        </div>

        <Card className="p-4 mx-4 rounded-2xl bg-muted/30 border-dashed">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Progress: {missionsCompleted} / 2 missions completed
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(missionsCompleted / 2) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <div className="px-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">What you'll unlock:</h3>
          <div className="space-y-2">
            {[
              'Upload courses and challenges',
              'Earn from course sales',
              'View analytics and learner stats',
              'Create onchain certificates',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Creator View
  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome Creator 👋</h1>
        <p className="text-sm text-muted-foreground">Manage your challenges and courses.</p>
      </div>

      {/* Stats Card */}
      <Card className="bg-primary text-primary-foreground p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Your Stats</h3>
          <Badge className="bg-green-500 text-white text-xs">
            +${stats.weeklyChange} ↑
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold">${stats.earnings.toFixed(0)}</p>
            <p className="text-xs opacity-80">Earnings</p>
          </div>
          <div className="border-l border-white/20 pl-4">
            <p className="text-2xl font-bold">{stats.learners}</p>
            <p className="text-xs opacity-80">Learners</p>
          </div>
          <div className="border-l border-white/20 pl-4">
            <p className="text-2xl font-bold">{stats.totalSales}</p>
            <p className="text-xs opacity-80">Total Sales</p>
          </div>
        </div>

        {/* Simple Weekly Chart Placeholder */}
        <div className="space-y-2">
          <p className="text-xs opacity-70">Weekly Earnings</p>
          <div className="flex items-end gap-1 h-12">
            {[30, 40, 35, 45, 60, 80, 90, 100].map((height, i) => (
              <div 
                key={i}
                className="flex-1 bg-white/30 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] opacity-60">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
            <span>Mon</span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="h-auto py-3 justify-start gap-2"
          onClick={() => setShowUploadDialog(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Upload New Course</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-3 justify-start gap-2"
        >
          <Rocket className="w-4 h-4" />
          <span className="text-sm">Create Challenge</span>
        </Button>
      </div>

      {/* Your Courses */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base text-foreground">Your Courses & Challenges</h3>
        
        {courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course) => (
              <Card 
                key={course.id}
                className="p-3 rounded-xl flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer"
              >
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate">{course.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Course • {course.learners} Learners • <span className="text-green-500">${course.earnings.toFixed(0)} Earned</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(course.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                      {course.rating.toFixed(1)} ({course.ratingCount})
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center rounded-xl">
            <p className="text-muted-foreground text-sm mb-3">You haven't created any courses yet.</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Upload Course</DialogTitle>
          </DialogHeader>
          <CourseUpload 
            onSuccess={() => {
              setShowUploadDialog(false);
              fetchCreatorData();
            }} 
            onCancel={() => setShowUploadDialog(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
