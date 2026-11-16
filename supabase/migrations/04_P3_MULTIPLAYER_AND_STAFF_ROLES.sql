-- ====================================================================
-- DỰ ÁN: LỚP HỌC KÝ ỨC — ĐẠI HỌC TÂY NGUYÊN (20/11)
-- FILE MIGRATION P3: 04_P3_MULTIPLAYER_AND_STAFF_ROLES.sql
-- Triển khai Multiplayer thật, Staff Authentication và Phân quyền DB
-- ====================================================================

-- 1. BẬT EXTENSION PGCRYPTO
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU CHÍNH P3
-- ====================================================================

-- 2.1. BẢNG ROOMS (Phòng học ảo 3D)
create table if not exists public.rooms (
  id text primary key,
  name text not null default 'Lớp Học Ký Ức 20/11',
  is_active boolean default true not null,
  max_players int default 50 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Seed phòng mặc định
insert into public.rooms (id, name, is_active, max_players)
values ('classroom_1', 'Lớp Học Ký Ức 20/11 — Đại học Tây Nguyên', true, 50)
on conflict (id) do update set is_active = true;

-- 2.2. BẢNG STAFF_PROFILES (Dành riêng cho Giáo viên & Admin có Supabase Auth)
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 2 and char_length(display_name) <= 50),
  role text not null check (role in ('teacher', 'admin')),
  avatar_id text not null default 'student-male-1',
  avatar_config jsonb not null default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.3. BẢNG PROJECTOR_MEDIA (Kho tài liệu trình chiếu máy chiếu)
