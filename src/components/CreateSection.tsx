
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Coins, Video, Plus, Upload, Play, BookOpen, DollarSign, Check, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSandboxWallet } from '@/hooks/useSandboxWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import cubeLogo from '@/assets/uniquehub-cube.png';

interface MyCourse {
  id: string;
  title: string;
  price_usdc: number;
  enrollment_count: number;
  thumbnail_url: string;
  status: string;
}

export const CreateSection = () => {
  const { user } = useAuth();
  const { creatorCoin, createCreatorCoin, refetch } = useSandboxWallet();
  
  // Creator Coin Modal
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinName, setCoinName] = useState('');
  const [coinSymbol, setCoinSymbol] = useState('');
  const [isCreatingCoin, setIsCreatingCoin] = useState(false);

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [courseThumbnail, setCourseThumbnail] = useState('');
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // My Courses
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // NFT Upload Modal
  const [showNftModal, setShowNftModal] = useState(false);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [nftPrice, setNftPrice] = useState('');
  const [nftImage, setNftImage] = useState('');
  const [isCreatingNft, setIsCreatingNft] = useState(false);

  useState(() => {
    if (user) {
      fetchMyCourses();
    }
  });

  const fetchMyCourses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setMyCourses(data || []);
    setLoadingCourses(false);
  };

  const handleCreateCoin = async () => {
    if (!coinName || !coinSymbol) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreatingCoin(true);
    try {
      const coin = await createCreatorCoin(coinName, `$${coinSymbol.toUpperCase()}`);
      if (coin) {
        toast.success('Creator coin created!', {
          description: `${coin.symbol} is now live. You received 1,000,000 tokens.`,
        });
        setShowCoinModal(false);
        setCoinName('');
        setCoinSymbol('');
      }
    } catch (error) {
      toast.error('Failed to create coin');
    } finally {
      setIsCreatingCoin(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseTitle || !coursePrice) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsCreatingCourse(true);
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          user_id: user!.id,
          title: courseTitle,
          description: courseDescription,
          price_usdc: parseFloat(coursePrice),
          thumbnail_url: courseThumbnail || null,
          status: 'published',
        })
        .select()
        .single();

      if (error) throw error;

      // Create course coin
      const symbol = '$' + courseTitle.slice(0, 4).toUpperCase().replace(/\s/g, '');
      await supabase.from('course_coins').insert({
        course_id: course.id,
        name: courseTitle + ' Coin',
        symbol,
      });

      toast.success('Course published!', {
        description: `${courseTitle} is now live with its own coin.`,
      });
      setShowCourseModal(false);
      setCourseTitle('');
      setCourseDescription('');
      setCoursePrice('');
      setCourseThumbnail('');
      await fetchMyCourses();
    } catch (error) {
      console.error('Course creation error:', error);
      toast.error('Failed to create course');
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleCreateNft = async () => {
    if (!nftName || !nftPrice) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsCreatingNft(true);
    try {
      const { error } = await supabase.from('nft_listings').insert({
        user_id: user!.id,
        name: nftName,
        description: nftDescription,
        price_amount: parseFloat(nftPrice),
        price_currency: 'USDC',
        image_url: nftImage || null,
        status: 'active',
        token_address: `0x${Math.random().toString(16).slice(2, 42)}`,
        token_id: Math.floor(Math.random() * 10000).toString(),
        token_standard: 'ERC721',
      });

      if (error) throw error;

      toast.success('NFT listed!', {
        description: `${nftName} is now available in the marketplace.`,
      });
      setShowNftModal(false);
      setNftName('');
      setNftDescription('');
      setNftPrice('');
      setNftImage('');
    } catch (error) {
      console.error('NFT creation error:', error);
      toast.error('Failed to list NFT');
    } finally {
      setIsCreatingNft(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Connect to Create</h1>
        <p className="text-muted-foreground">Please sign in to create content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Create</h1>

      {/* Create Creator Coin Card */}
      <Card className="p-4 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Create Creator Coin</h3>
              <p className="text-sm text-muted-foreground">
                Launch your own creator coin and reward your supporters.
              </p>
            </div>
          </div>

          {creatorCoin ? (
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl border border-success/20">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{creatorCoin.name}</p>
                <p className="text-xs text-primary font-medium">{creatorCoin.symbol}</p>
              </div>
              <Badge className="bg-success text-white">Active</Badge>
            </div>
          ) : (
            <Button 
              onClick={() => setShowCoinModal(true)}
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coin
            </Button>
          )}
        </div>
      </Card>

      {/* Create Course Card */}
      <Card className="p-4 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Create New Course</h3>
              <p className="text-sm text-muted-foreground">
                Launch a course, stream videos, and earn from your content.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCourseModal(true)}
            className="rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </Card>

      {/* Upload NFT Card */}
      <Card className="p-4 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">List NFT</h3>
              <p className="text-sm text-muted-foreground">
                Upload and sell your digital art on the marketplace.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowNftModal(true)}
            variant="outline"
            className="rounded-full border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload NFT
          </Button>
        </div>
      </Card>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">My Courses</h2>
            <span className="text-sm text-muted-foreground">{myCourses.length} courses</span>
          </div>
          <div className="space-y-2">
            {myCourses.map((course) => (
              <Card key={course.id} className="p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary">${course.price_usdc} USDC</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{course.enrollment_count || 0} students</span>
                    </div>
                  </div>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                    {course.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Coin Modal */}
      <Dialog open={showCoinModal} onOpenChange={setShowCoinModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Creator Coin</DialogTitle>
            <DialogDescription>
              Launch your token. 10M total supply, you get 1M (10%) immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Coin Name</label>
              <Input
                placeholder="e.g., Alex Coin"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Symbol</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  placeholder="ALEX"
                  value={coinSymbol}
                  onChange={(e) => setCoinSymbol(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))}
                  className="pl-7 rounded-xl uppercase"
                  maxLength={6}
                />
              </div>
            </div>

            <Card className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-2">Tokenomics</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Supply</span>
                  <span className="font-medium">10,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Price</span>
                  <span className="font-medium">$0.004</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Allocation (10%)</span>
                  <span className="font-medium text-primary">1,000,000 tokens</span>
                </div>
              </div>
            </Card>

            <Button
              className="w-full rounded-full"
              onClick={handleCreateCoin}
              disabled={isCreatingCoin || !coinName || !coinSymbol}
            >
              {isCreatingCoin ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Coin'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Course Modal */}
      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Course</DialogTitle>
            <DialogDescription>
              Publish a video course. A course coin will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Course Title *</label>
              <Input
                placeholder="e.g., Web3 Fundamentals"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <Textarea
                placeholder="Describe your course..."
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price (USDC) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="5.00"
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  className="pl-8 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Thumbnail URL</label>
              <Input
                placeholder="https://..."
                value={courseThumbnail}
                onChange={(e) => setCourseThumbnail(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleCreateCourse}
              disabled={isCreatingCourse || !courseTitle || !coursePrice}
            >
              {isCreatingCourse ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Publish Course'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload NFT Modal */}
      <Dialog open={showNftModal} onOpenChange={setShowNftModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">List NFT</DialogTitle>
            <DialogDescription>
              Upload your digital art to the marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">NFT Name *</label>
              <Input
                placeholder="e.g., Crypto Punk #123"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <Textarea
                placeholder="Describe your NFT..."
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price (USDC) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="10.00"
                  value={nftPrice}
                  onChange={(e) => setNftPrice(e.target.value)}
                  className="pl-8 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Image URL</label>
              <Input
                placeholder="https://..."
                value={nftImage}
                onChange={(e) => setNftImage(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              className="w-full rounded-full"
              onClick={handleCreateNft}
              disabled={isCreatingNft || !nftName || !nftPrice}
            >
              {isCreatingNft ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'List NFT'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
