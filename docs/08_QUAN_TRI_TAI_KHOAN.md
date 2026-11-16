# Đăng nhập quản trị và duyệt giáo viên

## Quản trị viên

- Mở `/login` và đăng nhập tài khoản quản trị thật. Sau khi xác thực, ứng dụng chuyển đến `/admin`.
- Mục **Duyệt tài khoản giáo viên** cho phép duyệt, từ chối và thu hồi quyền.
- Chỉ backend xác minh được tài khoản có quyền `admin` mới được gọi các API duyệt; khách và giáo viên nhận lỗi 403.
- Không lưu mật khẩu quản trị trong mã nguồn. Tài khoản bootstrap do chủ dự án giữ thông tin đăng nhập.

## Giáo viên

1. Mở `/login`, chọn **Đăng ký tài khoản giáo viên**.
2. Nhập họ tên, khoa/đơn vị, email và mật khẩu ít nhất 10 ký tự.
3. Đợi quản trị viên duyệt. Đăng ký không tự cấp quyền và không tự xác nhận tài khoản.
4. Khi được duyệt, dùng email và mật khẩu đã đăng ký để đăng nhập; hồ sơ xuất hiện trong danh sách nhận hoa.

Quyền được lưu tại `auth.users.app_metadata.staff_role`; trạng thái đăng ký tại `teacher_status`. Hai trường này chỉ được sửa qua Supabase Auth Admin API ở backend. Thông tin tên và khoa nằm trong `user_metadata`, không quyết định quyền truy cập. Các bảng phân quyền hiện có vẫn được hỗ trợ cho tài khoản cũ; quyết định duyệt/thu hồi của luồng mới được ưu tiên.

## Cấu hình

- `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` chỉ đặt ở Worker hoặc Cloudflare Secrets.
- Đăng nhập và gia hạn phiên đi qua `/api/staff/login`, `/api/staff/refresh`; trình duyệt nhận phiên của chính người đăng nhập.
- Không đặt `sb_secret_*` trong biến `VITE_*`. Vite từ chối chạy/build khi gặp cấu hình này.
- Chỉ đăng nhập tài khoản thật qua backend; không còn tự tạo phiên admin demo từ email hoặc mật khẩu mẫu.

Luồng tài khoản sử dụng Supabase Auth, không yêu cầu chạy migration SQL để duyệt tài khoản. Bảng `teacher_profiles` trong migration 07 là lựa chọn bổ sung để đăng ký danh sách giáo viên trực tiếp, không cấp quyền đăng nhập.
