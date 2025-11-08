-- Add parent_comment_id column for threaded replies
ALTER TABLE public.course_comments 
ADD COLUMN parent_comment_id uuid REFERENCES public.course_comments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_course_comments_parent ON public.course_comments(parent_comment_id);

-- Create index for better query performance on course_id + parent_comment_id
CREATE INDEX IF NOT EXISTS idx_course_comments_thread ON public.course_comments(course_id, parent_comment_id);