import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MarketplaceCommentItem } from "./MarketplaceCommentItem";

interface MarketplaceItemDetailProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarketplaceItemDetail = ({ item, open, onOpenChange }: MarketplaceItemDetailProps) => {
  const { user } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && item) {
      fetchSellerInfo();
      fetchRatings();
      fetchComments();
    }
  }, [open, item]);

  const fetchSellerInfo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', item.user_id)
      .single();
    
    if (data) {
      setSeller(data);
    }
  };

  const fetchRatings = async () => {
    const { data } = await supabase
      .from('marketplace_item_ratings')
      .select('*')
      .eq('item_id', item.id);
    
    if (data && data.length > 0) {
      const avgRating = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
      setRating(avgRating);
      
      if (user) {
        const userRatingData = data.find(r => r.user_id === user.id);
        if (userRatingData) {
          setUserRating(userRatingData.rating);
        }
      }
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('marketplace_item_comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          farcaster_username,
          avatar_url
        )
      `)
      .eq('item_id', item.id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });
    
    if (data) {
      setComments(data);
    }
  };

  const handleRating = async (stars: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate this item",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('marketplace_item_ratings')
      .upsert({
        item_id: item.id,
        user_id: user.id,
        rating: stars,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      });
    } else {
      setUserRating(stars);
      fetchRatings();
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('marketplace_item_comments')
      .insert({
        item_id: item.id,
        user_id: user.id,
        comment: newComment,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    }
    setIsSubmitting(false);
  };

  const handleContactSeller = () => {
    if (seller?.farcaster_username) {
      window.open(`https://warpcast.com/${seller.farcaster_username}`, '_blank');
    } else {
      toast({
        title: "Not available",
        description: "Seller's Farcaster profile not found",
        variant: "destructive",
      });
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title}</DialogTitle>
        </DialogHeader>

        {/* Item Image */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}

        {/* Price and Category */}
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-primary">${item.price_usdc} USDC</span>
          <Badge variant="secondary">{item.category}</Badge>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">{item.description}</p>

        {/* Seller Info */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Seller Information</h3>
          {seller && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={seller.avatar_url} />
                  <AvatarFallback>{seller.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{seller.display_name}</p>
                  {seller.farcaster_username && (
                    <p className="text-sm text-muted-foreground">@{seller.farcaster_username}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleContactSeller} variant="default">
                <ExternalLink className="w-4 h-4 mr-2" />
                Contact Seller
              </Button>
            </div>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">Rating</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 cursor-pointer transition-colors ${
                    star <= (userRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => handleRating(star)}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({rating.toFixed(1)})
              </span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments.length})
          </h3>

          {/* New Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              Post Comment
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <MarketplaceCommentItem
                key={comment.id}
                comment={comment}
                onReplyAdded={fetchComments}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
