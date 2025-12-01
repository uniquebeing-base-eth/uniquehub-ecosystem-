import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Share2, Trophy, Flame, Calendar, Target, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserStats {
  username: string;
  farcasterUsername: string;
  creatorLevel: string;
  levelColor: string;
  totalPoints: number;
  dailyStreak: number;
  weeklyStreak: number;
  monthlyStreak: number;
  creatorPoints: number;
  achievementsCount: number;
}

export const StatsGlowCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [points, setPoints] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    const [profileRes, pointsRes, achievementsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('user_points').select('*').eq('user_id', user.id).single(),
      supabase.from('creator_achievements').select('*').eq('user_id', user.id).order('awarded_at', { ascending: false })
    ]);

    setProfile(profileRes.data);
    setPoints(pointsRes.data);
    setAchievements(achievementsRes.data || []);
  };

  const getCreatorLevel = (creatorPoints: number) => {
    if (creatorPoints >= 10000) return { level: "Legend", color: "from-yellow-400 to-orange-500" };
    if (creatorPoints >= 5000) return { level: "Master", color: "from-purple-400 to-pink-500" };
    if (creatorPoints >= 2000) return { level: "Expert", color: "from-pink-400 to-rose-500" };
    if (creatorPoints >= 500) return { level: "Advanced", color: "from-emerald-400 to-teal-500" };
    if (creatorPoints >= 100) return { level: "Intermediate", color: "from-blue-400 to-cyan-500" };
    return { level: "Beginner", color: "from-gray-400 to-slate-500" };
  };

  const handleGenerateCard = async () => {
    if (!user) {
      toast.error("Please sign in to generate your stats card");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('generate-stats-card', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedImage(data.imageUrl);
        setStats(data.stats);
        setShowPreview(true);
        toast.success("Stats card generated! 🎨");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error("Failed to generate card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!generatedImage || !stats) return;

    try {
      const castText = `🌟 My UniqueHub Stats!\n\n${stats.creatorLevel} Creator | ${stats.totalPoints.toLocaleString()} UP\n🔥 ${stats.dailyStreak} day streak | 🏆 ${stats.achievementsCount} achievements\n\nJoin me on @uniquehub!\n\nhttps://uniquehub.app`;

      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`;
      window.open(shareUrl, '_blank');
      
      toast.success("Sharing to Farcaster! 🎉");
    } catch (error) {
      console.error('Share error:', error);
      toast.error("Failed to share");
    }
  };

  const levelInfo = points ? getCreatorLevel(points.creator_points || 0) : { level: "Beginner", color: "from-gray-400 to-slate-500" };
  const topAchievements = achievements.slice(0, 3);

  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        
        <div className="relative p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${levelInfo.color} blur-xl opacity-50 animate-pulse`} />
              <Avatar className="h-20 w-20 border-4 border-background relative">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-2xl font-bold">
                  {profile?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{profile?.display_name || 'UniqueHub User'}</h2>
              <p className="text-sm text-muted-foreground">@{profile?.farcaster_username || 'anonymous'}</p>
              <Badge className={`mt-2 bg-gradient-to-r ${levelInfo.color} text-white border-0`}>
                {levelInfo.level} Creator
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-card rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Daily Streak</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{points?.daily_streak || 0}</p>
            </div>

            <div className="bg-gradient-card rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Weekly Streak</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{points?.weekly_streak || 0}</p>
            </div>

            <div className="bg-gradient-card rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Monthly Streak</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{points?.monthly_streak || 0}</p>
            </div>

            <div className="bg-gradient-card rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Achievements</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{achievements.length}</p>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl p-6 text-center border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Total Points</p>
            <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              {points?.total_points?.toLocaleString() || 0} UP
            </p>
          </div>

          {/* Top Achievements */}
          {topAchievements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Recent Achievements</p>
              <div className="flex gap-2 flex-wrap">
                {topAchievements.map((achievement) => (
                  <Badge
                    key={achievement.id}
                    className="bg-gradient-to-r from-primary/20 to-primary/10 text-foreground border border-primary/20"
                  >
                    {achievement.achievement_type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Generate Card Button */}
          <Button
            onClick={handleGenerateCard}
            disabled={loading || !user}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold py-6"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <Star className="mr-2 h-5 w-5" />
                Generate Shareable Card
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Stats Card 🌟</DialogTitle>
          </DialogHeader>
          
          {generatedImage && (
            <div className="space-y-4">
              <img 
                src={generatedImage} 
                alt="Stats Card" 
                className="w-full rounded-lg shadow-2xl"
              />
              
              <Button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share to Farcaster
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
