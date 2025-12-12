-- Add storage policies for course uploads
CREATE POLICY "Users can upload course thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'course-thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can upload course videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'course-videos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'course-thumbnails'
);

CREATE POLICY "Course videos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'course-videos'
);

