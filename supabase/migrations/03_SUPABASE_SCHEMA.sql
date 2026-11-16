-- ====================================================================
-- DỰ ÁN: LỚP HỌC KÝ ỨC — TRỞ VỀ LỚP CŨ, GỬI LỜI TRI ÂN (20/11)
-- ĐẠI HỌC TÂY NGUYÊN — CUỘC THI CODE THE THANKS 2026
-- FILE MIGRATION: 03_SUPABASE_SCHEMA.sql
-- ====================================================================

-- 1. BẬT TIỆN ÍCH EXTENSION
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. TẠO CÁC BẢNG DỮ LIỆU CỐT LÕI
-- ====================================================================

-- 2.1. BẢNG PROFILES (Thông tin người tham gia)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 2 and char_length(display_name) <= 32),
  participant_type text not null check (participant_type in ('student', 'guest')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.2. BẢNG USER_ROLES (Phân quyền người dùng - RLS kiểm tra chặt chẽ)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('member', 'teacher', 'admin')) default 'member',
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.3. BẢNG WISHES (Sổ lưu bút lời chúc tri ân 20/11)
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null check (char_length(trim(author_name)) >= 2),
  teacher_id text,
  teacher_name text,
  content text not null check (char_length(trim(content)) >= 5 and char_length(content) <= 500),
  is_hidden boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.4. BẢNG FLOWER_GIFTS (Đóa hoa tri ân - Unique 1 hoa / người gửi / giáo viên)
create table if not exists public.flower_gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id text not null,
  note text check (note is null or char_length(note) <= 100),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint unique_sender_receiver_flower unique (sender_id, receiver_id)
);

-- 2.5. BẢNG MEDIA_ITEMS (Thư viện slide & ảnh kỷ niệm)
create table if not exists public.media_items (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('image', 'youtube', 'slide')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.6. BẢNG PROJECTOR_STATE (Máy chiếu chung - Single Source of Truth ID = 1)
create table if not exists public.projector_state (
  id int primary key check (id = 1),
  media_id text references public.media_items(id) on delete set null,
  is_playing boolean default true not null,
  position_sec numeric default 0 not null,
  slide_index int default 0 not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2.7. BẢNG PRESENCE_USERS (Lưu trạng thái vị trí, góc nhìn, đứng/ngồi của người chơi trong phòng)
create table if not exists public.presence_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  room_id text not null default 'classroom_1',
  display_name text not null,
  role text not null check (role in ('member', 'teacher', 'admin')) default 'member',
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  pos_z numeric not null default 0,
  rot_y numeric not null default 0,
  state text not null check (state in ('standing', 'walking', 'sitting')) default 'standing',
  seat_id text,
  is_online boolean default true not null,
  last_seen_at timestamptz default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 3. HÀM KIỂM TRA PHÂN QUYỀN (SECURITY DEFINER)
-- ====================================================================

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user_id and role = 'admin'
  );
$$;

create or replace function public.is_teacher_or_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user_id and role in ('teacher', 'admin')
  );
$$;

-- ====================================================================
-- 4. BẬT ROW-LEVEL SECURITY (RLS) TRÊN TẤT CẢ CÁC BẢNG
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.wishes enable row level security;
alter table public.flower_gifts enable row level security;
alter table public.media_items enable row level security;
alter table public.projector_state enable row level security;
alter table public.presence_users enable row level security;

-- 4.1. POLICIES CHO PROFILES
drop policy if exists "Ai cũng đọc được profile" on public.profiles;
create policy "Ai cũng đọc được profile"
  on public.profiles for select
  using (true);

drop policy if exists "Chỉ sửa profile của chính mình" on public.profiles;
create policy "Chỉ sửa profile của chính mình"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4.2. POLICIES CHO USER_ROLES
drop policy if exists "Người dùng xem được role" on public.user_roles;
create policy "Người dùng xem được role"
  on public.user_roles for select
  using (auth.uid() is not null);

drop policy if exists "Chỉ admin cập nhật role teacher/member" on public.user_roles;
create policy "Chỉ admin cập nhật role teacher/member"
  on public.user_roles for update
  using (public.is_admin(auth.uid()))
  with check (
    public.is_admin(auth.uid()) and 
    role in ('member', 'teacher')
  );

-- 4.3. POLICIES CHO WISHES
drop policy if exists "Mọi người đọc lời chúc chưa ẩn hoặc staff xem hết" on public.wishes;
create policy "Mọi người đọc lời chúc chưa ẩn hoặc staff xem hết"
  on public.wishes for select
  using (is_hidden = false or public.is_teacher_or_admin(auth.uid()));

drop policy if exists "Khách và thành viên gửi lời chúc" on public.wishes;
create policy "Khách và thành viên gửi lời chúc"
  on public.wishes for insert
  with check (auth.uid() is not null and author_id = auth.uid());

