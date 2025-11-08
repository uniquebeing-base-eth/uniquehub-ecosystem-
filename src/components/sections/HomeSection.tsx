import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Wallet, BookOpen, Users, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import animeLearnBg from '@/assets/anime-bg-learn.jpg';
import animeHeroBg from '@/assets/anime-hero-bg.jpg';
import animeNftBg from '@/assets/anime-nft-bg.jpg';
import animeEarnBg from '@/assets/anime-earn-bg.jpg';
import animeFactsBg from '@/assets/anime-facts-bg.jpg';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
  userName?: string;
}

interface TrendingCourse {
  id: string;
  title: string;
  description: string;
  rating: number;
  enrollment_count: number;
  thumbnail_url?: string;
}

export const HomeSection = ({ onNavigate, userName }: HomeSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trendingCourses, setTrendingCourses] = useState<TrendingCourse[]>([]);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    fetchTrendingCourses();
  }, []);

  const fetchTrendingCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, rating, enrollment_count, thumbnail_url')
      .eq('status', 'published')
      .order('rating', { ascending: false })
      .order('enrollment_count', { ascending: false })
      .limit(2);

    if (data) {
      setTrendingCourses(data);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < 3) {
        setCurrentSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    }
  };

  const slides = [
    {
      type: 'web3',
      title: 'Learn Web3.0',
      description: 'Master blockchain technology, smart contracts, and decentralized applications',
      icon: '🔗',
      action: () => onNavigate?.('courses'),
    },
    {
      type: 'facts',
      title: 'About UniqueHub',
      description: 'Your all-in-one platform',
      icon: '✨',
    },
    ...(trendingCourses.length >= 1 ? [{
      type: 'course',
      course: trendingCourses[0],
    }] : []),
    ...(trendingCourses.length >= 2 ? [{
      type: 'course',
      course: trendingCourses[1],
    }] : []),
  ];

  return (
    <div className="space-y-3 pb-20 animate-fade-in">
      {/* Hero Section */}
      <div className="rounded-2xl p-4 space-y-2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-100"
          style={{ backgroundImage: `url(${animeHeroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30" />
        <div className="relative z-10">
          <h2 className="text-sm font-semibold text-white mb-3">
            Hi {userName}
          </h2>
          <h1 className="text-base font-bold leading-snug text-white">
            Welcome to UniqueHub your super app for learning, earning and trading.
          </h1>
          <Button 
            variant="secondary" 
            className="bg-white/90 text-blue-600 hover:bg-white hover:shadow-lg font-semibold rounded-2xl px-5 py-1.5 h-auto text-xs transition-all duration-300 hover:scale-105 mt-2"
            onClick={() => onNavigate?.('courses')}
          >
            Get started
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Card 
          className="p-3 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group rounded-2xl hover:scale-105 relative overflow-hidden border-none"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100"
            style={{ backgroundImage: `url(${animeNftBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/85" />
          <div className="space-y-1.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-white">Discover NFTs</h3>
            <p className="text-xs text-white/80">Explore digital art</p>
          </div>
        </Card>
        <Card 
          className="p-3 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group rounded-2xl hover:scale-105 relative overflow-hidden border-none"
          onClick={() => onNavigate?.('earn')}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100"
            style={{ backgroundImage: `url(${animeEarnBg})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-emerald-800/85" />
          <div className="space-y-1.5 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-sm text-white">Start Earning</h3>
            <p className="text-xs text-white/80">Complete tasks & earn</p>
          </div>
        </Card>
      </div>

      {/* Featured Carousel */}
      <div 
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {slide.type === 'web3' && (
                <Card className="p-4 text-white rounded-2xl overflow-hidden relative mx-0.5 h-[180px] flex flex-col">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-100"
                    style={{ 
                      backgroundImage: `url(${animeLearnBg})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/50" />
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5" />
                      <h3 className="text-base font-bold">{slide.title}</h3>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">{slide.description}</p>
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex gap-1.5">
                      {slides.map((_, dotIndex) => (
                        <div
                          key={dotIndex}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dotIndex === currentSlide ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                    <Button 
                      variant="secondary"
                      className="bg-white/90 text-primary hover:bg-white hover:shadow-lg rounded-xl px-3 py-1 h-auto text-xs font-medium transition-all duration-300 hover:scale-105"
                      onClick={slide.action}
                    >
                      Start Now
                    </Button>
                  </div>
                </Card>
              )}
              
              {slide.type === 'facts' && (
                <Card className="p-4 text-white rounded-2xl overflow-hidden relative mx-0.5 h-[180px] flex flex-col">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${animeFactsBg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-primary/65" />
                  <div className="flex-1 relative z-10">
                    <h3 className="text-base font-bold mb-3">{slide.title}</h3>
                    <div className="space-y-1.5 text-xs text-white/90">
                      <p>• Learn Web3 skills from expert tutors</p>
                      <p>• Trade NFTs and digital collectibles</p>
                      <p>• Earn rewards by completing tasks</p>
                      <p>• Built on Base blockchain</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-auto relative z-10">
                    {slides.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`w-1.5 h-1.5 rounded-full ${
                          dotIndex === currentSlide ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </Card>
              )}
              
              {slide.type === 'course' && slide.course && (
                <Card className="p-4 text-white rounded-2xl overflow-hidden relative mx-0.5 h-[180px] flex flex-col">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ 
                      backgroundImage: slide.course.thumbnail_url 
                        ? `url(${slide.course.thumbnail_url})` 
                        : `url(${animeLearnBg})`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-primary/80" />
                  <div className="flex gap-3 flex-1 relative z-10">
                    {slide.course.thumbnail_url && (
                      <div className="w-24 h-full rounded-xl overflow-hidden flex-shrink-0 bg-white/10 border border-white/20">
                        <img 
                          src={slide.course.thumbnail_url} 
                          alt={slide.course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-medium opacity-80">Trending</span>
                      </div>
                      <h3 className="text-sm font-bold mb-1 line-clamp-2">{slide.course.title}</h3>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          <span className="font-medium">{slide.course.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">{slide.course.enrollment_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between relative z-10 mt-2">
                    <div className="flex gap-1.5">
                      {slides.map((_, dotIndex) => (
                        <div
                          key={dotIndex}
                          className={`w-1.5 h-1.5 rounded-full ${
                            dotIndex === currentSlide ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                    <Button 
                      variant="secondary"
                      className="bg-white/90 text-primary hover:bg-white hover:shadow-lg rounded-xl px-3 py-1 h-auto text-xs font-medium transition-all duration-300 hover:scale-105"
                      onClick={() => onNavigate?.('courses')}
                    >
                      View Course
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