create table if not exists public.projector_media (
  id text primary key,
  type text not null check (type in ('image', 'youtube', 'slide')),
  title text not null,
  url_or_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.4. BẢNG PROJECTOR_STATE (Trạng thái đồng bộ máy chiếu theo phòng)
create table if not exists public.projector_state (
  room_id text primary key references public.rooms(id) on delete cascade,
  media_id text references public.projector_media(id) on delete set null,
  playback_state text not null check (playback_state in ('playing', 'paused', 'stopped')) default 'playing',
  playback_position numeric default 0 not null,
  slide_index int default 0 not null,
  changed_at timestamptz default timezone('utc'::text, now()) not null,
  changed_by uuid references auth.users(id) on delete set null
);

-- Seed máy chiếu cho classroom_1
insert into public.projector_media (id, type, title, url_or_path, metadata)
values 
  ('media-slide-1', 'slide', 'Slide 1: Ngày trở về — Lớp học Ký Ức', '/media/slide1_ngay_tro_ve.svg', '{"description": "Chào mừng Thầy Cô và các bạn trở về lớp học"}'::jsonb),
  ('media-slide-2', 'slide', 'Slide 2: Hành trình tri thức — Hạt giống & Mùa hoa', '/media/slide2_hanh_trinh_tri_thuc.svg', '{"description": "Mỗi bài giảng là một hạt giống"}'::jsonb),
  ('media-slide-3', 'slide', 'Slide 3: Tri ân bằng công nghệ 20/11', '/media/slide3_loi_tri_an.svg', '{"description": "Thông điệp tri ân công nghệ"}'::jsonb),
  ('media-slide-4', 'image', 'Slide 4: Sơ đồ khuôn viên Đại học Tây Nguyên', '/media/so-do-dai-hoc-tay-nguyen.jpg', '{"description": "567 Lê Duẩn - Phường Ea Kao"}'::jsonb)
on conflict (id) do nothing;

insert into public.projector_state (room_id, media_id, playback_state, playback_position, slide_index)
values ('classroom_1', 'media-slide-1', 'playing', 0, 0)
on conflict (room_id) do nothing;

-- 2.5. BẢNG WISHES (Hỗ trợ cả Khách vãng lai lẫn Staff)
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'classroom_1' references public.rooms(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null, -- null nếu là Khách
  session_id text,                                             -- mã guest session
  author_name text not null check (char_length(trim(author_name)) >= 2 and char_length(author_name) <= 32),
  teacher_id text,
  teacher_name text,
  content text not null check (char_length(trim(content)) >= 5 and char_length(content) <= 500),
  moderation_status text not null check (moderation_status in ('pending', 'approved', 'hidden')) default 'approved',
  is_hidden boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.6. BẢNG FLOWER_GIFTS (Đóa hoa tri ân gửi Thầy Cô)
create table if not exists public.flower_gifts (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'classroom_1' references public.rooms(id) on delete cascade,
  sender_session_id text not null,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  receiver_id text not null,
  flower_type text not null default 'rose',
  note text check (note is null or char_length(note) <= 100),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_flower_per_sender_receiver unique (room_id, sender_session_id, receiver_id)
);

-- 2.7. BẢNG SEAT_OCCUPANCY (Đồng bộ chỗ ngồi thời gian thực & giải phóng nguyên tử)
create table if not exists public.seat_occupancy (
  room_id text not null references public.rooms(id) on delete cascade,
  seat_id text not null,
  session_id text not null,
  player_name text not null,
  lease_expires_at timestamptz not null,
  primary key (room_id, seat_id)
);

-- 2.8. BẢNG MEMORY_MARKS (Điểm ký ức 3D chuẩn bị cho P4)
create table if not exists public.memory_marks (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'classroom_1' references public.rooms(id) on delete cascade,
  pos_x numeric not null,
  pos_y numeric not null,
  pos_z numeric not null,
  title text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 3. HÀM PHÂN QUYỀN SECURITY DEFINER
-- ====================================================================

create or replace function public.is_admin(check_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = check_uid and role = 'admin'
  );
$$;

create or replace function public.is_teacher_or_admin(check_uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = check_uid and role in ('teacher', 'admin')
  );
$$;

-- ====================================================================
-- 4. BẬT ROW LEVEL SECURITY (RLS) & THIẾT LẬP CHÍNH SÁCH
-- ====================================================================

alter table public.rooms enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.projector_media enable row level security;
alter table public.projector_state enable row level security;
alter table public.wishes enable row level security;
alter table public.flower_gifts enable row level security;
alter table public.seat_occupancy enable row level security;
alter table public.memory_marks enable row level security;

-- 4.1. Rooms
drop policy if exists "Ai cũng đọc được phòng đang mở" on public.rooms;
create policy "Ai cũng đọc được phòng đang mở"
  on public.rooms for select
  using (is_active = true);

-- 4.2. Staff Profiles
drop policy if exists "Ai cũng đọc được danh sách giáo viên & admin" on public.staff_profiles;
create policy "Ai cũng đọc được danh sách giáo viên & admin"
  on public.staff_profiles for select
  using (true);

drop policy if exists "Chỉ admin cập nhật profile staff" on public.staff_profiles;
create policy "Chỉ admin cập nhật profile staff"
  on public.staff_profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 4.3. Projector Media & State
drop policy if exists "Ai cũng xem được media máy chiếu" on public.projector_media;
create policy "Ai cũng xem được media máy chiếu"
  on public.projector_media for select
  using (true);

drop policy if exists "Chỉ staff thêm/sửa media máy chiếu" on public.projector_media;
create policy "Chỉ staff thêm/sửa media máy chiếu"
  on public.projector_media for all
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

drop policy if exists "Ai cũng xem được trạng thái máy chiếu" on public.projector_state;
create policy "Ai cũng xem được trạng thái máy chiếu"
  on public.projector_state for select
  using (true);

drop policy if exists "Chỉ staff điều khiển máy chiếu" on public.projector_state;
create policy "Chỉ staff điều khiển máy chiếu"
  on public.projector_state for update
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

-- 4.4. Wishes
drop policy if exists "Xem lời chúc hợp lệ" on public.wishes;
create policy "Xem lời chúc hợp lệ"
  on public.wishes for select
  using (moderation_status = 'approved' and is_hidden = false or public.is_teacher_or_admin(auth.uid()));

drop policy if exists "Khách và thành viên gửi lời chúc" on public.wishes;
create policy "Khách và thành viên gửi lời chúc"
  on public.wishes for insert
  with check (char_length(trim(content)) >= 5);

drop policy if exists "Staff kiểm duyệt lời chúc" on public.wishes;
create policy "Staff kiểm duyệt lời chúc"
  on public.wishes for update
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

-- 4.5. Flower gifts & Seat occupancy
drop policy if exists "Xem danh sách tặng hoa" on public.flower_gifts;
create policy "Xem danh sách tặng hoa"
  on public.flower_gifts for select
  using (true);

drop policy if exists "Ai cũng xem chỗ ngồi" on public.seat_occupancy;
create policy "Ai cũng xem chỗ ngồi"
  on public.seat_occupancy for select
  using (true);

-- ====================================================================
-- 5. BẬT SUPABASE REALTIME
-- ====================================================================

begin;
  alter publication supabase_realtime add table public.rooms;
  alter publication supabase_realtime add table public.staff_profiles;
  alter publication supabase_realtime add table public.projector_state;
  alter publication supabase_realtime add table public.wishes;
  alter publication supabase_realtime add table public.flower_gifts;
commit;

