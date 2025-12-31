

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ShoppingBag, Trophy } from "lucide-react";
import penguinAvatar from "@/assets/penguin-avatar.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUnclaimedAchievements } from "@/hooks/useUnclaimedAchievements";
import { AchievementClaimModal } from "@/components/AchievementClaimModal";
import cardBgProfile from '@/assets/card-bg-profile.jpg';
import { getAchievementTitle, getAchievementDescription } from "@/lib/achievementUtils";
import { ShareableProfileCard } from "@/components/ShareableProfileCard";


export const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [createdCourses, setCreatedCourses] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [creatorLevel, setCreatorLevel] = useState<any>(null);
  
  // Hook for unclaimed achievements modal
  const { achievements: unclaimedAchievements, showModal, setShowModal, refetch } = useUnclaimedAchievements();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWalletFromFarcaster();
      fetchEnrollments();
      fetchCreatedCourses();
      fetchMarketplaceItems();
      fetchAchievements();
      fetchCreatorLevel();
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

  const fetchWalletFromFarcaster = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-farcaster-wallet');
      
      if (!error && data?.walletAddress) {
        setWalletAddress(data.walletAddress);
        
        // Update profile with the fetched wallet address
        await supabase
          .from('profiles')
          .update({ wallet_address: data.walletAddress })
          .eq('user_id', user.id);
      } else {
        // Fallback to stored wallet address
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.wallet_address) {
          setWalletAddress(profile.wallet_address);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet from Farcaster:', error);
    }
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

  const fetchAchievements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('creator_achievements')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_claimed', true)
      .order('achievement_level', { ascending: true });
    setAchievements(data || []);
  };

  const fetchCreatorLevel = async () => {
    if (!user) return;
    
    // Get user points
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('creator_points')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Get course count
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id);
    
    const courseCount = courses?.length || 0;
    const creatorPoints = userPoints?.creator_points || 0;
    
    // Determine creator level based on points and courses
    let level = {
      number: 1,
      name: 'Level 1 Creator',
      icon: '🌱',
      color: 'green'
    };
    
    if (courseCount >= 50) {
      level = { number: 10, name: 'Level 10 Creator', icon: '👑', color: 'purple' };
    } else if (courseCount >= 20) {
      level = { number: 7, name: 'Level 7 Creator', icon: '⭐', color: 'yellow' };
    } else if (courseCount >= 10) {
      level = { number: 5, name: 'Level 5 Creator', icon: '🔥', color: 'orange' };
    } else if (courseCount >= 5) {
      level = { number: 3, name: 'Level 3 Creator', icon: '💎', color: 'blue' };
    } else if (courseCount >= 1) {
      level = { number: 2, name: 'Level 2 Creator', icon: '🎯', color: 'green' };
    }
    
    setCreatorLevel(level);
  };

  const handleAchievementsClaimed = () => {
    // Refetch achievements after claiming
    fetchAchievements();
    refetch();
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-muted-foreground">Please connect your wallet to view profile</h1>
      </div>
    );
  }

  return (
    <>
      <AchievementClaimModal
        open={showModal}
        onOpenChange={setShowModal}
        achievements={unclaimedAchievements}
        onClaimed={handleAchievementsClaimed}
      />
      
      <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      {/* Shareable Profile Card */}
      <ShareableProfileCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgProfile})` }} />
          <div className="relative z-10">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{enrollments.length}</div>
          <div className="text-[10px] text-muted-foreground">Enrolled</div>
          </div>
        </Card>
        <Card className="p-3 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgProfile})` }} />
          <div className="relative z-10">
          <ShoppingBag className="w-6 h-6 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{marketplaceItems.length}</div>
          <div className="text-[10px] text-muted-foreground">Listed</div>
          </div>
        </Card>
        <Card className="p-3 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgProfile})` }} />
          <div className="relative z-10">
          <Trophy className="w-6 h-6 text-warning mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{createdCourses.length}</div>
          <div className="text-[10px] text-muted-foreground">Created</div>
          </div>
        </Card>
      </div>

      {/* Enrolled Courses - Compact */}
      {enrollments.length > 0 && (
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgProfile})` }} />
          <div className="relative z-10">
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
          </div>
        </Card>
      )}

      {/* Achievements - Compact */}
      <Card className="p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${cardBgProfile})` }} />
        <div className="relative z-10">
        <h3 className="text-base font-bold text-foreground mb-3">Achievements</h3>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {achievements.slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-2 p-2 bg-card-hover rounded-lg">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  {achievement.badge_icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-foreground truncate">
                    {getAchievementTitle(achievement.achievement_type, achievement.achievement_level)}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {getAchievementDescription(achievement.achievement_type, achievement.milestone_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">Create courses to earn achievements</p>
          </div>
        )}
        </div>
      </Card>
    </div>
    </>
  );
};
