-- Create learning courses table
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  total_modules INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);



-- Create learning modules table
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module_number INTEGER NOT NULL,
  content JSONB,
  points_reward INTEGER DEFAULT 10,
  is_locked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user learning streaks table
CREATE TABLE IF NOT EXISTS public.user_learning_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_modules_completed INTEGER DEFAULT 0,
  streak_reset_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create module completions table
CREATE TABLE IF NOT EXISTS public.module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  points_earned INTEGER DEFAULT 0,
  accuracy_percentage INTEGER,
  time_taken_seconds INTEGER,
  UNIQUE(user_id, module_id)
);

-- Create learning pools table
CREATE TABLE IF NOT EXISTS public.learning_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  required_streak INTEGER DEFAULT 5,
  reward_amount NUMERIC DEFAULT 0,
  number_of_winners INTEGER DEFAULT 1,
  pool_modules JSONB,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pool participants table
CREATE TABLE IF NOT EXISTS public.pool_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.learning_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  rank INTEGER,
  is_winner BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pool_id, user_id)
);

-- Create pool module completions table
CREATE TABLE IF NOT EXISTS public.pool_module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.learning_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pool_id, user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_module_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_courses
CREATE POLICY "Anyone can view active courses"
  ON public.learning_courses FOR SELECT
  USING (is_active = true);

-- RLS Policies for learning_modules
CREATE POLICY "Anyone can view modules"
  ON public.learning_modules FOR SELECT
  USING (true);

-- RLS Policies for user_learning_streaks
CREATE POLICY "Users can view their own streak"
  ON public.user_learning_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
  ON public.user_learning_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON public.user_learning_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for module_completions
CREATE POLICY "Users can view their own completions"
  ON public.module_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.module_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learning_pools
CREATE POLICY "Anyone can view active pools"
  ON public.learning_pools FOR SELECT
  USING (status = 'active');

-- RLS Policies for pool_participants
CREATE POLICY "Anyone can view pool participants"
  ON public.pool_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join pools"
  ON public.pool_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pool_module_completions
CREATE POLICY "Users can view their pool completions"
  ON public.pool_module_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their pool completions"
  ON public.pool_module_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_learning_modules_course_id ON public.learning_modules(course_id);
CREATE INDEX idx_module_completions_user_id ON public.module_completions(user_id);
CREATE INDEX idx_module_completions_module_id ON public.module_completions(module_id);
CREATE INDEX idx_user_learning_streaks_user_id ON public.user_learning_streaks(user_id);
CREATE INDEX idx_pool_participants_pool_id ON public.pool_participants(pool_id);
CREATE INDEX idx_pool_participants_user_id ON public.pool_participants(user_id);
CREATE INDEX idx_pool_module_completions_pool_user ON public.pool_module_completions(pool_id, user_id);

-- Create function to update streak
CREATE OR REPLACE FUNCTION public.update_learning_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE;
  v_last_activity DATE;
  v_streak_record RECORD;
BEGIN
  v_today := CURRENT_DATE;
  
  -- Get or create streak record
  SELECT * INTO v_streak_record
  FROM public.user_learning_streaks
  WHERE user_id = NEW.user_id;
  
  IF v_streak_record IS NULL THEN
    INSERT INTO public.user_learning_streaks (user_id, current_streak, longest_streak, last_activity_date, total_modules_completed)
    VALUES (NEW.user_id, 1, 1, v_today, 1);
  ELSE
    v_last_activity := v_streak_record.last_activity_date;
    
    -- Only update if this is first completion today
    IF v_last_activity IS NULL OR v_last_activity < v_today THEN
      IF v_last_activity = v_today - INTERVAL '1 day' THEN
        -- Continue streak
        UPDATE public.user_learning_streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = v_today,
            total_modules_completed = total_modules_completed + 1,
            updated_at = now()
        WHERE user_id = NEW.user_id;
      ELSIF v_last_activity < v_today - INTERVAL '1 day' THEN
        -- Streak broken, reset to 1
        UPDATE public.user_learning_streaks
        SET current_streak = 1,
            last_activity_date = v_today,
            total_modules_completed = total_modules_completed + 1,
            streak_reset_count = streak_reset_count + 1,
            updated_at = now()
        WHERE user_id = NEW.user_id;
      ELSE
        -- Same day, just increment total
        UPDATE public.user_learning_streaks
        SET total_modules_completed = total_modules_completed + 1,
            updated_at = now()
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for streak updates
CREATE TRIGGER update_streak_on_completion
  AFTER INSERT ON public.module_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_learning_streak();

-- Create function to update pool participant points
CREATE OR REPLACE FUNCTION public.update_pool_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pool_participants
  SET total_points = total_points + NEW.points_earned,
      modules_completed = modules_completed + 1
  WHERE pool_id = NEW.pool_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for pool points updates
CREATE TRIGGER update_pool_points_on_completion
  AFTER INSERT ON public.pool_module_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pool_points();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_quest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_learning_courses_updated_at
  BEFORE UPDATE ON public.learning_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_updated_at();

CREATE TRIGGER set_learning_modules_updated_at
  BEFORE UPDATE ON public.learning_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_updated_at();

CREATE TRIGGER set_learning_pools_updated_at
  BEFORE UPDATE ON public.learning_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_updated_at();
