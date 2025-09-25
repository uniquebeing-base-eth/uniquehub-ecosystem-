import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, ShoppingBag, Trophy, Star } from "lucide-react";
import penguinAvatar from "@/assets/penguin-avatar.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [createdCourses, setCreatedCourses] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchEnrollments();
      fetchCreatedCourses();
      fetchMarketplaceItems();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (title, category)
      `)
      .eq('user_id', user.id);
    setEnrollments(data || []);
  };

  const fetchCreatedCourses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id);
    setCreatedCourses(data || []);
  };

  const fetchMarketplaceItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('user_id', user.id);
    setMarketplaceItems(data || []);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-muted-foreground">Please connect your wallet to view profile</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      
      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <img 
            src={penguinAvatar} 
            alt="Profile Avatar" 
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
          />
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {profile?.display_name || 'Farcaster User'}
            </h2>
            {profile?.farcaster_username && (
              <p className="text-primary">@{profile.farcaster_username}</p>
            )}
            <p className="text-muted-foreground">Member since 2024</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-medium">Level 1 Creator</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{enrollments.length}</div>
          <div className="text-sm text-muted-foreground">Courses Enrolled</div>
        </Card>
        <Card className="p-4 text-center">
          <ShoppingBag className="w-8 h-8 text-success mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{marketplaceItems.length}</div>
          <div className="text-sm text-muted-foreground">Items Listed</div>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold text-foreground">{createdCourses.length}</div>
          <div className="text-sm text-muted-foreground">Courses Created</div>
        </Card>
      </div>

      {/* Current Courses */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Enrolled Courses</h3>
        {enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-4 bg-card-hover rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{enrollment.courses?.title || 'Course'}</h4>
                    <p className="text-sm text-muted-foreground">
                      Progress: {enrollment.progress_percentage}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Progress value={enrollment.progress_percentage} className="w-24 mb-1" />
                  <span className="text-xs text-muted-foreground">{enrollment.progress_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No courses enrolled yet</p>
          </div>
        )}
      </Card>

      {/* My Created Courses */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">My Courses</h3>
        {createdCourses.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {createdCourses.map((course) => (
              <div key={course.id} className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground">{course.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${course.price_usdc} USDC • {course.status}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {course.category}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No courses created yet</p>
          </div>
        )}
      </Card>

      {/* My Marketplace Items */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">My Marketplace Items</h3>
        {marketplaceItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {marketplaceItems.map((item) => (
              <div key={item.id} className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${item.price_usdc} USDC • {item.status}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No marketplace items listed yet</p>
          </div>
        )}
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Achievements</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-card-hover rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="text-xs">First Steps</Badge>
              <p className="text-xs text-muted-foreground mt-1">Created your profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <Badge variant="outline" className="text-xs">Course Master</Badge>
              <p className="text-xs text-muted-foreground mt-1">Complete 5 courses</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};