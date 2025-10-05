import { useEffect, useState } from 'react';
import { EarningCard } from "@/components/EarningCard";
import { TutorInfo } from "@/components/TutorInfo";
import { TrendingCourseCard } from "@/components/TrendingCourseCard";
import { LatestNFTCard } from "@/components/LatestNFTCard";
import { BookOpen, DollarSign, Users, Trophy, GraduationCap, Coins, TrendingUp, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const HomeSection = () => {
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
    <div className="space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Learn. Earn. Trade.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your Web3 super app for learning, earning crypto, and trading digital assets
        </p>
      </div>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-foreground">Start Your Journey</h2>
        
        <div className="grid gap-4">
          <EarningCard
            title="Learn & Earn"
            description="Complete courses and tasks to earn crypto rewards"
            icon={<BookOpen className="w-8 h-8" />}
            buttonText="START LEARNING"
          />
          
          <EarningCard
            title="Trade Assets"
            description="Buy and sell NFTs and digital collectibles"
            icon={<Coins className="w-8 h-8" />}
            buttonText="EXPLORE MARKETPLACE"
          />
          
          <EarningCard
            title="Become a Tutor"
            description="Create courses and earn from teaching others"
            icon={<GraduationCap className="w-8 h-8" />}
            buttonText="START TEACHING"
          />
        </div>

        {/* Trending Courses Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Trending Courses</h3>
          </div>
          {loading ? (
            <div className="grid gap-4">
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
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Latest NFTs</h3>
          </div>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-24 w-full" />
                </Card>
              ))}
            </div>
          ) : latestNFTs.length > 0 ? (
            <div className="grid gap-4">
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

        {/* Top Creators Section */}
        {topCreators.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">Top Creators</h3>
            </div>
            <Card className="p-4">
              <div className="space-y-3">
                {topCreators.map((creator, index) => (
                  <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {creator.display_name || creator.farcaster_username || 'Creator'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {creator.courses?.[0]?.count || 0} courses
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="bg-gradient-card rounded-xl p-6 border border-border mt-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Why UniqueHub?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Earn Rewards</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Join Community</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Learn Web3</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Make Money</span>
            </div>
          </div>
        </div>

        <TutorInfo />
      </div>
    </div>
  );
};
