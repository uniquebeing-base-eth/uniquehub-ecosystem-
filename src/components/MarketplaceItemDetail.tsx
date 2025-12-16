
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, ExternalLink, X } from "lucide-react";
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

  if (!open || !item) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-0 animate-fade-in" 
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="w-full max-w-lg mb-14 max-h-[85vh] overflow-hidden animate-slide-in-bottom" 
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-t-3xl overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20">
          {/* Header */}
          <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-lg font-bold text-foreground truncate">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-primary">${item.price_usdc} USDC</span>
                <Badge variant="secondary" className="text-xs">{item.category}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0 hover:bg-primary/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Item Image */}
          {item.image_url && (
            <div className="bg-black">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Scrollable Content */}
          <div className="max-h-[40vh] overflow-y-auto scrollbar-hide">
            {/* Description */}
            {item.description && (
              <div className="p-4 border-b border-primary/10">
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )}

            {/* Seller Info */}
            <div className="p-4 border-b border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5">
              <h4 className="text-sm font-semibold text-foreground mb-3">Seller Information</h4>
              {seller && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarImage src={seller.avatar_url} />
                      <AvatarFallback className="bg-primary/20">
                        {seller.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{seller.display_name}</p>
                      {seller.farcaster_username && (
                        <p className="text-xs text-muted-foreground">@{seller.farcaster_username}</p>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleContactSeller} size="sm" className="flex-shrink-0">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Contact Seller
                  </Button>
                </div>
              )}
            </div>

            {/* Rating Section */}
            <div className="p-4 border-b border-primary/10">
              <h4 className="text-sm font-semibold text-foreground mb-2">Rating</h4>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 cursor-pointer transition-all hover:scale-110 ${
                      star <= (userRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => handleRating(star)}
                  />
                ))}
                <span className="text-xs text-muted-foreground">
                  ({rating.toFixed(1)})
                </span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Comments ({comments.length})
              </h4>

              {/* New Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-sm bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-2 mt-3">
                {comments.map((comment) => (
                  <MarketplaceCommentItem
                    key={comment.id}
                    comment={comment}
                    onReplyAdded={fetchComments}
                  />
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
