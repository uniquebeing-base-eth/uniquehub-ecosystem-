

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';


interface MarketplaceCommentItemProps {
  comment: any;
  onReplyAdded: () => void;
  isReply?: boolean;
}


export const MarketplaceCommentItem = ({ comment, onReplyAdded, isReply = false }: MarketplaceCommentItemProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);

  useEffect(() => {
    if (!isReply) {
      fetchReplies();
    }
  }, [comment.id]);

  const fetchReplies = async () => {
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
      .eq('parent_comment_id', comment.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setReplies(data);
    }
  };

  const getFarcasterUrl = (username: string) => {
    return `https://warpcast.com/${username.replace('@', '')}`;
  };

  const handleReplySubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in to reply", variant: "destructive" });
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('marketplace_item_comments')
      .insert({
        item_id: comment.item_id,
        user_id: user.id,
        comment: replyText.trim(),
        parent_comment_id: comment.id,
      });

    if (error) {
      console.error('Reply submission error:', error);
      toast({ 
        title: "Failed to post reply", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      setReplyText('');
      setShowReplyForm(false);
      fetchReplies();
      onReplyAdded();
      toast({ title: "Reply posted!" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`${isReply ? 'ml-6 mt-2' : ''}`}>
      <div className="p-3 rounded-lg bg-card border border-border">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.profiles?.avatar_url} />
            <AvatarFallback>
              {comment.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {comment.profiles?.display_name || 'Anonymous'}
              </p>
              {comment.profiles?.farcaster_username && (
                <a
                  href={getFarcasterUrl(comment.profiles.farcaster_username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80"
                >
                  @{comment.profiles.farcaster_username.replace('@', '')}
                </a>
              )}
            </div>
            <p className="text-sm text-foreground mt-1">
              {comment.comment}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
              {!isReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3 ml-11 space-y-2">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReplySubmit}
                disabled={isSubmitting || !replyText.trim()}
                size="sm"
              >
                <Send className="w-3 h-3 mr-1" />
                Reply
              </Button>
              <Button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {!isReply && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply: any) => (
            <MarketplaceCommentItem
              key={reply.id}
              comment={reply}
              onReplyAdded={onReplyAdded}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
