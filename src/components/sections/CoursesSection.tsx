
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Search, Play, Star, Check, Lock, X, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSandboxWallet } from "@/hooks/useSandboxWallet";
import { toast } from "sonner";
import cubeLogo from "@/assets/uniquehub-cube.png";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price_usdc: number;
  user_id: string;
  enrollment_count: number;
  rating: number;
  creator_name?: string;
  creator_avatar?: string;
  coin_symbol?: string;
  isEnrolled?: boolean;
}

interface CourseLesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  lesson_order: number;
}

export const CoursesSection = () => {
  const { user } = useAuth();
  const { wallet, purchaseCourse, refetch: refetchWallet } = useSandboxWallet();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchMyCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (course) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', course.user_id)
            .single();

          const { data: coin } = await supabase
            .from('course_coins')
            .select('symbol')
            .eq('course_id', course.id)
            .single();

          // Check if user is enrolled
          let isEnrolled = false;
          if (user) {
            const { data: enrollment } = await supabase
              .from('enrollments')
              .select('id')
              .eq('user_id', user.id)
              .eq('course_id', course.id)
              .single();
            isEnrolled = !!enrollment;
          }

          return {
            ...course,
            creator_name: profile?.display_name || 'Creator',
            creator_avatar: profile?.avatar_url || '',
            coin_symbol: coin?.symbol || `$${course.title.slice(0, 4).toUpperCase()}`,
            isEnrolled,
          };
        })
      );
      setCourses(enriched);
    }
    setIsLoading(false);
  };

  const fetchMyCourses = async () => {
    if (!user) return;
    
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        progress_percentage,
        courses (*)
      `)
      .eq('user_id', user.id);

    if (enrollments) {
      const enriched = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          const course = enrollment.courses;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', course.user_id)
            .single();

          return {
            ...course,
            creator_name: profile?.display_name || 'Creator',
            creator_avatar: profile?.avatar_url || '',
            isEnrolled: true,
            progress: enrollment.progress_percentage || 0,
          };
        })
      );
      setMyCourses(enriched);
    }
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('lesson_order', { ascending: true });
    setLessons(data || []);
  };

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course);
    await fetchLessons(course.id);
    
    if (course.isEnrolled) {
      setShowCourseDetail(true);
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handlePurchase = async () => {
    if (!user || !selectedCourse || !wallet) return;
    
    if (wallet.usdc_balance < selectedCourse.price_usdc) {
      toast.error('Insufficient USDC balance');
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchaseCourse(
        selectedCourse.id,
        selectedCourse.price_usdc,
        selectedCourse.user_id
      );

      if (success) {
        // Create enrollment
        await supabase.from('enrollments').insert({
          user_id: user.id,
          course_id: selectedCourse.id,
        });

        // Update enrollment count
        await supabase.rpc('increment_enrollment_count', { course_id: selectedCourse.id });

        toast.success('Course purchased! You now own the course coin.', {
          description: `${selectedCourse.coin_symbol} has been added to your wallet`,
        });

        setShowPurchaseModal(false);
        setShowCourseDetail(true);
        await fetchCourses();
        await fetchMyCourses();
        await refetchWallet();
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const filteredCourses = (activeTab === 'all' ? courses : myCourses).filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Courses</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Courses
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === 'my'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          My Courses ({myCourses.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-full bg-muted border-0"
        />
      </div>

      {/* Wallet Balance Indicator */}
      {wallet && (
        <Card className="p-3 rounded-xl bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="text-sm font-semibold text-primary">
              ${wallet.usdc_balance.toLocaleString()} USDC
            </span>
          </div>
        </Card>
      )}

      {/* Courses List */}
      <div className="space-y-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => handleCourseClick(course)}
            >
              <div className="flex gap-3 p-3">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  {course.isEnrolled && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={course.creator_avatar} />
                      <AvatarFallback className="text-[8px] bg-primary/20">
                        {course.creator_name?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">
                      {course.creator_name}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      {course.coin_symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">
                        {course.rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {course.enrollment_count || 0} students
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end justify-between">
                  <Badge
                    variant={course.isEnrolled ? 'default' : 'secondary'}
                    className={`text-[10px] ${course.isEnrolled ? 'bg-success' : ''}`}
                  >
                    {course.isEnrolled ? 'Enrolled' : course.price_usdc === 0 ? 'Free' : `$${course.price_usdc}`}
                  </Badge>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              {activeTab === 'my' ? 'No enrolled courses yet.' : 'No courses found.'}
            </p>
            {activeTab === 'my' && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab('all')}
              >
                Browse Courses
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Purchase Course</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {selectedCourse.thumbnail_url ? (
                    <img
                      src={selectedCourse.thumbnail_url}
                      alt={selectedCourse.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedCourse.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCourse.creator_name}</p>
                </div>
              </div>

              <Card className="p-4 bg-primary/5 border-primary/20 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Course Coin Included</p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive {selectedCourse.coin_symbol} tokens
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  When you buy this course, you automatically receive course tokens that represent your ownership.
                </div>
              </Card>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course Price</span>
                  <span className="font-medium">${selectedCourse.price_usdc} USDC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className={`font-medium ${wallet && wallet.usdc_balance >= selectedCourse.price_usdc ? 'text-success' : 'text-destructive'}`}>
                    ${wallet?.usdc_balance.toLocaleString() || 0} USDC
                  </span>
                </div>
              </div>

              <Button
                className="w-full rounded-full"
                onClick={handlePurchase}
                disabled={isPurchasing || !wallet || wallet.usdc_balance < selectedCourse.price_usdc}
              >
                {isPurchasing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Buy for ${selectedCourse.price_usdc} USDC</>
                )}
              </Button>

              {wallet && wallet.usdc_balance < selectedCourse.price_usdc && (
                <p className="text-xs text-destructive text-center">
                  Insufficient balance. You need ${(selectedCourse.price_usdc - wallet.usdc_balance).toFixed(2)} more USDC.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Course Detail Modal */}
      <Dialog open={showCourseDetail} onOpenChange={setShowCourseDetail}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Course Content</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                {selectedCourse.thumbnail_url ? (
                  <img
                    src={selectedCourse.thumbnail_url}
                    alt={selectedCourse.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Play className="w-12 h-12 text-primary" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedCourse.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCourse.description || 'No description available.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedCourse.creator_avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {selectedCourse.creator_name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedCourse.creator_name}</p>
                  <div className="flex items-center gap-1">
                    <img src={cubeLogo} alt="" className="w-3 h-3" />
                    <span className="text-xs text-primary font-medium">{selectedCourse.coin_symbol}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Lessons</h4>
                {lessons.length > 0 ? (
                  lessons.map((lesson, index) => (
                    <Card
                      key={lesson.id}
                      className="p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-4 text-center rounded-xl">
                    <p className="text-sm text-muted-foreground">No lessons available yet.</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
