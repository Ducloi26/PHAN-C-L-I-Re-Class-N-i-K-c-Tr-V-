# BỘ CÂU HỎI & ĐÁP ÁN PHẢN BIỆN VỚI BAN GIÁM KHẢO (15 CÂU HỎI TRỌNG TÂM)
**Cuộc thi:** CODE THE THANKS 2026 — Đại học Tây Nguyên  
**Dành cho:** Thành viên đội thi chuẩn bị cho 02 phút trả lời chất vấn của Ban Giám khảo tại vòng Chung kết 20/11.  

---

### Câu 1: Ý tưởng này khác biệt gì so với một website gửi thiệp hoặc một mini-game 3D thông thường?
**Trả lời:**  
- So với web thiệp truyền thống: Sản phẩm của chúng em tạo ra tính **hiện diện đồng thời (Co-presence)** và **Máy chiếu chung thời gian thực (Single Source of Truth)**. Thầy và trò cùng có mặt trong không gian lớp học, cùng nhìn thấy slide mà Thầy Cô đang chia sẻ thay vì chỉ lướt đọc tin nhắn tĩnh.
- So với game 3D thế giới mở: Sản phẩm tập trung 100% vào văn hóa lớp học Việt Nam ngày 20/11, không có yếu tố bạo lực hay cày cuốc; chạy trực tiếp trên trình duyệt web chỉ với 1 click chuột mà không cần cài đặt đồ họa nặng nề.

### Câu 2: Vì sao nhóm chỉ tập trung dựng 01 phòng học 3D mà không dựng toàn bộ khuôn viên Đại học Tây Nguyên?
**Trả lời:**  
- Nhóm ưu tiên tính hoàn thiện và sự ấm cúng theo đúng tinh thần "Trở về lớp cũ". Dựng toàn bộ khuôn viên khi chưa có sơ đồ CAD hoặc mô hình 3D thực địa chuẩn sẽ dễ dẫn đến sự thiếu chính xác hoặc làm website bị phình to dung lượng, gây giật lag trên điện thoại của người tham gia. Thay vào đó, nhóm tích hợp bản đồ khoa đào tạo 2D chính thức để người dùng dễ tra cứu.

### Câu 3: Hệ thống có thể chịu tải được bao nhiêu người cùng truy cập một lúc?
**Trả lời:**  
- Trong một phòng học 3D, hệ thống được thiết kế tối ưu cho **25 - 30 người** (tương ứng với quy mô một lớp học tiêu chuẩn) để đảm bảo không gian không bị chen chúc và duy trì 60 FPS trên điện thoại.
- Về hạ tầng máy chủ: Sử dụng **Cloudflare Durable Objects** kết hợp **Supabase PostgreSQL**, hệ thống có khả năng mở rộng (scale) thành nhiều phòng học song song, phục vụ đồng thời hàng trăm người truy cập mà không làm nghẽn tài nguyên.

### Câu 4: Cơ chế Multiplayer thời gian thực của nhóm hoạt động như thế nào?
**Trả lời:**  
- Nhóm sử dụng công nghệ **Cloudflare Workers Durable Objects** kết nối qua giao thức **WebSocket (WSS)**. Khi một người chơi di chuyển, tọa độ được gửi lên Durable Object, chuẩn hóa và broadcast tới các client khác với độ trễ dưới 20ms. Phía client sử dụng thuật toán nội suy tuyến tính (Linear Interpolation - Lerp 0.25) giúp chuyển động của các nhân vật luôn mượt mà.

### Câu 5: Vì sao người dùng vãng lai (khách/sinh viên) không cần đăng ký tài khoản mà vẫn vào lớp được?
**Trả lời:**  
- Mục tiêu của ngày 20/11 là không tạo rào cản cảm xúc. Nếu bắt buộc đăng ký tài khoản, xác minh email thì người dùng rất dễ nản lòng. 
- Nhóm giải quyết bài toán này bằng **Cơ chế Phiên Khách Mật Mã (Cryptographic Guest Session)**: Khi nhập tên, máy chủ sinh ra một token HMAC-SHA256 lưu tạm thời. Token này chỉ cấp quyền `member` (không có quyền quản trị), vừa tiện lợi cho người dùng vừa đảm bảo an toàn hệ thống.

### Câu 6: Làm thế nào để nhóm ngăn chặn việc người xấu gửi lời chúc rác, spam hoặc phá hoại máy chiếu?
**Trả lời:**  
- **Về lời chúc:** Hệ thống áp dụng 3 lớp bảo vệ: (1) Kiểm tra độ dài 5-500 ký tự và escape chống mã độc XSS; (2) Cơ chế Throttle chặn gửi liên tục trong 8 giây; (3) Giáo viên và Ban Quản trị có nút "Ẩn lời chúc vi phạm" ngay lập tức.
- **Về máy chiếu:** Phân quyền nghiêm ngặt bằng **Postgres Row-Level Security (RLS)**. Bảng `projector_state` chỉ cho phép UPDATE từ tài khoản có role `teacher` hoặc `admin`. Người dùng khách cố tình can thiệp API sẽ bị database từ chối với mã lỗi 42501.

### Câu 7: Phân quyền Thầy Cô và Ban Quản trị được thiết lập ra sao?
**Trả lời:**  
- Tài khoản Thầy Cô và Admin phải đăng nhập bằng Email/Mật khẩu chính thức. Quyền hạn được lưu trong bảng bảo mật `user_roles` trên cơ sở dữ liệu và được thẩm định bằng hàm PostgreSQL `is_teacher_or_admin()`. Quyền này không dựa vào dữ liệu do client gửi lên, ngăn chặn triệt để hành vi giả mạo quyền trên trình duyệt.

