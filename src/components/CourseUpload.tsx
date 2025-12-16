
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, DollarSign, Video, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useViemClients } from '@/hooks/useViemClients';
import { parseUnits } from 'viem';
import { toast } from 'sonner';
import { 
  COURSE_CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  COURSE_CONTRACT_ABI, 
  USDC_ABI, 
  LISTING_FEE 
} from '@/config/wagmi';
import { CourseModulesEditor } from '@/components/CourseModulesEditor';

interface CourseUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseUpload = ({ onSuccess, onCancel }: CourseUploadProps) => {
  const { user } = useAuth();
  const { address, isLoading: isWalletLoading } = useFarcasterWallet();
  const { publicClient, walletClient } = useViemClients(address);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_usdc: '',
    category: 'web3-basics',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded'>('idle');
  const [listingStep, setListingStep] = useState<'idle' | 'approving' | 'listing'>('idle');
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [showModulesEditor, setShowModulesEditor] = useState(false);

  const isPaidCourse = parseFloat(formData.price_usdc) > 0;

  // Fetch USDC allowance for listing fee
  useEffect(() => {
    const fetchAllowance = async () => {
      if (!address || !isPaidCourse || !publicClient) return;
      
      try {
        const result = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'allowance',
          args: [address, COURSE_CONTRACT_ADDRESS],
        } as any);
        setAllowance(result as bigint);
      } catch (error) {
        console.error('Error fetching allowance:', error);
      }
    };

