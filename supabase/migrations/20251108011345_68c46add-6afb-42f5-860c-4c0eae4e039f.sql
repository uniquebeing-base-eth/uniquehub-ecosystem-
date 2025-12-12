-- Create task completions table
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, task_id)
);

-- Enable RLS
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own task completions"
ON public.task_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task completions"
ON public.task_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_task_completions_user_task ON public.task_completions(user_id, task_id);

