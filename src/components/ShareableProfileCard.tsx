
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, BookOpen, Trophy, Award, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShareToFarcaster } from '@/components/ShareToFarcaster';
import html2canvas from 'html2canvas';
import penguinAvatar from '@/assets/penguin-avatar.png';

export const ShareableProfileCard = () => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
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
    creatorLevel: { name: 'Beginner Creator' }
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
    let creatorLevel = { name: 'Beginner Creator' };
    
    if (courseCount >= 50) creatorLevel = { name: 'Master Creator' };
    else if (courseCount >= 20) creatorLevel = { name: 'Expert Creator' };
    else if (courseCount >= 10) creatorLevel = { name: 'Advanced Creator' };
    else if (courseCount >= 5) creatorLevel = { name: 'Intermediate Creator' };
    else if (courseCount >= 1) creatorLevel = { name: 'Junior Creator' };

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

  const handleShareMyStats = async () => {
    if (!cardRef.current || !user) return;
    
    setIsSharing(true);
    try {
      // Capture the card
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f1729'
      });
      
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Convert base64 to blob and upload
      const response = await fetch(imageDataUrl);
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

      setShareUrl(publicUrl);
    } catch (error) {
      console.error('Error sharing stats:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Auto-trigger Farcaster share when URL is ready
  useEffect(() => {
    if (shareUrl) {
      // The ShareToFarcaster component will handle the actual share
    }
  }, [shareUrl]);

  return (
    <div className="space-y-4">
      {/* Shareable Card - Solid Background */}
      <div 
        ref={cardRef}
        className="relative overflow-hidden rounded-xl p-4"
        style={{ 
          background: '#0f1729',
          border: '2px solid #3b82f6'
        }}
      >
        {/* Content */}
        <div className="relative z-10 space-y-3">
          {/* Header: Avatar + Name + Level */}
          <div className="flex items-center gap-3">
            <img 
              src={stats.profile?.avatar_url || penguinAvatar} 
              alt="Avatar" 
              className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
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
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs text-gray-300">{stats.creatorLevel.name}</span>
              </div>
            </div>
          </div>

          {/* Points Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-900 rounded-lg p-2 text-center border border-blue-600">
              <div className="text-xl font-bold text-blue-400">{stats.upPoints.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">UP Points</div>
            </div>
            <div className="bg-amber-900 rounded-lg p-2 text-center border border-amber-600">
              <div className="text-xl font-bold text-amber-400">{stats.creatorPoints.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Creator Points</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.dailyStreak}</div>
              <div className="text-[9px] text-gray-400">Daily</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.weeklyStreak}</div>
              <div className="text-[9px] text-gray-400">Weekly</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <BookOpen className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.coursesEnrolled}</div>
              <div className="text-[9px] text-gray-400">Enrolled</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <Trophy className="w-4 h-4 text-purple-500 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white">{stats.achievements.length}</div>
              <div className="text-[9px] text-gray-400">Badges</div>
            </div>
          </div>

          {/* Achievements Row - Using icons instead of emojis */}
          {stats.achievements.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.achievements.slice(0, 6).map((a, i) => (
                <div 
                  key={i} 
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <Award className="w-4 h-4 text-white" />
                </div>
              ))}
              {stats.achievements.length > 6 && (
                <span className="text-xs text-gray-400">+{stats.achievements.length - 6}</span>
              )}
            </div>
          )}

          {/* Branding */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700">
            <span className="text-[10px] text-gray-500">uniquehub.app</span>
            <span className="text-xs font-bold text-blue-400">UniqueHub</span>
          </div>
        </div>
      </div>

      {/* Share Button */}
      {shareUrl ? (
        <ShareToFarcaster
          text={`Check out my stats on @uniquehub!\n\n${stats.upPoints.toLocaleString()} UP Points | ${stats.dailyStreak} Day Streak\n\nLearn, earn, and grow with the ultimate Web3 learning platform.`}
          embeds={[shareUrl, 'https://uniquehub.xyz']}
          buttonText="Share to Farcaster"
          variant="default"
          size="default"
          className="w-full bg-gradient-primary"
        />
      ) : (
        <Button 
          onClick={handleShareMyStats} 
          disabled={isSharing}
          className="w-full bg-gradient-primary"
        >
          {isSharing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              Share My Stats
            </>
          )}
        </Button>
      )}
    </div>
  );
};
