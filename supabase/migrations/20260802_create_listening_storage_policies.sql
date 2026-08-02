-- listening-images 버킷 RLS 정책 (rpx에 누락됨)
-- 공개 읽기/업로드 허용

CREATE POLICY "Public read listening-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listening-images');

CREATE POLICY "Public upload listening-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listening-images');

CREATE POLICY "Public manage listening-images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'listening-images');
