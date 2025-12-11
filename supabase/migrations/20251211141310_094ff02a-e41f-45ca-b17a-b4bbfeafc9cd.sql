-- Create course_modules table for organizing lessons into groups
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_lessons table for individual videos within modules
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  lesson_order INTEGER NOT NULL DEFAULT 1,
  is_preview BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',
  moderation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lesson_completions table for tracking progress per lesson
CREATE TABLE public.lesson_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on all tables
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_modules
CREATE POLICY "Anyone can view modules of published courses"
ON public.course_modules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_modules.course_id 
    AND (courses.status = 'published' OR courses.user_id = auth.uid())
  )
);

CREATE POLICY "Course owners can manage their modules"
ON public.course_modules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_modules.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- RLS policies for course_lessons
CREATE POLICY "Anyone can view approved lessons of published courses"
ON public.course_lessons FOR SELECT
USING (
  (moderation_status = 'approved' OR is_preview = true) AND
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_lessons.course_id 
    AND courses.status = 'published'
  )
  OR EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_lessons.course_id 
    AND courses.user_id = auth.uid()
  )
);

CREATE POLICY "Course owners can manage their lessons"
ON public.course_lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = course_lessons.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- RLS policies for lesson_completions
CREATE POLICY "Users can view their own lesson progress"
ON public.lesson_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own lesson progress"
ON public.lesson_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress"
ON public.lesson_completions FOR UPDATE
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_lesson_completions_user_course ON public.lesson_completions(user_id, course_id);

-- Create trigger for updated_at
CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
BEFORE UPDATE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();