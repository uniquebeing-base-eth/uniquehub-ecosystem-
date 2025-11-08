import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Play, BookOpen, X, Star, Send, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface CourseViewerProps {
  course: any;
  onClose: () => void;
}

export const CourseViewer = ({ course, onClose }: CourseViewerProps) => {
  const { user } = useAuth();
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuthorProfile();
    fetchUserRating();
    fetchComments();
  }, [course.id]);

  const fetchAuthorProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', course.user_id)
      .single();
    setAuthorProfile(data);
  };

  const fetchUserRating = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('course_ratings')
      .select('rating')
      .eq('course_id', course.id)
      .eq('user_id', user.id)
      .single();
    if (data) setUserRating(data.rating);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('course_comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          farcaster_username,
          avatar_url
        )
      `)
      .eq('course_id', course.id)
      .order('created_at', { ascending: false });
    setComments(data || []);
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      toast({ title: "Please sign in to rate this course", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('course_ratings')
      .upsert({
        course_id: course.id,
        user_id: user.id,
        rating,
      });

    if (error) {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    } else {
      setUserRating(rating);
      toast({ title: "Rating submitted!" });
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in to comment", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('course_comments')
      .insert({
        course_id: course.id,
        user_id: user.id,
        comment: newComment.trim(),
      });

    if (error) {
      toast({ title: "Failed to post comment", variant: "destructive" });
    } else {
      setNewComment('');
      fetchComments();
      toast({ title: "Comment posted!" });
    }
    setIsSubmitting(false);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 transition-all ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            } ${
              star <= (interactive ? (hoverRating || userRating) : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
            onClick={() => interactive && handleRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  const getFarcasterUrl = (username: string) => {
    return `https://warpcast.com/${username.replace('@', '')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-0" onClick={onClose}>
      <div className="w-full max-w-lg mb-14 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="rounded-t-3xl overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20">
          {/* Header */}
          <div className="p-3 border-b border-primary/20 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{course.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(course.rating || 0)}
                <span className="text-[10px] text-muted-foreground">
                  ({course.rating?.toFixed(1) || '0.0'})
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 flex-shrink-0 ml-2 hover:bg-primary/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Player */}
          <div className="bg-black relative">
            {course.video_url ? (
              <video
                controls
                className="w-full aspect-video"
                src={course.video_url}
                poster={course.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full aspect-video bg-gradient-primary flex flex-col items-center justify-center">
                <Play className="w-12 h-12 text-white mb-2 animate-pulse" />
                <p className="text-white text-xs">No video uploaded yet</p>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[40vh] overflow-y-auto scrollbar-hide">
            {/* Author Info */}
            {authorProfile && (
              <div className="p-3 border-b border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Course Author
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/30">
                    <AvatarImage src={authorProfile.avatar_url} />
                    <AvatarFallback className="bg-primary/20">
                      {authorProfile.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {authorProfile.display_name || 'Anonymous'}
                    </p>
                    {authorProfile.farcaster_username && (
                      <a
                        href={getFarcasterUrl(authorProfile.farcaster_username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
                      >
                        @{authorProfile.farcaster_username.replace('@', '')}
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {course.enrollment_count || 0} students enrolled
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rate This Course */}
            <div className="p-3 border-b border-primary/10">
              <h4 className="text-xs font-semibold text-foreground mb-2">Rate This Course</h4>
              <div className="flex items-center gap-2">
                {renderStars(userRating, true)}
                {userRating > 0 && (
                  <span className="text-xs text-muted-foreground">Your rating: {userRating}</span>
                )}
              </div>
            </div>

            {/* About Course */}
            {course.description && (
              <div className="p-3 border-b border-primary/10">
                <h4 className="text-xs font-semibold text-foreground mb-2">About this course</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="p-3 space-y-3">
              <h4 className="text-xs font-semibold text-foreground">
                Comments ({comments.length})
              </h4>

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Share your thoughts about this course..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-xs bg-background/50 border-primary/20 focus:border-primary/50 resize-none"
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 mt-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-2.5 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8 border border-primary/20">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {comment.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
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
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {comment.comment}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
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
