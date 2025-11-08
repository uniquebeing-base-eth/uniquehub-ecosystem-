-- Create marketplace item ratings table
CREATE TABLE public.marketplace_item_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace item comments table
CREATE TABLE public.marketplace_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace item comment reactions table
CREATE TABLE public.marketplace_item_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_item_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_item_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Anyone can view marketplace item ratings"
  ON public.marketplace_item_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON public.marketplace_item_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.marketplace_item_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.marketplace_item_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view marketplace item comments"
  ON public.marketplace_item_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.marketplace_item_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.marketplace_item_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.marketplace_item_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comment reactions
CREATE POLICY "Anyone can view comment reactions"
  ON public.marketplace_item_comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can react to comments"
  ON public.marketplace_item_comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON public.marketplace_item_comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_marketplace_item_ratings_updated_at
  BEFORE UPDATE ON public.marketplace_item_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_item_comments_updated_at
  BEFORE UPDATE ON public.marketplace_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add average rating to marketplace_items table
ALTER TABLE public.marketplace_items ADD COLUMN rating NUMERIC DEFAULT 0.00;

-- Create function to update marketplace item rating
CREATE OR REPLACE FUNCTION public.update_marketplace_item_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.marketplace_items
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.marketplace_item_ratings
    WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
  )
  WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update rating on insert/update/delete
CREATE TRIGGER update_marketplace_item_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_item_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_item_rating();