import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Wallet, BookOpen, Users, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      description: 'Master blockchain & decentralized apps',
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
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-2xl p-5 space-y-3 relative overflow-hidden" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
        <div className="relative z-10">
          <h2 className="text-base font-semibold text-white">
            Hi {userName}
          </h2>
          <h1 className="text-lg font-bold leading-snug text-white">
            Welcome to UniqueHub your super app for learning, earning and trading.
          </h1>
          <Button 
            variant="secondary" 
            className="bg-white/90 text-primary hover:bg-white hover:shadow-lg font-semibold rounded-2xl px-6 py-2 h-auto text-sm transition-all duration-300 hover:scale-105"
            onClick={() => onNavigate?.('courses')}
          >
            Get started
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group bg-gradient-to-br from-card to-card-hover rounded-2xl hover:scale-105"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Discover NFTs</h3>
            <p className="text-xs text-muted-foreground">Explore digital art</p>
          </div>
        </Card>
        <Card 
          className="p-4 cursor-pointer hover:border-primary hover:shadow-glow transition-all duration-300 group bg-gradient-to-br from-card to-card-hover rounded-2xl hover:scale-105"
          onClick={() => onNavigate?.('earn')}
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Start Earning</h3>
            <p className="text-xs text-muted-foreground">Complete tasks & earn</p>
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
                <Card className="p-5 bg-gradient-primary text-white rounded-2xl overflow-hidden relative mx-0.5" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5" />
                        <h3 className="text-lg font-bold">{slide.title}</h3>
                      </div>
                      <p className="text-sm text-white/80 mb-3">{slide.description}</p>
                      <Button 
                        variant="secondary"
                        className="bg-white/90 text-primary hover:bg-white hover:shadow-lg rounded-2xl px-5 py-2 h-auto text-sm transition-all duration-300 hover:scale-105"
                        onClick={slide.action}
                      >
                        Start Now
                      </Button>
                    </div>
                    <div className="text-4xl opacity-80">{slide.icon}</div>
                  </div>
                </Card>
              )}
              
              {slide.type === 'facts' && (
                <Card className="p-5 bg-gradient-primary text-white rounded-2xl overflow-hidden relative mx-0.5" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-3xl">{slide.icon}</div>
                      <h3 className="text-lg font-bold">{slide.title}</h3>
                    </div>
                    <div className="space-y-2 text-sm text-white/90">
                      <p>• Learn Web3 skills from expert tutors</p>
                      <p>• Trade NFTs and digital collectibles</p>
                      <p>• Earn rewards by completing tasks</p>
                      <p>• Built on Base blockchain for fast transactions</p>
                    </div>
                  </div>
                </Card>
              )}
              
              {slide.type === 'course' && slide.course && (
                <Card className="p-5 bg-gradient-primary text-white rounded-2xl overflow-hidden relative mx-0.5" style={{ backgroundSize: '200% 200%', animation: 'gradient-shift 6s ease infinite' }}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-xs font-medium opacity-80">Trending Course</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{slide.course.title}</h3>
                    <p className="text-sm text-white/80 mb-3 line-clamp-2">{slide.course.description}</p>
                    <div className="flex items-center gap-3 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-white" />
                        <span className="font-medium">{slide.course.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{slide.course.enrollment_count} students</span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary"
                      className="bg-white/90 text-primary hover:bg-white hover:shadow-lg rounded-2xl px-5 py-2 h-auto text-sm transition-all duration-300 hover:scale-105"
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
        
        {/* Dots Indicator */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentSlide ? 'bg-primary w-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
