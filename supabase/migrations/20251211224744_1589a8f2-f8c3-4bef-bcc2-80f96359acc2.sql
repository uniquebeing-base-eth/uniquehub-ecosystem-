-- Create function to send notifications via edge function
CREATE OR REPLACE FUNCTION public.notify_via_edge_function(
  notification_type TEXT,
  target_user_id UUID DEFAULT NULL,
  broadcast BOOLEAN DEFAULT FALSE,
  notification_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id BIGINT;
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', notification_type,
    'target_user_id', target_user_id,
    'broadcast', broadcast,
    'data', notification_data
  );

  SELECT net.http_post(
    url := 'https://ucqcrhfcflrepsdlcvpq.supabase.co/functions/v1/send-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcWNyaGZjZmxyZXBzZGxjdnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDk4ODIsImV4cCI6MjA3NDMyNTg4Mn0.hJJJ9drHMwaYqG6l05urZGnHWPdtTaXZEBatFc-axfE"}'::JSONB,
    body := payload
  ) INTO request_id;
  
  RAISE LOG 'Notification request sent: type=%, user=%, broadcast=%, request_id=%', 
    notification_type, target_user_id, broadcast, request_id;
END;
$$;

-- Trigger function for course comments - notify course author
CREATE OR REPLACE FUNCTION public.notify_course_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_creator_id UUID;
  v_course_title TEXT;
  v_commenter_name TEXT;
BEGIN
  -- Get course creator and title
  SELECT user_id, title INTO v_course_creator_id, v_course_title
  FROM public.courses
  WHERE id = NEW.course_id;
  
  -- Get commenter name
  SELECT COALESCE(display_name, farcaster_username, 'Someone') INTO v_commenter_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Don't notify if author comments on own course
  IF v_course_creator_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Send notification to course author
  PERFORM public.notify_via_edge_function(
    'course_comment',
    v_course_creator_id,
    FALSE,
    jsonb_build_object(
      'course_title', v_course_title,
      'course_id', NEW.course_id,
      'commenter_name', v_commenter_name
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for course ratings - notify course author
CREATE OR REPLACE FUNCTION public.notify_course_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_creator_id UUID;
  v_course_title TEXT;
BEGIN
  -- Get course creator and title
  SELECT user_id, title INTO v_course_creator_id, v_course_title
  FROM public.courses
  WHERE id = NEW.course_id;
  
  -- Don't notify if author rates own course
  IF v_course_creator_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Send notification to course author
  PERFORM public.notify_via_edge_function(
    'course_rating',
    v_course_creator_id,
    FALSE,
    jsonb_build_object(
      'course_title', v_course_title,
      'course_id', NEW.course_id,
      'rating', NEW.rating
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for new published courses - notify all users
CREATE OR REPLACE FUNCTION public.notify_new_course()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name TEXT;
BEGIN
  -- Only notify when course is published (status changes to 'published')
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Get author name
    SELECT COALESCE(display_name, farcaster_username, 'A creator') INTO v_author_name
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Broadcast to all users
    PERFORM public.notify_via_edge_function(
      'new_course',
      NULL,
      TRUE,
      jsonb_build_object(
        'course_title', NEW.title,
        'course_id', NEW.id,
        'author_name', v_author_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for new marketplace items - notify all users
CREATE OR REPLACE FUNCTION public.notify_new_marketplace_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify for active items
  IF NEW.status = 'active' THEN
    PERFORM public.notify_via_edge_function(
      'new_marketplace_item',
      NULL,
      TRUE,
      jsonb_build_object(
        'item_title', NEW.title,
        'item_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for enrollment completion - notify user
CREATE OR REPLACE FUNCTION public.notify_course_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_title TEXT;
BEGIN
  -- Only notify when course is completed (completed_at is set)
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Get course title
    SELECT title INTO v_course_title
    FROM public.courses
    WHERE id = NEW.course_id;
    
    -- Notify the user who completed
    PERFORM public.notify_via_edge_function(
      'course_completion',
      NEW.user_id,
      FALSE,
      jsonb_build_object(
        'course_title', v_course_title,
        'course_id', NEW.course_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_course_comment ON public.course_comments;
CREATE TRIGGER trigger_notify_course_comment
  AFTER INSERT ON public.course_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_course_comment();

DROP TRIGGER IF EXISTS trigger_notify_course_rating ON public.course_ratings;
CREATE TRIGGER trigger_notify_course_rating
  AFTER INSERT ON public.course_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_course_rating();

DROP TRIGGER IF EXISTS trigger_notify_new_course ON public.courses;
CREATE TRIGGER trigger_notify_new_course
  AFTER INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_course();

DROP TRIGGER IF EXISTS trigger_notify_new_marketplace_item ON public.marketplace_items;
CREATE TRIGGER trigger_notify_new_marketplace_item
  AFTER INSERT ON public.marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_marketplace_item();

DROP TRIGGER IF EXISTS trigger_notify_course_completion ON public.enrollments;
CREATE TRIGGER trigger_notify_course_completion
  AFTER UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_course_completion();