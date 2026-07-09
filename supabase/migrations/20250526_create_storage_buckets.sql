-- Create listening-audio bucket (public, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listening-audio',
  'listening-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/*']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- Create listening-images bucket (public, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listening-images',
  'listening-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/*']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Create listening-video bucket (public, 100MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listening-video',
  'listening-video',
  true,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/*']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600;

-- RLS policy: allow anyone to read (public)
CREATE POLICY "Public read listening-audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-audio');

CREATE POLICY "Public read listening-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-images');

CREATE POLICY "Public read listening-video"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-video');

-- RLS policy: allow anyone to upload (anon key can insert)
CREATE POLICY "Public upload listening-audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-audio');

CREATE POLICY "Public upload listening-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-images');

CREATE POLICY "Public upload listening-video"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-video');

-- Allow update/delete for anyone
CREATE POLICY "Public manage listening-audio"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-audio');

CREATE POLICY "Public manage listening-images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-images');

CREATE POLICY "Public manage listening-video"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-video');
