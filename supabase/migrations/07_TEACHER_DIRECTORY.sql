-- Danh sách giáo viên nhận hoa được đăng ký trực tiếp trong CSDL.
-- Không tạo tài khoản, không cấp quyền và không chèn giáo viên mẫu.
-- Chạy trong Supabase SQL Editor, sau đó nhập giáo viên thật bằng Table Editor.
create table if not exists public.teacher_profiles (
  id text primary key default gen_random_uuid()::text,
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 50),
  title text not null default 'Giáo viên',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.teacher_profiles enable row level security;
drop policy if exists "Xem giáo viên đang nhận hoa" on public.teacher_profiles;
create policy "Xem giáo viên đang nhận hoa"
  on public.teacher_profiles for select
  to anon, authenticated
  using (is_active = true);
grant select on public.teacher_profiles to anon, authenticated;

-- Việc thêm/sửa/xóa do quản trị viên thực hiện trong Supabase Dashboard.
-- Không cấp quyền ghi bảng cho khách hoặc người dùng thường.
revoke insert, update, delete on public.teacher_profiles from anon, authenticated;

comment on table public.teacher_profiles is 'Giáo viên thật do quản trị viên đăng ký vào danh sách nhận hoa';
comment on column public.teacher_profiles.user_id is 'Có thể liên kết tài khoản giáo viên đã được cấp quyền';
comment on column public.teacher_profiles.is_active is 'Tắt để ẩn giáo viên khỏi danh sách nhận hoa';
