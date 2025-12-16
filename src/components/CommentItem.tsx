import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, ExternalLink } from 'lucide-react';
import { CommentReactions } from '@/components/CommentReactions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface CommentItemProps {
  comment: any;
  onReplyAdded: () => void;
  isReply?: boolean;
}

export const CommentItem = ({ comment, onReplyAdded, isReply = false }: CommentItemProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      .from('course_comments')
      .insert({
        course_id: comment.course_id,
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
      onReplyAdded();
      toast({ title: "Reply posted!" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`${isReply ? 'ml-6 mt-2' : ''}`}>
      <div className="p-2 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/20 transition-colors">
        <div className="flex items-start gap-1.5">
          <Avatar className="h-7 w-7 border border-primary/20 flex-shrink-0">
            <AvatarImage src={comment.profiles?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-xs">
              {comment.profiles?.display_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold text-foreground">
                {comment.profiles?.display_name || 'Anonymous'}
              </p>
              {comment.profiles?.farcaster_username && (
                <a
                  href={getFarcasterUrl(comment.profiles.farcaster_username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                >
                  @{comment.profiles.farcaster_username.replace('@', '')}
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {comment.comment}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[9px] text-muted-foreground/70">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
              {!isReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  Reply
                </button>
              )}
            </div>
            <CommentReactions commentId={comment.id} />
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-2 ml-8 space-y-1.5">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[50px] text-xs bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReplySubmit}
                disabled={isSubmitting || !replyText.trim()}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs h-7"
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
                className="text-xs h-7"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply: any) => (
            <CommentItem
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

