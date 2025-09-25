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

interface CourseUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseUpload = ({ onSuccess, onCancel }: CourseUploadProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_usdc: '',
    category: 'web3-basics',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let thumbnail_url = null;
      let video_url = null;

      // Upload thumbnail
      if (thumbnailFile) {
        const thumbnailPath = `course-thumbnails/${user.id}/${Date.now()}-${thumbnailFile.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from('avatars')
          .upload(thumbnailPath, thumbnailFile);

        if (!thumbnailError) {
          const { data: thumbnailUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(thumbnailPath);
          thumbnail_url = thumbnailUrlData.publicUrl;
        }
      }

      // Upload video
      if (videoFile) {
        const videoPath = `course-videos/${user.id}/${Date.now()}-${videoFile.name}`;
        const { error: videoError } = await supabase.storage
          .from('avatars')
          .upload(videoPath, videoFile);

        if (!videoError) {
          const { data: videoUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(videoPath);
          video_url = videoUrlData.publicUrl;
        }
      }

      // Create course
      const { error } = await supabase.from('courses').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price_usdc: parseFloat(formData.price_usdc) || 0,
        category: formData.category,
        thumbnail_url,
        video_url,
        status: 'published',
      });

      if (error) throw error;

      toast.success('Course uploaded successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading course:', error);
      toast.error('Failed to upload course');
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
              <option value="development">Development</option>
              <option value="dao">DAO</option>
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
              placeholder="0.00"
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Course Thumbnail</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="hidden"
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                <p className="text-sm text-muted-foreground">Click to upload thumbnail</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </label>
              {thumbnailFile && (
                <p className="text-xs text-primary mt-1">{thumbnailFile.name}</p>
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

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Uploading...' : 'Upload Course'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};