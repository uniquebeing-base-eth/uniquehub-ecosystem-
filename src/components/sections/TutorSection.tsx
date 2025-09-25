import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Star, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CourseUpload } from "@/components/CourseUpload";

export const TutorSection = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchStats();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCourses(data || []);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    // Fetch course count
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, enrollment_count')
      .eq('user_id', user.id);
    
    const totalCourses = coursesData?.length || 0;
    const totalStudents = coursesData?.reduce((sum, course) => sum + (course.enrollment_count || 0), 0) || 0;
    
    setStats({
      totalCourses,
      totalStudents,
      totalEarnings: 0, // This would be calculated based on actual purchases
    });
  };

  const handleCourseUploadSuccess = () => {
    setShowCreateForm(false);
    fetchCourses();
    fetchStats();
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-muted-foreground">Please connect your wallet to access tutor dashboard</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Tutor Dashboard</h1>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalCourses}</div>
          <div className="text-sm text-muted-foreground">Courses Created</div>
        </Card>
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 text-success mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="w-8 h-8 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{stats.totalEarnings}</div>
          <div className="text-sm text-muted-foreground">USDC Earned</div>
        </Card>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <CourseUpload 
          onSuccess={handleCourseUploadSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* My Courses */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">My Courses</h3>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="border border-border rounded-lg p-4">
                {course.thumbnail_url && (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-medium text-foreground mb-2">{course.title}</h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{course.price_usdc} USDC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{course.enrollment_count || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    course.status === 'published' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {course.status}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {course.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No courses yet</h4>
            <p className="text-muted-foreground mb-4">Create your first course to start earning from your expertise</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </Card>

      {/* Tips for Success */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Tips for Success</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Create Engaging Content</h4>
              <p className="text-sm text-muted-foreground">Use clear explanations, practical examples, and interactive elements</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Price Competitively</h4>
              <p className="text-sm text-muted-foreground">Research similar courses and price accordingly to attract students</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Engage with Students</h4>
              <p className="text-sm text-muted-foreground">Respond to questions and provide support to build a good reputation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};