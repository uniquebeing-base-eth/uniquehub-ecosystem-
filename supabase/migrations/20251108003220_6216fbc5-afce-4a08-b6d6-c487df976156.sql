-- Create enum for reactions
DO $$ BEGIN
  CREATE TYPE public.reaction_type AS ENUM ('blue_heart', 'sparkles', 'fire');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create reactions table
CREATE TABLE IF NOT EXISTS public.course_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.course_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, reaction)
);


-- Enable RLS
ALTER TABLE public.course_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view comment reactions"
ON public.course_comment_reactions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can react to comments"
ON public.course_comment_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
ON public.course_comment_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ccr_comment_id ON public.course_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_ccr_user_id ON public.course_comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ccr_reaction ON public.course_comment_reactions(reaction);
