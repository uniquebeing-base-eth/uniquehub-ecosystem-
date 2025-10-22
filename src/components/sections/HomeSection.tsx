import { useEffect, useState } from 'react';
import { TrendingCourseCard } from "@/components/TrendingCourseCard";
import { LatestNFTCard } from "@/components/LatestNFTCard";
import { BookOpen, TrendingUp, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface HomeSectionProps {
  onNavigate?: (tab: string) => void;
}

export const HomeSection = ({ onNavigate }: HomeSectionProps) => {
  const [trendingCourses, setTrendingCourses] = useState<any[]>([]);
  const [latestNFTs, setLatestNFTs] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch trending courses (by enrollment count)
        const { data: courses } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published')
          .order('enrollment_count', { ascending: false })
          .limit(3);

        if (courses) setTrendingCourses(courses);

        // Fetch latest NFT listings
        const { data: nfts } = await supabase
          .from('nft_listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3);

        if (nfts) setLatestNFTs(nfts);

        // Fetch top creators (users with most courses)
        const { data: creators } = await supabase
          .from('profiles')
          .select('*, courses(count)')
          .limit(5);

        if (creators) {
          const sortedCreators = creators
            .filter((c: any) => c.courses?.[0]?.count > 0)
            .sort((a: any, b: any) => (b.courses?.[0]?.count || 0) - (a.courses?.[0]?.count || 0))
            .slice(0, 3);
          setTopCreators(sortedCreators);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-primary rounded-3xl p-6 text-white space-y-4">
        <h1 className="text-xl font-bold">
          Welcome to UniqueHub your super app for learning, earning and trading.
        </h1>
        <Button 
          variant="secondary" 
          className="bg-card text-foreground hover:bg-card-hover font-semibold rounded-full px-6"
        >
          Get started
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="p-6 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('marketplace')}
        >
          <div className="space-y-3">
            <div className="text-2xl">🎨</div>
            <h3 className="font-bold text-white">Discover NFTs</h3>
          </div>
        </Card>
        <Card 
          className="p-6 cursor-pointer hover:border-primary transition-all group bg-gradient-card"
          onClick={() => onNavigate?.('courses')}
        >
          <div className="space-y-3">
            <div className="text-2xl">💰</div>
            <h3 className="font-bold text-white">Start earning</h3>
          </div>
        </Card>
      </div>

      {/* Featured Course Card */}
      <Card className="p-6 bg-gradient-primary text-white rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Learn Web3.0</h3>
            <Button 
              variant="secondary"
              className="bg-card text-foreground hover:bg-card-hover rounded-full px-6 mt-2"
              onClick={() => onNavigate?.('courses')}
            >
              Start Now
            </Button>
          </div>
          <div className="text-6xl opacity-80">🔗</div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </Card>

      {/* Trending Courses Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Trending Courses</h3>
        </div>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        ) : trendingCourses.length > 0 ? (
          <div className="grid gap-4">
            {trendingCourses.map((course) => (
              <TrendingCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No trending courses yet. Be the first to create one!</p>
          </Card>
        )}
      </div>

      {/* Latest NFTs Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Latest NFTs</h3>
        </div>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        ) : latestNFTs.length > 0 ? (
          <div className="grid gap-3">
            {latestNFTs.map((nft) => (
              <LatestNFTCard key={nft.id} nft={nft} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No NFTs listed yet. List yours to get started!</p>
          </Card>
        )}
      </div>
    </div>
  );
};
