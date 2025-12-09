import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, BookOpen, Trophy, Award, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';
import html2canvas from 'html2canvas';
import penguinAvatar from '@/assets/penguin-avatar.png';
import cardBgProfile from '@/assets/card-bg-profile.jpg';

export const ShareableProfileCard = () => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    profile: null as any,
    upPoints: 0,
    creatorPoints: 0,
    dailyStreak: 0,
    weeklyStreak: 0,
    monthlyStreak: 0,
    coursesEnrolled: 0,
    coursesCreated: 0,
    achievements: [] as any[],
    creatorLevel: { icon: '🌱', name: 'Beginner Creator' }
  });

  useEffect(() => {
    if (user) fetchAllStats();
  }, [user]);

  const fetchAllStats = async () => {
    if (!user) return;

    const [profileRes, pointsRes, enrollmentsRes, coursesRes, achievementsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_points').select('*').eq('user_id', user.id).single(),
      supabase.from('enrollments').select('id').eq('user_id', user.id),
      supabase.from('courses').select('id').eq('user_id', user.id).eq('status', 'published'),
      supabase.from('creator_achievements').select('*').eq('user_id', user.id).eq('is_claimed', true)
    ]);

    const courseCount = coursesRes.data?.length || 0;
    let creatorLevel = { icon: '🌱', name: 'Beginner Creator' };
    
    if (courseCount >= 50) creatorLevel = { icon: '👑', name: 'Master Creator' };
    else if (courseCount >= 20) creatorLevel = { icon: '⭐', name: 'Expert Creator' };
    else if (courseCount >= 10) creatorLevel = { icon: '🔥', name: 'Advanced Creator' };
    else if (courseCount >= 5) creatorLevel = { icon: '💎', name: 'Intermediate Creator' };
    else if (courseCount >= 1) creatorLevel = { icon: '🎯', name: 'Junior Creator' };

    setStats({
      profile: profileRes.data,
      upPoints: pointsRes.data?.total_points || 0,
      creatorPoints: pointsRes.data?.creator_points || 0,
      dailyStreak: pointsRes.data?.daily_streak || 0,
      weeklyStreak: pointsRes.data?.weekly_streak || 0,
      monthlyStreak: pointsRes.data?.monthly_streak || 0,
      coursesEnrolled: enrollmentsRes.data?.length || 0,
      coursesCreated: courseCount,
      achievements: achievementsRes.data || [],
      creatorLevel
    });
  };

  const captureCard = async () => {
    if (!cardRef.current) return;
    
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0f'
      });
      
      const imageUrl = canvas.toDataURL('image/png');
      setCapturedImage(imageUrl);
    } catch (error) {
      console.error('Error capturing card:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const uploadAndShare = async () => {
    if (!capturedImage || !user) return null;
    
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const fileName = `profile-card-${user.id}-${Date.now()}.png`;
      const filePath = `profile-cards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading card:', error);
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Shareable Card */}
      <div 
        ref={cardRef}
        className="relative overflow-hidden rounded-xl p-4"
        style={{ 
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
          border: '2px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${cardBgProfile})`, backgroundSize: 'cover' }}
        />
        
        {/* Content */}
        <div className="relative z-10 space-y-3">
          {/* Header: Avatar + Name + Level */}
          <div className="flex items-center gap-3">
            <img 
              src={stats.profile?.avatar_url || penguinAvatar} 
              alt="Avatar" 
              className="w-14 h-14 rounded-full border-2 border-primary object-cover"
              crossOrigin="anonymous"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {stats.profile?.display_name || stats.profile?.farcaster_username || 'Learner'}
              </h3>
              {stats.profile?.farcaster_username && (
                <p className="text-xs text-blue-400">@{stats.profile.farcaster_username}</p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm">{stats.creatorLevel.icon}</span>
                <span className="text-xs text-gray-300">{stats.creatorLevel.name}</span>
              </div>
            </div>
          </div>

          {/* Points Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/20 rounded-lg p-2 text-center border border-primary/30">
              <div className="text-xl font-bold text-primary">{stats.upPoints.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">UP Points</div>
            </div>
            <div className="bg-amber-500/20 rounded-lg p-2 text-center border border-amber-500/30">
              <div className="text-xl font-bold text-amber-400">{stats.creatorPoints.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Creator Points</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.dailyStreak}</div>
              <div className="text-[9px] text-gray-400">Daily</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.weeklyStreak}</div>
              <div className="text-[9px] text-gray-400">Weekly</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <BookOpen className="w-4 h-4 text-primary mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.coursesEnrolled}</div>
              <div className="text-[9px] text-gray-400">Enrolled</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Trophy className="w-4 h-4 text-purple-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.achievements.length}</div>
              <div className="text-[9px] text-gray-400">Badges</div>
            </div>
          </div>

          {/* Achievements Row */}
          {stats.achievements.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.achievements.slice(0, 6).map((a, i) => (
                <span key={i} className="text-lg" title={a.achievement_type}>
                  {a.badge_icon}
                </span>
              ))}
              {stats.achievements.length > 6 && (
                <span className="text-xs text-gray-400">+{stats.achievements.length - 6}</span>
              )}
            </div>
          )}

          {/* Branding */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-[10px] text-gray-500">uniquehub.app</span>
            <span className="text-xs font-bold text-primary">UniqueHub</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!capturedImage ? (
          <Button 
            onClick={captureCard} 
            disabled={isCapturing}
            className="flex-1 bg-gradient-primary"
            size="sm"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1.5" />
                Capture Card
              </>
            )}
          </Button>
        ) : (
          <ShareableCardShare 
            capturedImage={capturedImage} 
            uploadAndShare={uploadAndShare}
            username={stats.profile?.farcaster_username}
            upPoints={stats.upPoints}
            dailyStreak={stats.dailyStreak}
          />
        )}
      </div>
    </div>
  );
};

// Separate share component to handle async upload
const ShareableCardShare = ({ 
  capturedImage, 
  uploadAndShare,
  username,
  upPoints,
  dailyStreak
}: { 
  capturedImage: string;
  uploadAndShare: () => Promise<string | null>;
  username?: string;
  upPoints: number;
  dailyStreak: number;
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleShare = async () => {
    if (imageUrl) return;
    setUploading(true);
    const url = await uploadAndShare();
    setImageUrl(url);
    setUploading(false);
  };

  if (uploading) {
    return (
      <Button disabled className="flex-1" size="sm">
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        Uploading...
      </Button>
    );
  }

  if (!imageUrl) {
    return (
      <Button onClick={handleShare} className="flex-1 bg-gradient-primary" size="sm">
        <Share2 className="w-4 h-4 mr-1.5" />
        Share to Farcaster
      </Button>
    );
  }

  return (
    <ShareToFarcaster
      text={`Check out my stats on @uniquehub!\n\n${upPoints.toLocaleString()} UP Points | ${dailyStreak} Day Streak\n\nLearn, earn, and grow with the ultimate Web3 learning platform.`}
      embeds={[imageUrl, 'https://uniqueehub.vercel.app']}
      buttonText="Share to Farcaster"
      variant="default"
      size="sm"
      className="flex-1 bg-gradient-primary"
    />
  );
};
