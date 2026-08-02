-- 모든 프로젝트용 Storage 버킷 생성 (xmdf 삭제 시 손실된 버킷 복구)
-- Toefllandingpage + TOEFL2 + 공통 버킷

-- ============================================================
-- 1. listening-audio (공개, 50MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listening-audio', 'listening-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- ============================================================
-- 2. listening-images (공개, 10MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listening-images', 'listening-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- ============================================================
-- 3. listening-video (공개, 100MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listening-video', 'listening-video', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600;

-- ============================================================
-- 4. recordings (공개, 50MB) — 스피킹 녹음 파일
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recordings', 'recordings', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- ============================================================
-- 5. make-e46cd33a-lms-files (비공개, 50MB) — LMS 콘텐츠 파일
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('make-e46cd33a-lms-files', 'make-e46cd33a-lms-files', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800;

-- ============================================================
-- 6. toefl2-audio (공개, 50MB) — TOEFL2 오디오
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('toefl2-audio', 'toefl2-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- ============================================================
-- 7. toefl2-images (공개, 10MB) — TOEFL2 이미지
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('toefl2-images', 'toefl2-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- ============================================================
-- 8. toefl2-avatars (공개, 5MB) — TOEFL2 사용자 아바타
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('toefl2-avatars', 'toefl2-avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- ============================================================
-- RLS 정책: 모든 버킷에 공개 읽기/업로드 허용
-- ============================================================

-- listening-audio
CREATE POLICY "Public read listening-audio" ON storage.objects FOR SELECT USING (bucket_id = 'listening-audio');
CREATE POLICY "Public upload listening-audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listening-audio');
CREATE POLICY "Public manage listening-audio" ON storage.objects FOR ALL USING (bucket_id = 'listening-audio');

-- listening-images
CREATE POLICY "Public read listening-images-bucket" ON storage.objects FOR SELECT USING (bucket_id = 'listening-images');
CREATE POLICY "Public upload listening-images-bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listening-images');
CREATE POLICY "Public manage listening-images-bucket" ON storage.objects FOR ALL USING (bucket_id = 'listening-images');

-- listening-video
CREATE POLICY "Public read listening-video" ON storage.objects FOR SELECT USING (bucket_id = 'listening-video');
CREATE POLICY "Public upload listening-video" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listening-video');
CREATE POLICY "Public manage listening-video" ON storage.objects FOR ALL USING (bucket_id = 'listening-video');

-- recordings
CREATE POLICY "Public read recordings" ON storage.objects FOR SELECT USING (bucket_id = 'recordings');
CREATE POLICY "Public upload recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings');
CREATE POLICY "Public manage recordings" ON storage.objects FOR ALL USING (bucket_id = 'recordings');

-- make-e46cd33a-lms-files (비공개지만 function에서 service_role로 접근)
CREATE POLICY "Service role manage lms-files" ON storage.objects FOR ALL USING (bucket_id = 'make-e46cd33a-lms-files');
CREATE POLICY "Public read lms-files" ON storage.objects FOR SELECT USING (bucket_id = 'make-e46cd33a-lms-files');

-- toefl2-audio
CREATE POLICY "Public read toefl2-audio" ON storage.objects FOR SELECT USING (bucket_id = 'toefl2-audio');
CREATE POLICY "Public upload toefl2-audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'toefl2-audio');
CREATE POLICY "Public manage toefl2-audio" ON storage.objects FOR ALL USING (bucket_id = 'toefl2-audio');

-- toefl2-images
CREATE POLICY "Public read toefl2-images" ON storage.objects FOR SELECT USING (bucket_id = 'toefl2-images');
CREATE POLICY "Public upload toefl2-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'toefl2-images');
CREATE POLICY "Public manage toefl2-images" ON storage.objects FOR ALL USING (bucket_id = 'toefl2-images');

-- toefl2-avatars
CREATE POLICY "Public read toefl2-avatars" ON storage.objects FOR SELECT USING (bucket_id = 'toefl2-avatars');
CREATE POLICY "Public upload toefl2-avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'toefl2-avatars');
CREATE POLICY "Public manage toefl2-avatars" ON storage.objects FOR ALL USING (bucket_id = 'toefl2-avatars');
