# THÔNG TIN CẦN CUNG CẤP & CHECKLIST TRIỂN KHAI
**Dự án:** Lớp học Ký Ức — Trở về lớp cũ, gửi lời tri ân (20/11)  
**Đơn vị:** Trường Đại học Tây Nguyên — Cuộc thi Code The Thanks 2026

---

## 1. THÔNG TIN CẦN THIẾT KHI KẾT NỐI HỆ THỐNG THẬT

| Mục | Mục đích | Nơi lấy / Cách điền | Trạng thái hiện tại |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Kết nối backend Supabase | Supabase Dashboard > Project Settings > API | Đã có placeholder (chạy `VITE_DEMO_MODE=true` mượt mà) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Anon key an toàn cho client | Supabase Dashboard > Project Settings > API | Đã có placeholder |
| Tài khoản Admin | Đăng nhập quản trị & cấp quyền | Supabase Auth > Users (sau đó chạy lệnh bootstrap trong SQL) | Có tài khoản test sẵn trên local demo |
| Tên miền riêng (Custom Domain) | Gắn tên miền cho Cloudflare Pages | Nhà đăng ký tên miền / Cloudflare DNS | Đã có tên miền của bạn (triển khai qua `*.pages.dev` trước) |
| Ảnh kỷ niệm / sơ đồ trường | Chiếu máy chiếu 20/11 | Đã tích hợp sơ đồ Đại học Tây Nguyên (`so-do-dai-hoc-tay-nguyen.jpg`) | ĐÃ HOÀN TẤT & TÍCH HỢP |

---

## 2. CHECKLIST TỪNG BƯỚC THỰC HIỆN

### Bước 1: Khởi tạo & Giao diện 3D (MỐC A) — [ĐÃ HOÀN TẤT 100%]
- [x] Tạo dự án React + TypeScript + Vite + Tailwind CSS.
- [x] Dựng hoàn chỉnh không gian Lớp học 3D bằng Three.js + R3F: Sàn gỗ, tường, bảng phấn, máy chiếu, bục giảng, bàn ghế học sinh, cửa sổ đón nắng vàng ấm áp, lọ hoa tươi tri ân.
- [x] 4 góc camera presets mượt mà: Toàn lớp, Bảng chiếu, Bàn giáo viên, Hàng ghế.
- [x] Chế độ 2D dự phòng khi thiết bị không hỗ trợ WebGL.
- [x] Tích hợp sơ đồ Đại học Tây Nguyên (567 Lê Duẩn) vào modal chỉ dẫn chi tiết.
- [x] Build production không có lỗi TypeScript (`npm run build` PASS).

### Bước 2: Supabase Schema & Phân Quyền (MỐC B) — [ĐÃ HOÀN TẤT]
- [x] Viết file migration SQL chuẩn chỉ: `supabase/migrations/03_SUPABASE_SCHEMA.sql`.
- [x] RLS chặt chẽ cho 6 bảng: `profiles`, `user_roles`, `wishes`, `flower_gifts`, `media_items`, `projector_state`.
- [x] Anonymous Auth cho khách / học sinh; Email + Password cho Staff (Giáo viên / Admin).

### Bước 3: Sổ lưu bút & Tặng hoa (MỐC C) — [ĐÃ HOÀN TẤT]
- [x] Viết lời chúc tri ân (5–500 ký tự, validate, chống spam 8s).
- [x] Tặng hoa tri ân cho thầy cô (ràng buộc 1 hoa / thầy cô / người, hiệu ứng pháo hoa hoa tươi confetti).
- [x] Tính năng kiểm duyệt lời chúc (Staff ẩn/hiện lời chúc vi phạm).

### Bước 4: Máy chiếu chung thời gian thực (MỐC D) — [ĐÃ HOÀN TẤT]
- [x] Bảng điều khiển máy chiếu cho Giáo viên & Admin.
- [x] Bảng `projector_state` ID=1 là Single Source of Truth.
- [x] Phóng to màn chiếu 2D Overlay trên điện thoại & máy tính.
- [x] 4 slide ảnh/sơ đồ mẫu chuẩn chủ đề 20/11 Đại học Tây Nguyên.

### Bước 5: Triển khai Cloudflare Pages & Nộp bài (MỐC E)
- [ ] Đẩy code lên GitHub repository.
- [ ] Kết nối repo vào Cloudflare Pages (`npm run build` -> thư mục `dist`).
- [ ] Gắn biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Quay clip giới thiệu 20–60 giây theo kịch bản demo 4 phút.
- [ ] Nộp hồ sơ trước 20:00 ngày 17/11/2026.

