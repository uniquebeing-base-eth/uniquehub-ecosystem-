import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, DollarSign, Video, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACTS, COURSE_CONTRACT_ABI, USDC_ADDRESS, USDC_ABI } from '@/config/contracts';
import { base } from 'wagmi/chains';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';

interface CourseUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseUpload = ({ onSuccess, onCancel }: CourseUploadProps) => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { walletAddress } = useFarcasterWallet();
  const [loading, setLoading] = useState(false);
  const [listingStep, setListingStep] = useState<'idle' | 'approving' | 'listing'>('idle');
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

  const { data: txHash, writeContractAsync, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.COURSE_CONTRACT as `0x${string}`] : undefined,
  });

  React.useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const priceInUSDC = parseFloat(formData.price_usdc) || 0;
    const isPaidCourse = priceInUSDC > 0;

    // Validate wallet connection for paid courses
    if (isPaidCourse && (!isConnected || !address)) {
      toast.error('Please connect your wallet to list a paid course');
      return;
    }

    if (formData.price_usdc && priceInUSDC <= 0) {
      toast.error('Please set a valid price for your course');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');
    try {
      // Generate course ID
      const courseId = `course_${Date.now()}_${user.id.slice(0, 8)}`;

      // For paid courses, list on smart contract first with 0.1 USDC fee
      if (isPaidCourse) {
        const listingFee = parseUnits('0.1', 6); // 0.1 USDC
        const currentAllowance = (allowance as bigint) || 0n;

        // Approve USDC if needed
        if (currentAllowance < listingFee) {
          setListingStep('approving');
          toast.info('Step 1/2: Approve USDC listing fee...');
          await writeContractAsync({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [CONTRACTS.COURSE_CONTRACT as `0x${string}`, listingFee],
            account: address!,
            chain: base,
          });
          await refetchAllowance();
        }

        // List course on smart contract
        setListingStep('listing');
        toast.info(`Step 2/2: Listing course on blockchain...`);
        await writeContractAsync({
          address: CONTRACTS.COURSE_CONTRACT as `0x${string}`,
          abi: COURSE_CONTRACT_ABI,
          functionName: 'listCourse',
          args: [courseId, parseUnits(priceInUSDC.toString(), 6)],
          account: address!,
          chain: base,
        });
      }
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

      // Create course in database
      const { error } = await supabase.from('courses').insert({
        id: courseId,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price_usdc: priceInUSDC,
        category: formData.category,
        thumbnail_url,
        video_url,
        status: 'published',
      });

      if (error) throw error;

      setUploadStatus('uploaded');
      toast.success(isPaidCourse ? '🎉 Course listed on blockchain and uploaded!' : 'Course uploaded successfully!');

      // Reset form and preview
      setFormData({ title: '', description: '', price_usdc: '', category: 'web3-basics' });
      setThumbnailFile(null);
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
      setVideoFile(null);
      setListingStep('idle');

      // Close dialog and navigate to Courses
      onSuccess?.();
      window.dispatchEvent(new CustomEvent('navigate', { detail: { tab: 'courses' } }));
    } catch (error: any) {
      console.error('Error uploading course:', error);
      toast.error(error.message || 'Failed to upload course');
      setUploadStatus('idle');
      setListingStep('idle');
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="0.00 (leave empty for free)"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formData.price_usdc && parseFloat(formData.price_usdc) > 0 
              ? '⚠️ 0.1 USDC listing fee required for paid courses'
              : 'Free courses have no listing fee'}
          </p>
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
          <Button type="submit" disabled={loading || isPending || isConfirming} className="bg-primary hover:bg-primary/90">
            {(loading || isPending || isConfirming) && (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                {listingStep === 'approving' && 'Approving...'}
                {listingStep === 'listing' && 'Listing...'}
                {listingStep === 'idle' && 'Uploading...'}
              </span>
            )}
            {!loading && !isPending && !isConfirming && uploadStatus === 'uploaded' && 'Uploaded ✅'}
            {!loading && !isPending && !isConfirming && uploadStatus !== 'uploaded' && 'Upload Course'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
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