    fetchAllowance();
  }, [address, isPaidCourse, publicClient]);

  React.useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  const handleDatabaseCreation = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let thumbnail_url: string | null = null;
      let video_url: string | null = null;

      if (thumbnailFile) {
        const thumbnailPath = `course-thumbnails/${user.id}/${Date.now()}-${thumbnailFile.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from('avatars')
          .upload(thumbnailPath, thumbnailFile);

        if (thumbnailError) throw thumbnailError;

        const { data: thumbnailUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(thumbnailPath);
        thumbnail_url = thumbnailUrlData.publicUrl;
      }

      if (videoFile) {
        const videoPath = `course-videos/${user.id}/${Date.now()}-${videoFile.name}`;
        const { error: videoError } = await supabase.storage
          .from('avatars')
          .upload(videoPath, videoFile);

        if (videoError) throw videoError;

        const { data: videoUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(videoPath);
        video_url = videoUrlData.publicUrl;
      }

      // Create course in database FIRST to get real ID
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price_usdc: parseFloat(formData.price_usdc) || 0,
          category: formData.category,
          thumbnail_url,
          video_url,
          status: 'published',
        })
        .select()
        .single();

      if (error) throw error;

      return newCourse.id; // Return the course ID for on-chain listing
    } catch (error) {
      console.error('Error creating course in database:', error);
      toast.error('Failed to create course in database');
      setLoading(false);
      throw error;
    }
  };

  const handleApproveUSDC = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setListingStep('approving');
    setLoading(true);
    
    try {
      toast.info('Please approve USDC in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [COURSE_CONTRACT_ADDRESS, LISTING_FEE],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Approval transaction submitted. Waiting for confirmation...');
      
      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      // Refetch allowance
      const newAllowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address, COURSE_CONTRACT_ADDRESS],
      } as any) as bigint;
      
      setAllowance(newAllowance);
      toast.success('USDC approved! Now listing course on-chain...');
      
      setTimeout(() => handleListCourse(), 1000);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve USDC');
      setListingStep('idle');
      setLoading(false);
    }
  };

  const handleListCourse = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setListingStep('listing');
    setLoading(true);
    
    let courseId: string | null = null;
    
    try {
      // Check ETH balance first
      const balance = await publicClient.getBalance({ address });
      const estimatedGas = 150000n; // Estimated gas for listCourse
      const gasPrice = await publicClient.getGasPrice();
      const estimatedCost = estimatedGas * gasPrice;
      
      if (balance < estimatedCost) {
        toast.error(`Insufficient ETH for gas. Need ~${(Number(estimatedCost) / 1e18).toFixed(6)} ETH`);
        setListingStep('idle');
        setLoading(false);
        return;
      }

      // Create course in database FIRST to get real ID
      toast.info('Creating course...');
      courseId = await handleDatabaseCreation();
      
      if (!courseId) {
        throw new Error('Failed to create course in database');
      }

      const priceInUSDC = BigInt(parseFloat(formData.price_usdc) * 1_000_000);
      
      toast.info('Please confirm the listing transaction in your wallet...');
      
      const hash = await walletClient.writeContract({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'listCourse',
        args: [courseId, priceInUSDC],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Listing transaction submitted!');
      
      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success('Course listed on-chain! Now add modules and lessons.');
      setUploadStatus('uploaded');
      setCreatedCourseId(courseId);
      setShowModulesEditor(true);
      setListingStep('idle');
      setLoading(false);
    } catch (error: any) {
      console.error('Listing error:', error);
      
      // Rollback: Delete course from database if on-chain listing failed
      if (courseId) {
        try {
          await supabase.from('courses').delete().eq('id', courseId);
          toast.error('On-chain listing failed. Course creation rolled back.');
        } catch (deleteError) {
          console.error('Failed to rollback course:', deleteError);
          toast.error('On-chain listing failed and rollback failed. Please contact support.');
        }
      } else {
        toast.error(error.message || 'Failed to list course on-chain');
      }
      
      setListingStep('idle');
      setLoading(false);
    }
  };

  const handleListFreeCourse = async () => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    setListingStep('listing');
    setLoading(true);
    
    let courseId: string | null = null;
    
    try {
      // Check ETH balance first
      const balance = await publicClient.getBalance({ address });
      const estimatedGas = 150000n; // Estimated gas for listCourse
      const gasPrice = await publicClient.getGasPrice();
      const estimatedCost = estimatedGas * gasPrice;
      
      if (balance < estimatedCost) {
        toast.error(`Insufficient ETH for gas. Need ~${(Number(estimatedCost) / 1e18).toFixed(6)} ETH`);
        setListingStep('idle');
        setLoading(false);
        return;
      }

      // Create course in database FIRST to get real ID
      toast.info('Creating free course...');
      courseId = await handleDatabaseCreation();
      
      if (!courseId) {
        throw new Error('Failed to create course in database');
      }
      
      toast.info('Listing free course on-chain...');
      
      const hash = await walletClient.writeContract({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'listCourse',
        args: [courseId, 0n],
        account: address,
        chain: walletClient.chain,
      } as any);

      toast.info('Listing transaction submitted!');
      
      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      toast.success('Free course listed on-chain! Now add modules and lessons.');
      setUploadStatus('uploaded');
      setCreatedCourseId(courseId);
      setShowModulesEditor(true);
      setListingStep('idle');
      setLoading(false);
    } catch (error: any) {
      console.error('Listing error:', error);
      
      // Rollback: Delete course from database if on-chain listing failed
      if (courseId) {
        try {
          await supabase.from('courses').delete().eq('id', courseId);
          toast.error('On-chain listing failed. Course creation rolled back.');
        } catch (deleteError) {
          console.error('Failed to rollback course:', deleteError);
          toast.error('On-chain listing failed and rollback failed. Please contact support.');
        }
      } else {
        toast.error(error.message || 'Failed to list free course on-chain');
      }
      
      setListingStep('idle');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!thumbnailFile) {
      toast.error('Please upload a course thumbnail');
      return;
    }

    if (!videoFile) {
      toast.error('Please upload a course video');
      return;
    }

    if (formData.price_usdc && parseFloat(formData.price_usdc) <= 0) {
      toast.error('Please set a valid price for your course');
      return;
    }

    if (isWalletLoading) {
      toast.info('Loading your wallet...');
      return;
    }

    if (!address) {
      toast.error('Could not fetch your Farcaster wallet address');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');

    const isPaid = parseFloat(formData.price_usdc) > 0;

    if (isPaid) {
      // Paid course: check allowance and approve if needed
      if (allowance < LISTING_FEE) {
        await handleApproveUSDC();
      } else {
        await handleListCourse();
      }
    } else {
      // Free course: must also be listed on-chain (with price 0)
      await handleListFreeCourse();
    }
  };

  const isProcessing = loading || listingStep !== 'idle' || isWalletLoading;

  const handleModulesComplete = () => {
    // Reset form
    setFormData({ title: '', description: '', price_usdc: '', category: 'web3-basics' });
    setThumbnailFile(null);
    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    setThumbPreview(null);
    setVideoFile(null);
    setCreatedCourseId(null);
    setShowModulesEditor(false);
    setUploadStatus('idle');
    
    onSuccess?.();
    window.dispatchEvent(new CustomEvent('navigate', { detail: { tab: 'courses' } }));
  };

  // Show modules editor after course creation
  if (showModulesEditor && createdCourseId) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2">Add Course Content</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add modules and lessons to your course. Each module can have multiple video lessons.
        </p>
        <CourseModulesEditor courseId={createdCourseId} />
        <div className="flex gap-3 mt-6">
          <Button onClick={handleModulesComplete} className="bg-primary hover:bg-primary/90">
            Finish & Publish Course
          </Button>
          <Button variant="outline" onClick={() => {
            toast.info('You can add more content later from your course dashboard');
            handleModulesComplete();
          }}>
            Skip for Now
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">Upload New Course</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Web3 Basics"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USDC)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_usdc}
              onChange={(e) => setFormData({ ...formData, price_usdc: e.target.value })}
              placeholder="0 for free"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your course..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
          >
            <option value="web3-basics">Web3 Basics</option>
            <option value="defi">DeFi</option>
            <option value="nfts">NFTs</option>
            <option value="smart-contracts">Smart Contracts</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  if (file) {
                    if (thumbPreview) URL.revokeObjectURL(thumbPreview);
                    setThumbPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground">Click to upload image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </label>
              {thumbPreview && (
                <img src={thumbPreview} alt="Preview" className="mt-2 w-full h-20 object-cover rounded" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course Video (Preview)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground">Preview video (optional)</p>
                <p className="text-xs text-muted-foreground">MP4, WebM up to 100MB</p>
              </label>
              {videoFile && (
                <p className="text-xs text-primary mt-1">{videoFile.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 items-center">
          <Button type="submit" disabled={isProcessing || !address} className="bg-primary hover:bg-primary/90">
            {isWalletLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading wallet...
              </span>
            ) : isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {listingStep === 'approving' ? 'Approving...' : 
                 listingStep === 'listing' ? 'Listing...' : 'Uploading...'}
              </span>
            ) : (
              'Create Course'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
