

import { useState, useEffect } from 'react';
import { Heart, Sparkles, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';



interface CommentReactionsProps {
  commentId: string;
}

type ReactionType = 'blue_heart' | 'sparkles' | 'fire';


interface Reaction {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

export const CommentReactions = ({ commentId }: CommentReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([
    { type: 'blue_heart', count: 0, userReacted: false },
    { type: 'sparkles', count: 0, userReacted: false },
    { type: 'fire', count: 0, userReacted: false },
  ]);

  useEffect(() => {
    fetchReactions();
  }, [commentId]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from('course_comment_reactions')
      .select('*')
      .eq('comment_id', commentId);

    if (data) {
      const blueHeartCount = data.filter(r => r.reaction === 'blue_heart').length;
      const sparklesCount = data.filter(r => r.reaction === 'sparkles').length;
      const fireCount = data.filter(r => r.reaction === 'fire').length;

      setReactions([
        { 
          type: 'blue_heart', 
          count: blueHeartCount, 
          userReacted: user ? data.some(r => r.reaction === 'blue_heart' && r.user_id === user.id) : false 
        },
        { 
          type: 'sparkles', 
          count: sparklesCount, 
          userReacted: user ? data.some(r => r.reaction === 'sparkles' && r.user_id === user.id) : false 
        },
        { 
          type: 'fire', 
          count: fireCount, 
          userReacted: user ? data.some(r => r.reaction === 'fire' && r.user_id === user.id) : false 
        },
      ]);
    }
  };

  const toggleReaction = async (reactionType: ReactionType) => {
    if (!user) {
      toast({ title: "Please sign in to react", variant: "destructive" });
      return;
    }

    const reaction = reactions.find(r => r.type === reactionType);
    if (!reaction) return;

    if (reaction.userReacted) {
      // Remove reaction
      const { error } = await supabase
        .from('course_comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction', reactionType);

      if (!error) {
        fetchReactions();
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('course_comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction: reactionType,
        });

      if (!error) {
        fetchReactions();
      }
    }
  };

  const getIcon = (type: ReactionType) => {
    switch (type) {
      case 'blue_heart':
        return Heart;
      case 'sparkles':
        return Sparkles;
      case 'fire':
        return Flame;
    }
  };

  const getColor = (type: ReactionType, active: boolean) => {
    switch (type) {
      case 'blue_heart':
        return active 
          ? 'text-blue-500 fill-blue-500' 
          : 'text-blue-400/50 fill-blue-400/50 hover:text-blue-500 hover:fill-blue-500';
      case 'sparkles':
        return active 
          ? 'text-yellow-400 fill-yellow-400' 
          : 'text-yellow-400/50 fill-yellow-400/50 hover:text-yellow-400 hover:fill-yellow-400';
      case 'fire':
        return active 
          ? 'text-orange-500 fill-orange-500' 
          : 'text-orange-400/50 fill-orange-400/50 hover:text-orange-500 hover:fill-orange-500';
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {reactions.map((reaction) => {
        const Icon = getIcon(reaction.type);
        return (
          <button
            key={reaction.type}
            onClick={() => toggleReaction(reaction.type)}
            className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${getColor(reaction.type, reaction.userReacted)}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {reaction.count > 0 && <span>{reaction.count}</span>}
          </button>
        );
      })}
    </div>
  );
};
