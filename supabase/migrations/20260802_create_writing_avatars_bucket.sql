-- writing-avatars 버킷 생성 (ContentManagement.tsx에서 참조하지만 누락됨)
-- Writing 섹션의 아바타 이미지 (교수, 학생 등) 저장용

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('writing-avatars', 'writing-avatars', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/*'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- RLS 정책: 공개 읽기/업로드 허용
CREATE POLICY "Public read writing-avatars" ON storage.objects FOR SELECT USING (bucket_id = 'writing-avatars');
CREATE POLICY "Public upload writing-avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'writing-avatars');
CREATE POLICY "Public manage writing-avatars" ON storage.objects FOR ALL USING (bucket_id = 'writing-avatars');