### Câu 8: Dữ liệu lời chúc, lượt tặng hoa và dấu ấn kỷ niệm được lưu trữ ở đâu?
**Trả lời:**  
- Toàn bộ dữ liệu được lưu trữ bền vững trên **Cơ sở dữ liệu Supabase PostgreSQL 15** với 4 bảng chính: `wishes` (lời chúc), `flowers` (hoa tri ân), `memory_marks` (dấu ấn kỷ niệm) và `projector_state` (trạng thái máy chiếu). Nhóm cũng đã phát triển script tự động sao lưu dữ liệu ra file JSON định kỳ.

### Câu 9: Bức tường dấu ấn ("Chúng ta đã từng ở đây") mang ý nghĩa gì và lưu giữ được bao lâu?
**Trả lời:**  
- Bức tường ở cuối lớp học là nơi mỗi sinh viên có thể để lại một tấm thẻ kỷ niệm gồm biểu tượng, màu sắc và lời nhắn nhủ gửi tới tương lai. Dữ liệu này được lưu vĩnh viễn trên cơ sở dữ liệu, đóng vai trò như một "khoang ký ức thời gian" (Time Capsule) để nhiều năm sau các bạn quay lại vẫn thấy dấu ấn của mình ở đó.

### Câu 10: Nếu mạng hội trường hoặc đường truyền Internet bị chập chờn thì nhóm xử lý thế nào?
**Trả lời:**  
- Nhóm đã chuẩn bị 3 phương án dự phòng kỹ thuật:
  1. *Reconnect tự động:* Client tự động lắng nghe sự kiện mạng và nạp lại trạng thái mới nhất ngay khi có mạng trở lại.
  2. *Chế độ 2D Fallback:* Giúp người dùng trên thiết bị yếu hoặc mạng chậm vẫn xem được máy chiếu và gửi lời chúc.
  3. *Chế độ Demo Cục bộ (`VITE_DEMO_MODE=true`):* Chạy độc lập trên localhost để phục vụ thuyết trình trơn tru ngay cả khi mất mạng hoàn toàn.

### Câu 11: Nhóm đã sử dụng công cụ AI ở những khâu nào?
**Trả lời:**  
- Nhóm sử dụng AI như một trợ lý lập trình (AI Coding Agent):
  - Hỗ trợ sinh mã nguồn boilerplate cho giao diện và TypeScript types.
  - Gợi ý thuật toán tính toán ma trận camera 3D và tần số âm thanh Web Audio API.
  - Tự động hóa viết test suite 37 ca kiểm thử logic và bảo mật.
  - Nhóm hoàn toàn minh bạch và tuân thủ Thể lệ cuộc thi về việc sử dụng AI có trách nhiệm.

### Câu 12: Phần nào là đóng góp sáng tạo thực chất của các thành viên trong đội?
**Trả lời:**  
- Toàn bộ bài toán nghiệp vụ, bối cảnh lớp học Đại học Tây Nguyên, thông điệp tri ân, cấu trúc database, cơ chế phân quyền RLS, thuật toán chống đi xuyên bàn ghế và việc trực tiếp kiểm thử trên các thiết bị đều do nhóm tự tay lên ý tưởng, chỉ đạo và hoàn thiện. AI chỉ đóng vai trò công cụ thực thi và tăng tốc tiến độ.

### Câu 13: Các tài nguyên âm thanh và mô hình 3D có vi phạm bản quyền không?
**Trả lời:**  
- Hoàn toàn không vi phạm:
  - *Mô hình 3D:* Được dựng bằng các khối hình học lập trình thủ công (Three.js primitive geometries), không sử dụng model tải lậu từ bên ngoài.
  - *Âm thanh:* 100% được tổng hợp từ mã nguồn thông qua **Web Audio API** (tạo dao động sóng sin và tam giác), không dùng các bản thu âm MP3 có bản quyền.
  - *Hình ảnh:* Sử dụng các tài nguyên mở và ảnh đồ họa vector do nhóm tự thiết kế.

### Câu 14: Ảnh chụp từ tính năng Photo Booth có bị tải lên máy chủ gây lộ dữ liệu cá nhân không?
**Trả lời:**  
- Không. Tính năng "Chụp ảnh lớp học" hoạt động theo nguyên tắc **Client-side Isolation**: toàn bộ quá trình trích xuất khung hình 3D, đóng khung viền vàng Đại học Tây Nguyên và tạo file PNG đều thực hiện 100% trong bộ nhớ trình duyệt máy khách, sau đó tải thẳng về máy người dùng mà không truyền bất kỳ hình ảnh nào về máy chủ.

### Câu 15: Hướng phát triển của sản phẩm sau cuộc thi 20/11 là gì?
**Trả lời:**  
- Nhóm định hướng 3 tính năng mở rộng (ghi nhận trong Backlog):
  1. *Xuất Sổ Lưu Bút thành file PDF/Thiệp in:* Cho phép Thầy Cô tải toàn bộ lời chúc của sinh viên theo từng khoa để lưu làm kỷ niệm.
  2. *Hỗ trợ Kính VR / WebXR:* Cho phép cựu sinh viên đeo kính VR để "bước chân" vào lớp học với góc nhìn 360 độ chân thực.
  3. *Mở rộng thành Hội trường 400 chỗ:* Để phục vụ các buổi lễ kỷ niệm truyền thống cấp Trường trong tương lai.
