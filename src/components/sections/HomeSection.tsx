
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, Play, Wallet, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSandboxWallet } from '@/hooks/useSandboxWallet';
import cubeLogo from '@/assets/uniquehub-cube.png';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
}

interface FeaturedCourse {
  id: string;
  title: string;
  thumbnail_url: string;
  price_usdc: number;
  creator_name: string;
  creator_avatar: string;
  enrollment_count: number;
}

interface ActiveCreator {
  user_id: string;
  display_name: string;
  avatar_url: string;
  coin_symbol: string;
  holders_count: number;
}

export const HomeSection = ({ onNavigate }: HomeSectionProps) => {
  const { user } = useAuth();
  const { wallet, tokenBalances, loading: walletLoading } = useSandboxWallet();
  const [profile, setProfile] = useState<any>(null);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);
  const [activeCreators, setActiveCreators] = useState<ActiveCreator[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFeaturedCourses();
      fetchActiveCreators();
      fetchEnrollmentCount();
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

  const fetchFeaturedCourses = async () => {
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('enrollment_count', { ascending: false })
      .limit(3);

    if (courses) {
      const enriched = await Promise.all(
        courses.map(async (course) => {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', course.user_id)
            .single();

          return {
            id: course.id,
            title: course.title,
            thumbnail_url: course.thumbnail_url || '',
            price_usdc: course.price_usdc || 0,
            creator_name: creatorProfile?.display_name || 'Creator',
            creator_avatar: creatorProfile?.avatar_url || '',
            enrollment_count: course.enrollment_count || 0,
          };
        })
      );
      setFeaturedCourses(enriched);
    }
  };

  const fetchActiveCreators = async () => {
    const { data: coins } = await supabase
      .from('creator_coins')
      .select('*')
      .order('holders_count', { ascending: false })
      .limit(5);

    if (coins) {
      const enriched = await Promise.all(
        coins.map(async (coin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', coin.creator_user_id)
            .single();

          return {
            user_id: coin.creator_user_id,
            display_name: profile?.display_name || 'Creator',
            avatar_url: profile?.avatar_url || '',
            coin_symbol: coin.symbol,
            holders_count: coin.holders_count,
          };
        })
      );
      setActiveCreators(enriched);
    }
  };

  const fetchEnrollmentCount = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id);
    setEnrolledCount(data?.length || 0);
  };

  const totalTokens = tokenBalances.reduce((sum, t) => sum + t.balance, 0);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover, learn, and grow with UniqueHub
        </p>
      </div>

      {/* Wallet Summary Card */}
      <Card className="p-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="font-semibold">Sandbox Wallet</span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => onNavigate?.('profile')}
          >
            View Wallet
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs opacity-80">USDC Balance</p>
            <p className="text-lg font-bold">
              ${walletLoading ? '...' : wallet?.usdc_balance?.toLocaleString() || '10,000'}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">ETH Balance</p>
            <p className="text-lg font-bold">
              {walletLoading ? '...' : wallet?.eth_balance?.toFixed(2) || '5.00'}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Tokens</p>
            <p className="text-lg font-bold">
              {walletLoading ? '...' : tokenBalances.length || '0'}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => onNavigate?.('courses')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrolledCount}</p>
              <p className="text-xs text-muted-foreground">Courses Enrolled</p>
            </div>
          </div>
        </Card>
        <Card 
          className="p-4 rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => onNavigate?.('profile')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Tokens</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Creators */}
      {(activeCreators.length > 0 || true) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Creators</h2>
            <button 
              className="text-sm text-primary font-medium"
              onClick={() => onNavigate?.('discover')}
            >
              See All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {activeCreators.length > 0 ? (
              activeCreators.map((creator) => (
                <div key={creator.user_id} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/30">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {creator.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <img src={cubeLogo} alt="" className="w-3 h-3" />
                      <span className="text-xs font-semibold text-primary">{creator.coin_symbol}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[70px]">
                      {creator.display_name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {['BD', 'SD', 'AW', 'JF'][i]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <img src={cubeLogo} alt="" className="w-3 h-3" />
                      <span className="text-xs font-semibold text-primary">
                        ${['BANK', 'SARA', 'ALEX', 'JACK'][i]}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {['Bankless', 'Sara D.', 'Alex W3', 'Jack F.'][i]}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Featured Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Featured Courses</h2>
          <button 
            className="text-sm text-primary font-medium"
            onClick={() => onNavigate?.('courses')}
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {featuredCourses.length > 0 ? (
            featuredCourses.map((course) => (
              <Card 
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => onNavigate?.('courses')}
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate">{course.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={course.creator_avatar} />
                      <AvatarFallback className="text-[8px] bg-primary/20">
                        {course.creator_name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{course.creator_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-primary">
                      {course.price_usdc === 0 ? 'Free' : `$${course.price_usdc} USDC`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      • {course.enrollment_count} students
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Card>
            ))
          ) : (
            [...Array(3)].map((_, i) => (
              <Card 
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => onNavigate?.('courses')}
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground">
                    {['Crypto Fundamentals', 'Web3 Development', 'DeFi Mastery'][i]}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {['BanklessDave', 'Sara Digital', 'Alex Web3'][i]}
                  </span>
                  <div className="mt-1">
                    <span className="text-xs font-medium text-primary">${[5, 10, 15][i]} USDC</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Card>
            ))
          )}
        </div>
      </div>

      {/* CTA to Discover */}
      <Card 
        className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-all"
        onClick={() => onNavigate?.('discover')}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Explore More</h3>
            <p className="text-sm text-muted-foreground">
              Discover creators, courses, and grow your knowledge
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </Card>
    </div>
  );
};
