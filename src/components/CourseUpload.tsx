import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, DollarSign, Video, Image, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { toast } from 'sonner';
import { 
  COURSE_CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  COURSE_CONTRACT_ABI, 
  USDC_ABI, 
  LISTING_FEE 
} from '@/config/wagmi';

interface CourseUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseUpload = ({ onSuccess, onCancel }: CourseUploadProps) => {
  const { user } = useAuth();
  const { address } = useFarcasterWallet();
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
  
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isPaidCourse = parseFloat(formData.price_usdc) > 0;

  // Check USDC allowance for listing fee
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, COURSE_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address && isPaidCourse },
  });

  React.useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  React.useEffect(() => {
    if (isTxSuccess && txHash) {
      handleDatabaseCreation();
    }
  }, [isTxSuccess, txHash]);

  const handleDatabaseCreation = async () => {
    if (!user) return;
    
    try {
      let thumbnail_url: string | null = null;
      let video_url: string | null = null;

      // Upload thumbnail
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

      // Upload video
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

      // Create course in database (using course.id as blockchain courseId)
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

      setUploadStatus('uploaded');
      toast.success('Course listed on-chain and published!');

      // Reset form
      setFormData({ title: '', description: '', price_usdc: '', category: 'web3-basics' });
      setThumbnailFile(null);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
      setVideoFile(null);
      setTxHash(undefined);
      setListingStep('idle');

      onSuccess?.();
      window.dispatchEvent(new CustomEvent('navigate', { detail: { tab: 'courses' } }));
    } catch (error) {
      console.error('Error creating course in database:', error);
      toast.error('Course listed on-chain but failed to create database entry');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUSDC = async () => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setListingStep('approving');
    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [COURSE_CONTRACT_ADDRESS, LISTING_FEE],
        account: address,
        chain: base,
      });

      toast.info('Approval transaction submitted. Waiting for confirmation...');
      
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          await refetchAllowance();
          const currentAllowance = allowance as bigint | undefined;
          if (currentAllowance && currentAllowance >= LISTING_FEE) {
            clearInterval(interval);
            resolve(true);
          }
        }, 2000);
      });

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
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setListingStep('listing');
    try {
      const priceInUSDC = BigInt(parseFloat(formData.price_usdc) * 1_000_000);
      
      // Use a temporary ID (will be replaced with actual DB id later)
      const tempCourseId = `temp-${Date.now()}-${address.slice(2, 10)}`;
      
      const hash = await writeContractAsync({
        address: COURSE_CONTRACT_ADDRESS,
        abi: COURSE_CONTRACT_ABI,
        functionName: 'listCourse',
        args: [tempCourseId, priceInUSDC],
        account: address,
        chain: base,
      });

      setTxHash(hash);
      toast.info('Listing transaction submitted!');
    } catch (error: any) {
      console.error('Listing error:', error);
      toast.error(error.message || 'Failed to list course on-chain');
      setListingStep('idle');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.price_usdc && parseFloat(formData.price_usdc) <= 0) {
      toast.error('Please set a valid price for your course');
      return;
    }

    if (!address) {
      toast.error('Connecting to your Farcaster wallet...');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');

    const isPaid = parseFloat(formData.price_usdc) > 0;

    if (isPaid) {
      // Paid course: check allowance and approve if needed
      const currentAllowance = (allowance as bigint | undefined) || 0n;
      
      if (currentAllowance < LISTING_FEE) {
        await handleApproveUSDC();
      } else {
        await handleListCourse();
      }
    } else {
      // Free course: no listing fee, directly create in database
      try {
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

        const { error } = await supabase.from('courses').insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          price_usdc: 0,
          category: formData.category,
          thumbnail_url,
          video_url,
          status: 'published',
        });

        if (error) throw error;

        setUploadStatus('uploaded');
        toast.success('Free course uploaded successfully!');

        setFormData({ title: '', description: '', price_usdc: '', category: 'web3-basics' });
        setThumbnailFile(null);
        if (thumbPreview) URL.revokeObjectURL(thumbPreview);
        setThumbPreview(null);
        setVideoFile(null);

        onSuccess?.();
        window.dispatchEvent(new CustomEvent('navigate', { detail: { tab: 'courses' } }));
      } catch (error) {
        console.error('Error uploading free course:', error);
        toast.error('Failed to upload course');
        setUploadStatus('idle');
      } finally {
        setLoading(false);
      }
    }
  };

  const isProcessing = loading || listingStep !== 'idle' || isTxConfirming;

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
              placeholder="Enter course title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="web3-basics">Web3 Basics</option>
              <option value="defi">DeFi</option>
              <option value="nfts">NFTs</option>
              <option value="trading">Trading</option>
              <option value="development">Tech & Development</option>
              <option value="art">Art & Design</option>
              <option value="embroidery">Embroidery & Crafts</option>
              <option value="non-tech">Non-Tech</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what students will learn..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (USDC)</Label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price_usdc}
              onChange={(e) => setFormData({ ...formData, price_usdc: e.target.value })}
              placeholder="0.00 (leave 0 for free)"
              className="pl-8"
            />
          </div>
          {isPaidCourse && (
            <p className="text-xs text-muted-foreground">
              📝 0.1 USDC listing fee required for paid courses
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {thumbPreview ? (
                <div className="relative w-full h-32 mb-3 overflow-hidden rounded-md">
                  <img src={thumbPreview} alt="Thumbnail preview" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setThumbPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
                  } else {
                    setThumbPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
                  }
                }}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground">Click to upload thumbnail</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </label>
              {thumbnailFile && (
                <p className="text-xs text-primary mt-1 truncate">{thumbnailFile.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course Video</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground">Click to upload video</p>
                <p className="text-xs text-muted-foreground">MP4, WebM up to 100MB</p>
              </label>
              {videoFile && (
                <p className="text-xs text-primary mt-1">{videoFile.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 items-center">
          <Button type="submit" disabled={isProcessing} className="bg-primary hover:bg-primary/90">
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {listingStep === 'approving' ? 'Approving...' : 
                 listingStep === 'listing' ? 'Listing...' : 
                 isTxConfirming ? 'Confirming...' : 'Uploading...'}
              </span>
            ) : uploadStatus === 'uploaded' ? (
              'Uploaded ✅'
            ) : (
              'Upload Course'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          {uploadStatus === 'uploaded' && (
            <span className="text-xs text-success">Saved. Redirecting...</span>
          )}
        </div>
      </form>
    </Card>
  );
};
