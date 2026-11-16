# Danh sách giáo viên nhận hoa

Danh sách không sử dụng tên hoặc số hoa mẫu. API `/api/teachers` chỉ trả về:

- Tài khoản đăng ký giáo viên đã được admin duyệt. Quyền và trạng thái được lưu trong `auth.users.app_metadata` do backend quản lý; người dùng không tự sửa được quyền này.
- Giáo viên do quản trị viên nhập trong `teacher_profiles`, có `is_active = true`.
- Tài khoản có `role = 'teacher'` trong `staff_profiles`.
- Tài khoản được cấp quyền `teacher` trong `user_roles`, có tên trong `profiles`, nếu chưa có hồ sơ trong `staff_profiles`.

Lượt hoa mới được lưu bằng giao dịch trong Durable Object của phòng. API cộng số liệu mới với các bản ghi `flower_gifts` thật nếu CSDL cũ có bảng này; không lấy số mặc định từ dữ liệu mẫu. Tổng hoa lịch sử trong trang quản trị đọc trực tiếp từ storage phòng.

## Đăng ký giáo viên trực tiếp trong CSDL

1. Chạy `supabase/migrations/07_TEACHER_DIRECTORY.sql` trong SQL Editor của Supabase.
2. Mở Table Editor → `teacher_profiles` → Insert row.
3. Nhập `display_name` (tên thật), `title` (khoa/chức danh). `id` được tạo tự động; có thể điền `user_id` nếu liên kết tài khoản giáo viên.
4. Để `is_active = true`. Không cần nhập số hoa.
5. Mở lại hộp tặng hoa để tải danh sách mới. Đặt `is_active = false` để ngừng nhận hoa.

Đăng ký trong bảng này chỉ cho phép xuất hiện trong danh sách nhận hoa; không tự cấp quyền giáo viên hay quản trị cho tài khoản.

Nếu sử dụng phân quyền tài khoản có sẵn, cập nhật hồ sơ và quyền trong `staff_profiles` hoặc `user_roles` theo schema tương ứng của dự án. Khách thông thường và tài khoản chỉ có quyền `admin` không tự được thêm vào danh sách giáo viên.

Luồng đăng ký và duyệt tài khoản hoạt động qua Supabase Auth kể cả khi chưa tạo các bảng SQL bổ sung. Giáo viên mở `/login` → Đăng ký tài khoản giáo viên; admin mở `/admin` để duyệt. Tài khoản đang chờ duyệt, bị từ chối hoặc bị thu hồi không xuất hiện trong danh sách nhận hoa.

Nếu API lỗi, giao diện hiển thị thông báo và khóa nút gửi hoa. Danh sách rỗng được giữ nguyên, không thay bằng giáo viên mẫu.
