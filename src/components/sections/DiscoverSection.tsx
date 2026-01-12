
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Play, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import cubeLogo from '@/assets/uniquehub-cube.png';

interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  farcaster_username: string;
  coin_symbol?: string;
  holders_count?: number;
}

interface Course {
  id: string;
  title: string;
  thumbnail_url: string;
  price_usdc: number;
  creator_name: string;
  creator_avatar: string;
  coin_symbol: string;
  holders_count: number;
}

interface DiscoverSectionProps {
  onNavigateToCourse?: (courseId: string) => void;
}

const categories = ['Popular', 'Crypto', 'AI', 'Marketing', 'Design'];

export const DiscoverSection = ({ onNavigateToCourse }: DiscoverSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch creators with their coins
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .not('display_name', 'is', null)
        .limit(6);

      if (profiles) {
        const creatorsWithCoins = await Promise.all(
          profiles.map(async (profile) => {
            const { data: coin } = await supabase
              .from('creator_coins')
              .select('symbol, holders_count')
              .eq('creator_user_id', profile.user_id)
              .single();

            return {
              id: profile.id,
              user_id: profile.user_id,
              display_name: profile.display_name || 'Creator',
              avatar_url: profile.avatar_url || '',
              farcaster_username: profile.farcaster_username || '',
              coin_symbol: coin?.symbol || '$COIN',
              holders_count: coin?.holders_count || 0,
            };
          })
        );
        setCreators(creatorsWithCoins);
      }

      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      if (coursesData) {
        const coursesWithDetails = await Promise.all(
          coursesData.map(async (course) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', course.user_id)
              .single();

            const { data: coin } = await supabase
              .from('course_coins')
              .select('symbol, holders_count')
              .eq('course_id', course.id)
              .single();

            return {
              id: course.id,
              title: course.title,
              thumbnail_url: course.thumbnail_url || '',
              price_usdc: course.price_usdc || 0,
              creator_name: profile?.display_name || 'Creator',
              creator_avatar: profile?.avatar_url || '',
              coin_symbol: coin?.symbol || '$COURSE',
              holders_count: coin?.holders_count || 0,
            };
          })
        );
        setCourses(coursesWithDetails);
      }
    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = searchTerm
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : courses;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
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

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Popular Creators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Popular Creators</h2>
          <button className="text-sm text-primary font-medium">See All</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <div
                key={creator.id}
                className="flex flex-col items-center gap-2 min-w-[90px] cursor-pointer"
              >
                <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                  <AvatarImage src={creator.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {creator.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <img src={cubeLogo} alt="" className="w-3 h-3" />
                    <span className="text-xs font-semibold text-primary">
                      {creator.coin_symbol}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium truncate max-w-[80px]">
                    {creator.display_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="text-success">●</span> {creator.holders_count?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            ))
          ) : (
            // Placeholder creators
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[90px]">
                <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {['BD', 'SD', 'AW', 'JF'][i]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <img src={cubeLogo} alt="" className="w-3 h-3" />
                    <span className="text-xs font-semibold text-primary">
                      ${['BANK', 'SARA', 'ALEX', 'JACK'][i]}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium">
                    {['BanklessDave', 'Sara Digital', 'Alex Web3', 'Jack Films'][i]}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    <span className="text-success">●</span> {[122600, 96800, 78500, 45000][i].toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Top Courses</h2>
          <button className="text-sm text-primary font-medium">See All</button>
        </div>

        <div className="space-y-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => onNavigateToCourse?.(course.id)}
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground">{course.creator_name}</span>
                    <span className="text-primary text-xs font-medium">| {course.coin_symbol}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-success text-[10px]">●</span>
                    <span className="text-[10px] text-muted-foreground">
                      {course.coin_symbol} | {course.holders_count?.toLocaleString() || 0} Holders
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Placeholder courses
            [...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Play className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground">
                    {['Crypto Mastery', 'AI for Creators', 'Web3 Essentials'][i]}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {['BanklessDave', 'Sara Digital', 'Alex Web3'][i]}
                    </span>
                    <span className="text-primary text-xs font-medium">
                      | ${['BANK', 'SARA', 'ALEX'][i]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-success text-[10px]">●</span>
                    <span className="text-[10px] text-muted-foreground">
                      ${['BANK', 'SARA', 'ALEX'][i]} | {[120000, 95000, 75000][i].toLocaleString()} Holders
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
