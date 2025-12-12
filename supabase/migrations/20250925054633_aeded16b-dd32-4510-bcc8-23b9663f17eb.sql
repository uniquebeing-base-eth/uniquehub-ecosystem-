-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_usdc DECIMAL(10,2) DEFAULT 0.00,
  category TEXT DEFAULT 'general',
  thumbnail_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Users can view published courses" 
ON public.courses 
FOR SELECT 
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
ON public.courses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" 
ON public.courses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" 
ON public.enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" 
ON public.enrollments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update profiles table to include Farcaster data
ALTER TABLE public.profiles ADD COLUMN farcaster_username TEXT;
ALTER TABLE public.profiles ADD COLUMN farcaster_fid INTEGER;
ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT;

-- Create trigger for automatic timestamp updates on courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create marketplace_items table for NFTs
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_usdc DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'nft',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on marketplace_items
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace items
CREATE POLICY "Everyone can view active marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own marketplace items" 
ON public.marketplace_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace items" 
ON public.marketplace_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace items" 
ON public.marketplace_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for marketplace items
CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