drop policy if exists "Staff kiểm duyệt ẩn/hiện lời chúc" on public.wishes;
create policy "Staff kiểm duyệt ẩn/hiện lời chúc"
  on public.wishes for update
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

-- 4.4. POLICIES CHO FLOWER_GIFTS
drop policy if exists "Mọi người xem số lượt tặng hoa" on public.flower_gifts;
create policy "Mọi người xem số lượt tặng hoa"
  on public.flower_gifts for select
  using (true);

drop policy if exists "Thành viên tặng hoa" on public.flower_gifts;
create policy "Thành viên tặng hoa"
  on public.flower_gifts for insert
  with check (auth.uid() is not null and sender_id = auth.uid());

-- 4.5. POLICIES CHO MEDIA_ITEMS
drop policy if exists "Mọi người xem danh sách media" on public.media_items;
create policy "Mọi người xem danh sách media"
  on public.media_items for select
  using (true);

drop policy if exists "Chỉ staff thêm hoặc sửa media" on public.media_items;
create policy "Chỉ staff thêm hoặc sửa media"
  on public.media_items for all
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

-- 4.6. POLICIES CHO PROJECTOR_STATE
drop policy if exists "Mọi người xem trạng thái máy chiếu" on public.projector_state;
create policy "Mọi người xem trạng thái máy chiếu"
  on public.projector_state for select
  using (true);

drop policy if exists "Chỉ giáo viên và admin điều khiển máy chiếu" on public.projector_state;
create policy "Chỉ giáo viên và admin điều khiển máy chiếu"
  on public.projector_state for update
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

-- 4.7. POLICIES CHO PRESENCE_USERS
drop policy if exists "Mọi người xem vị trí presence_users" on public.presence_users;
create policy "Mọi người xem vị trí presence_users"
  on public.presence_users for select
  using (true);

drop policy if exists "Người chơi tự cập nhật vị trí của mình" on public.presence_users;
create policy "Người chơi tự cập nhật vị trí của mình"
  on public.presence_users for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ====================================================================
-- 5. TRIGGER TỰ ĐỘNG TẠO PROFILE VÀ ROLE KHI CÓ USER MỚI
-- ====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Tạo bản ghi role mặc định 'member'
  insert into public.user_roles (user_id, role, updated_at)
  values (new.id, 'member', now())
  on conflict (user_id) do nothing;

  -- 2. Tạo bản ghi profile mặc định
  insert into public.profiles (id, display_name, participant_type, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Khách tham quan'),
    coalesce(new.raw_user_meta_data->>'participant_type', 'guest'),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================================================
-- 6. CẤU HÌNH SUPABASE REALTIME PUBLICATION
-- ====================================================================

begin;
  alter publication supabase_realtime add table public.wishes;
  alter publication supabase_realtime add table public.flower_gifts;
  alter publication supabase_realtime add table public.projector_state;
  alter publication supabase_realtime add table public.presence_users;
commit;

-- ====================================================================
-- 7. CHÈN DỮ LIỆU KHỞI TẠO (SEED DATA)
-- ====================================================================

insert into public.media_items (id, title, kind, payload)
values
  ('media-slide-1', 'Slide 1: Ngày trở về — Lớp học Ký Ức', 'image', '{"url": "/media/slide1_ngay_tro_ve.svg", "description": "Chào mừng Thầy Cô và các bạn trở về lớp học"}'::jsonb),
  ('media-slide-2', 'Slide 2: Hành trình tri thức — Hạt giống & Mùa hoa', 'image', '{"url": "/media/slide2_hanh_trinh_tri_thuc.svg", "description": "Mỗi bài giảng là một hạt giống; mỗi thế hệ sinh viên là một mùa hoa"}'::jsonb),
  ('media-slide-3', 'Slide 3: Tri ân bằng công nghệ 20/11', 'image', '{"url": "/media/slide3_loi_tri_an.svg", "description": "Thông điệp tri ân ứng dụng công nghệ 3D và thời gian thực"}'::jsonb),
  ('media-slide-4', 'Slide 4: Sơ đồ khuôn viên Đại học Tây Nguyên', 'image', '{"url": "/media/so-do-dai-hoc-tay-nguyen.jpg", "description": "Bản đồ thực tế 567 Lê Duẩn - Phường Ea Kao, TP. Buôn Ma Thuột"}'::jsonb)
on conflict (id) do nothing;

insert into public.projector_state (id, media_id, is_playing, position_sec, slide_index)
values (1, 'media-slide-1', true, 0, 0)
on conflict (id) do nothing;

-- ====================================================================
-- 8. HƯỚNG DẪN BOOTSTRAP ADMIN BAN ĐẦU
-- UPDATE public.user_roles 
-- SET role = 'admin', updated_at = now() 
-- WHERE user_id = 'YOUR_ADMIN_UID_HERE';
-- ====================================================================
