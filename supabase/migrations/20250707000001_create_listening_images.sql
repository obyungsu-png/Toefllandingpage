create table if not exists public.listening_images (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  category text not null,
  label text not null,
  created_at timestamp with time zone default now()
);

comment on table public.listening_images is 'Listening/Speaking question reusable image assets';

alter table public.listening_images enable row level security;

-- 익명/인증 사용자 모두 읽기 가능
create policy "Allow public read listening_images" on public.listening_images
  for select to anon, authenticated using (true);

-- 익명/인증 사용자 모두 추가 가능
create policy "Allow public insert listening_images" on public.listening_images
  for insert to anon, authenticated with check (true);
