import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, ShoppingBag, Trophy, Star } from "lucide-react";
import penguinAvatar from "@/assets/penguin-avatar.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShareToFarcaster } from "@/components/ShareToFarcaster";

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
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      
      {/* User Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={profile?.avatar_url || penguinAvatar} 
            alt="Profile Avatar" 
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
          />
          <div className="flex-1 min-w-0">
            {profile?.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>
            )}
            {profile?.wallet_address && (
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-3 h-3 text-primary fill-current" />
              <span className="text-xs font-medium text-foreground">Level 1 Creator</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{enrollments.length}</div>
          <div className="text-[10px] text-muted-foreground">Enrolled</div>
        </Card>
        <Card className="p-3 text-center">
          <ShoppingBag className="w-6 h-6 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{marketplaceItems.length}</div>
          <div className="text-[10px] text-muted-foreground">Listed</div>
        </Card>
        <Card className="p-3 text-center">
          <Trophy className="w-6 h-6 text-warning mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{createdCourses.length}</div>
          <div className="text-[10px] text-muted-foreground">Created</div>
        </Card>
      </div>

      {/* Enrolled Courses - Compact */}
      {enrollments.length > 0 && (
        <Card className="p-4">
          <h3 className="text-base font-bold text-foreground mb-3">Enrolled Courses</h3>
          <div className="space-y-2">
            {enrollments.slice(0, 3).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center gap-2 p-2 bg-card-hover rounded-lg">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-foreground truncate">{enrollment.courses?.title || 'Course'}</h4>
                  <Progress value={enrollment.progress_percentage} className="h-1 mt-1" />
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{enrollment.progress_percentage}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My Courses - Compact */}
      {createdCourses.length > 0 && (
        <Card className="p-4">
          <h3 className="text-base font-bold text-foreground mb-3">My Courses</h3>
          <div className="space-y-2">
            {createdCourses.slice(0, 4).map((course) => (
              <div key={course.id} className="p-3 border border-border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-foreground line-clamp-2">{course.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ${course.price_usdc}
                    </p>
                  </div>
                </div>
                <ShareToFarcaster
                  text={`Check out my course: ${course.title} - Learn now! 🎓`}
                  embeds={course.thumbnail_url ? [`https://uniqueehub.vercel.app/opengraph-image.png`, `https://uniqueehub.vercel.app/#courses`] : [`https://uniqueehub.vercel.app/#courses`]}
                  buttonText="Share Course"
                  size="sm"
                  variant="secondary"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Achievements - Compact */}
      <Card className="p-4">
        <h3 className="text-base font-bold text-foreground mb-3">Achievements</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-card-hover rounded-lg">
            <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">First Steps</Badge>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Profile created</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg opacity-50">
            <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">Course Master</Badge>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Complete 5</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};