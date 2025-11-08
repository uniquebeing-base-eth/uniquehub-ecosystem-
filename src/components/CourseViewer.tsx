import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Play, BookOpen, X, Star, Send, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CourseViewerProps {
  course: any;
  onClose: () => void;
}

interface AuthorProfile {
  display_name: string | null;
  farcaster_username: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles: AuthorProfile;
}

export const CourseViewer = ({ course, onClose }: CourseViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuthorProfile();
    fetchUserRating();
    fetchComments();
  }, [course.id, course.user_id]);

  const fetchAuthorProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, farcaster_username, avatar_url')
      .eq('user_id', course.user_id)
      .single();
    
    if (data) setAuthorProfile(data);
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
        id,
        user_id,
        comment,
        created_at,
        profiles:user_id (
          display_name,
          farcaster_username,
          avatar_url
        )
      `)
      .eq('course_id', course.id)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data as any);
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
        rating
      });

    if (error) {
      toast({ title: "Failed to save rating", variant: "destructive" });
    } else {
      setUserRating(rating);
      toast({ title: "Rating saved!" });
    }
  };

  const handleSubmitComment = async () => {
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
        comment: newComment.trim()
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

  const openFarcasterProfile = (username: string) => {
    window.open(`https://warpcast.com/${username}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-0" onClick={onClose}>
      <div className="w-full max-w-lg mb-14 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Card className="rounded-t-3xl overflow-hidden bg-gradient-to-b from-card via-card to-card/95">
          {/* Header */}
          <div className="p-3 border-b border-primary/20 flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{course.title}</h3>
              <p className="text-[10px] text-muted-foreground truncate">{course.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 flex-shrink-0 ml-2 hover:bg-destructive/20"
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

          {/* Course Info - Scrollable */}
          <div className="p-4 space-y-4 max-h-[45vh] overflow-y-auto scrollbar-hide">
            {/* Author Info */}
            {authorProfile && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={authorProfile.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {authorProfile.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {authorProfile.display_name || 'Anonymous'}
                  </p>
                  {authorProfile.farcaster_username && (
                    <button
                      onClick={() => openFarcasterProfile(authorProfile.farcaster_username!)}
                      className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      @{authorProfile.farcaster_username}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      {Number(course.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">instructor</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>{course.enrollment_count || 0} students enrolled</span>
            </div>

            {/* Rating Section */}
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-xs font-semibold text-foreground mb-2">Rate this course</h4>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoveredRating || userRating)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Your rating: {userRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* About Section */}
            {course.description && (
              <div className="pt-2 border-t border-border/50">
                <h4 className="text-xs font-semibold text-foreground mb-1">About this course</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-xs font-semibold text-foreground mb-3">
                Comments ({comments.length})
              </h4>

              {/* New Comment */}
              <div className="mb-4 space-y-2">
                <Textarea
                  placeholder="Share your feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-xs bg-background/50 border-primary/20 focus:border-primary/40"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  <Send className="w-3 h-3 mr-2" />
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-background/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                        <AvatarImage src={comment.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs">
                          {comment.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">
                            {comment.profiles?.display_name || 'Anonymous'}
                          </p>
                          {comment.profiles?.farcaster_username && (
                            <button
                              onClick={() => openFarcasterProfile(comment.profiles.farcaster_username!)}
                              className="text-[9px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
                            >
                              @{comment.profiles.farcaster_username}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pl-10">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
