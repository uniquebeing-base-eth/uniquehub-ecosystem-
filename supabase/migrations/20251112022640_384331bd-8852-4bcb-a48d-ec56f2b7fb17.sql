-- Create certificates storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('certificates', 'certificates', true, 5242880)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;

-- Storage policies for certificates
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

CREATE POLICY "Authenticated users can upload certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');