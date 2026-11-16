# DANH SÁCH TÍNH NĂNG MỞ RỘNG (BACKLOG)
**Dự án:** Lớp học Ký Ức — Đại học Tây Nguyên (Code The Thanks 2026)

Tài liệu này ghi nhận các tính năng ngoài phạm vi MVP (P0) đã hoàn thành, chuẩn bị cho các đợt nâng cấp tiếp theo:

---

## 1. MỨC ĐỘ ƯU TIÊN P1 (Sau khi P0 vận hành ổn định trên Production)
1. **Supabase Presence — Danh sách người đang có mặt:**
   - Sử dụng kênh Supabase Realtime Presence để hiển thị số lượng người đang trong lớp học theo thời gian thực mà không gây tải nặng cho DB.
   - Gắn nhãn tên người tham gia lên các vị trí ghế ngồi ảo.
2. **Trình phát Video YouTube trên máy chiếu:**
   - Hỗ trợ nhúng YouTube IFrame API với cơ chế tính toán độ trễ `position_sec + (now - updated_at)`.
   - Có nút "Chạm để phát" thân thiện với chính sách chặn autoplay của trình duyệt di động.
3. **Âm thanh trường học tương tác:**
   - Tiếng chuông trường học reo vào đầu giờ và tan trường (có nút bật/tắt âm thanh, mặc định tắt để không làm phiền người dùng).
   - Hiệu ứng âm thanh nhẹ khi gửi đóa hoa tri ân thành công.

---

## 2. MỨC ĐỘ ƯU TIÊN P2 (Nâng cấp sau vòng chung kết)
1. **Dựng cổng trường 3D Đại học Tây Nguyên:**
   - Dựng mô hình 3D cổng chính 567 Lê Duẩn và tượng đài biểu tượng dẫn vào lớp học dựa trên sơ đồ đã được cung cấp.
2. **Xuất Sổ Lưu Bút thành file PDF / Thiệp kỷ niệm:**
   - Cho phép Thầy Cô tải toàn bộ các lời chúc của sinh viên đã gửi theo từng khoa để lưu làm kỷ niệm ngày 20/11.

---

## 3. MỨC ĐỘ ƯU TIÊN P3 (Ý tưởng nghiên cứu dài hạn)
1. **Hỗ trợ WebXR / Kính VR:**
   - Người dùng có thể đeo kính VR (Meta Quest, Cardboard) để bước vào lớp học 3D với góc nhìn thực tế ảo 360 độ.

