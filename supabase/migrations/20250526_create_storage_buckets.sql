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

-- RLS policy: allow anyone to read (public)
CREATE POLICY IF NOT EXISTS "Public read listening-audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-audio');

CREATE POLICY IF NOT EXISTS "Public read listening-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-images');

-- RLS policy: allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Auth upload listening-audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-audio');

CREATE POLICY IF NOT EXISTS "Auth upload listening-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-images');

-- Allow update/delete for authenticated
CREATE POLICY IF NOT EXISTS "Auth manage listening-audio"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-audio');

CREATE POLICY IF NOT EXISTS "Auth manage listening-images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-images');
