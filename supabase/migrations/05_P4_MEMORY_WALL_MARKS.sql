-- ====================================================================
-- DỰ ÁN: LỚP HỌC KÝ ỨC — ĐẠI HỌC TÂY NGUYÊN (20/11)
-- FILE MIGRATION P4: 05_P4_MEMORY_WALL_MARKS.sql
-- Bức Tường Dấu Ấn Kỷ Niệm: "Chúng ta đã từng ở đây"
-- ====================================================================

create extension if not exists "pgcrypto";

-- 1. TẠO / CẬP NHẬT BẢNG MEMORY_MARKS
create table if not exists public.memory_marks (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'classroom_1' references public.rooms(id) on delete cascade,
  session_id text not null,
  display_name text not null check (char_length(trim(display_name)) >= 2 and char_length(display_name) <= 50),
  avatar_id text default 'student-male-1',
  symbol text not null check (symbol in ('heart', 'sunflower', 'rose', 'star', 'book', 'grad_cap')) default 'heart',
  card_color text not null default '#fef3c7',
  message text not null check (char_length(trim(message)) >= 5 and char_length(message) <= 300),
  moderation_status text not null check (moderation_status in ('pending', 'approved', 'hidden', 'rejected')) default 'approved',
  pin_x numeric default 0,
  pin_y numeric default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  approved_at timestamptz default timezone('utc'::text, now()),
  approved_by uuid references auth.users(id) on delete set null
);

-- Nếu bảng đã tồn tại từ P3 migration thì thêm các cột nếu chưa có:
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'symbol') then
    alter table public.memory_marks add column symbol text not null default 'heart';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'card_color') then
    alter table public.memory_marks add column card_color text not null default '#fef3c7';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'moderation_status') then
    alter table public.memory_marks add column moderation_status text not null default 'approved';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'message') then
    alter table public.memory_marks add column message text;
    update public.memory_marks set message = coalesce(description, title, 'Dấu ấn kỷ niệm 20/11');
    alter table public.memory_marks alter column message set not null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'display_name') then
    alter table public.memory_marks add column display_name text not null default 'Cựu sinh viên';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'session_id') then
    alter table public.memory_marks add column session_id text not null default 'legacy_session';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'memory_marks' and column_name = 'approved_at') then
    alter table public.memory_marks add column approved_at timestamptz default timezone('utc'::text, now());
  end if;
end $$;

-- 2. SEED DỮ LIỆU DẤU ẤN MẪU ĐẠI HỌC TÂY NGUYÊN
insert into public.memory_marks (room_id, session_id, display_name, symbol, card_color, message, moderation_status)
values
  ('classroom_1', 'seed_1', 'Cựu sinh viên K18', 'heart', '#fef3c7', 'Kính chúc các Thầy Cô Khoa Sư Phạm luôn tràn đầy nhiệt huyết và sức khỏe! 20/11 nhớ lớp xưa nhiều lắm.', 'approved'),
  ('classroom_1', 'seed_2', 'Lớp Trưởng K21 - CNTT', 'grad_cap', '#e0f2fe', 'Đại học Tây Nguyên mãi là thanh xuân rực rỡ nhất của chúng em. Cảm ơn Thầy Cô đã chắp cánh ước mơ!', 'approved'),
  ('classroom_1', 'seed_3', 'Nhóm Nghiên Cứu Trẻ', 'star', '#d1fae5', 'Mỗi hạt giống tri thức gieo trên mảnh đất Tây Nguyên hôm nay sẽ nở hoa vào ngày mai. Tri ân Thầy Cô!', 'approved'),
  ('classroom_1', 'seed_4', 'Nguyễn Thị Mai', 'sunflower', '#ffedd5', 'Dù mai này đi muôn nơi, chúng ta vẫn có một lớp học để trở về! Chúc cả lớp luôn gắn kết.', 'approved')
on conflict do nothing;

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.memory_marks enable row level security;

drop policy if exists "Ai cung xem duoc dau an da duyet" on public.memory_marks;
create policy "Ai cung xem duoc dau an da duyet"
  on public.memory_marks for select
  using (moderation_status = 'approved' or public.is_teacher_or_admin(auth.uid()));

drop policy if exists "Khach va thanh vien tao dau an" on public.memory_marks;
create policy "Khach va thanh vien tao dau an"
  on public.memory_marks for insert
  with check (char_length(trim(message)) >= 5 and char_length(trim(message)) <= 300);

drop policy if exists "Staff kiem duyet dau an" on public.memory_marks;
create policy "Staff kiem duyet dau an"
  on public.memory_marks for update
  using (public.is_teacher_or_admin(auth.uid()))
  with check (public.is_teacher_or_admin(auth.uid()));

drop policy if exists "Admin xoa dau an vi pham" on public.memory_marks;
create policy "Admin xoa dau an vi pham"
  on public.memory_marks for delete
  using (public.is_admin(auth.uid()));

-- 4. KÍCH HOẠT SUPABASE REALTIME CHO MEMORY_MARKS
begin;
  alter publication supabase_realtime add table public.memory_marks;
commit;

