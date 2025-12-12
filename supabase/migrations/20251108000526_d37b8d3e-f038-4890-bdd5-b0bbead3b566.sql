-- Create course ratings table
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);


-- Create course comments table
CREATE TABLE IF NOT EXISTS public.course_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_ratings
CREATE POLICY "Anyone can view course ratings"
ON public.course_ratings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create ratings"
ON public.course_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.course_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON public.course_ratings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for course_comments
CREATE POLICY "Anyone can view course comments"
ON public.course_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.course_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.course_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.course_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_course_ratings_course_id ON public.course_ratings(course_id);
CREATE INDEX idx_course_ratings_user_id ON public.course_ratings(user_id);
CREATE INDEX idx_course_comments_course_id ON public.course_comments(course_id);
CREATE INDEX idx_course_comments_user_id ON public.course_comments(user_id);

-- Create trigger to update average rating in courses table
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.courses
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.course_ratings
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_course_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.course_ratings
FOR EACH ROW
EXECUTE FUNCTION update_course_rating();
