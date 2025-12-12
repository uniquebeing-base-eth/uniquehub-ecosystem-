-- Add missing event types for task completions and course activities
ALTER TYPE public.point_event_type ADD VALUE IF NOT EXISTS 'task_completion';
ALTER TYPE public.point_event_type ADD VALUE IF NOT EXISTS 'course_completion';
ALTER TYPE public.point_event_type ADD VALUE IF NOT EXISTS 'course_purchase';

