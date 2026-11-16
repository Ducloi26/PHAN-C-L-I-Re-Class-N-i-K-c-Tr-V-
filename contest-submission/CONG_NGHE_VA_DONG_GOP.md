# BÁO CÁO CÔNG NGHỆ, ĐÓNG GÓP VÀ BÀI HỌC KINH NGHIỆM
**Cuộc thi:** CODE THE THANKS 2026 — Đại học Tây Nguyên  
**Dự án:** Lớp Học Ký Ức 20/11 (`lop-hoc-ky-uc-2026`)  

---

## 1. CÔNG NGHỆ THỰC TẾ ĐÃ SỬ DỤNG (TECH STACK)

| Tầng kiến trúc | Công nghệ chính | Vai trò kỹ thuật thực tế |
|---|---|---|
| **Frontend Core** | React 18, TypeScript 5.7, Vite 6.1 | Nền tảng SPA tối ưu tốc độ nạp trang, type-safety và chia nhỏ bundle |
| **Đồ họa 3D WebGL** | Three.js 0.170, `@react-three/fiber`, `@react-three/drei` | Dựng phòng học 3D, camera presets, đổ bóng mềm và render avatar low-poly |
| **Multiplayer Engine** | Cloudflare Workers + Durable Objects (`ClassroomRoom`) | Đồng bộ trạng thái phòng học thời gian thực qua WebSocket WSS (Edge computing) |
| **Database & Auth** | Supabase (PostgreSQL 15, Row-Level Security, Realtime) | Lưu trữ bền vững sổ lưu bút, lượt tặng hoa, bức tường dấu ấn; phân quyền RBAC |
| **Âm thanh kỹ thuật số** | Web Audio API (Native Browser API) | Tổng hợp âm thanh thủ tục (chuông trường, tiếng hoa, ducking BGM), 0kb asset |
| **UI Styling & Responsive**| Tailwind CSS, Lucide Icons, Canvas Confetti | Giao diện ấm áp, responsive điện thoại/máy tính, joystick ảo |
| **Hạ tầng Hosting** | Cloudflare Pages + Cloudflare Workers | Phân phối tĩnh toàn cầu tốc độ cao và xử lý logic WebSocket tại biên |

---

## 2. PHÂN ĐỊNH ĐÓNG GÓP: LẬP TRÌNH VIÊN VÀ CÔNG CỤ AI

Tuân thủ nghiêm ngặt quy định của Thể lệ cuộc thi về việc minh bạch ứng dụng AI:

### A. Đóng góp sáng tạo của Đội thi (Human Developers):
1. **Định hình ý tưởng & Trải nghiệm người dùng:** Lên concept lớp học thân quen của Đại học Tây Nguyên, xác định thông điệp tri ân và thiết kế luồng tương tác không rào cản (vào lớp ngay không bắt buộc đăng ký tài khoản).
2. **Kiến trúc hệ thống:** Thiết kế mô hình dữ liệu Single Source of Truth cho máy chiếu, phân tầng bảo mật bằng PostgreSQL Row-Level Security (RLS) để ngăn chặn khách can thiệp dữ liệu.
3. **Chuẩn hóa tỷ lệ & Vật lý 3D:** Thiết lập kích thước phòng học, vị trí 25 ghế ngồi, quy chuẩn ma trận chống đi xuyên vật thể (**Kinematic Collision**) và chống trượt xuyên bàn học (**Wall Sliding**).
4. **Kiểm thử & Tinh chỉnh thực chiến:** Tiến hành 37 ca kiểm thử chấp nhận, tối ưu hóa khung hình trên thiết bị di động, kiểm tra trải nghiệm thực tế giữa nhiều thiết bị đồng thời.

### B. Phần việc được AI hỗ trợ (Google Antigravity / Gemini):
1. **Sinh mã nguồn khung (Boilerplate & Typed Interfaces):** Hỗ trợ viết nhanh các interface TypeScript, component React và CSS Tailwind.
2. **Hỗ trợ thuật toán đồ họa:** Gợi ý ma trận tính toán góc quay camera theo góc nhìn thứ nhất / thứ ba, chuẩn hóa vector di chuyển chéo không bị tăng tốc bất thường.
3. **Thiết kế âm thanh thủ tục:** Gợi ý các dải tần số âm thanh (Hz) và bộ lọc Biquad Filter trên Web Audio API để mô phỏng tiếng chuông trường truyền thống mà không cần file MP3.
4. **Viết test tự động:** Khởi tạo test suite 37 ca kiểm thử logic và bảo mật trên Node.js Test Runner.

---

## 3. KHÓ KHĂN KỸ THUẬT VÀ GIẢI PHÁP ĐÃ ÁP DỤNG

1. **Thách thức:** Xung đột cảm ứng trên điện thoại di động khi người dùng vừa muốn di chuyển joystick vừa muốn vuốt màn hình để xoay camera.  
   *Giải pháp:* Tách biệt độc lập vùng điều khiển cảm ứng: nửa trái màn hình dành riêng cho Virtual Joystick (chuẩn hóa vector [-1, 1] kèm deadzone 8%), nửa phải dành cho Touch Camera Swipe.
2. **Thách thức:** Đảm bảo độ trễ thấp và đồng bộ máy chiếu giữa mọi người tham gia mà không vượt quá hạn mức miễn phí (Free Tier).  
   *Giải pháp:* Kết hợp Supabase Realtime cho các sự kiện dữ liệu lớn (lời chúc, hoa) và Cloudflare Durable Objects cho WebSocket tọa độ di chuyển; chỉ gửi dữ liệu khi có thay đổi vượt ngưỡng.
3. **Thách thức:** Rủi ro lộ mã khóa bí mật (Secret Key) trên trình duyệt.  
   *Giải pháp:* Phân tách tuyệt đối giữa Public Anon Key (bảo vệ bởi Postgres RLS) và Service Role Key (chỉ đặt trên Cloudflare Secrets phía máy chủ, không bao giờ nhúng vào file build frontend).

---

## 4. ĐIỀU LỚN NHẤT HỌC ĐƯỢC TRONG QUÁ TRÌNH THỰC HIỆN

> *"Chúng em nhận ra rằng công nghệ hiện đại nhất (như WebGL 3D hay Edge Multiplayer) chỉ thực sự có ý nghĩa khi phục vụ một giá trị nhân văn sâu sắc. Quá trình làm chủ và phối hợp giữa tư duy thiết kế của con người cùng năng lực tăng tốc của AI đã giúp nhóm biến một ý tưởng phức tạp thành một sản phẩm chạy thật, ổn định và đầy ắp cảm xúc chỉ trong một thời gian ngắn."*
