# KỊCH BẢN VIDEO DEMO DỰ PHÒNG TOÀN DIỆN (03 PHÚT)
**Cuộc thi:** CODE THE THANKS 2026 — Đại học Tây Nguyên  
**Mục đích:** Video minh chứng kỹ thuật nộp kèm hồ sơ ngày 17/11 và làm phương án dự phòng khi trình chiếu tại đêm Gala nếu mạng hội trường gặp sự cố.  
**Thời lượng tối đa:** 03 phút (180 giây)  
**Nguyên tắc:** Quay 100% màn hình thao tác thực tế, không dùng kỹ xảo đồ họa mô phỏng tính năng chưa có.  

---

## 1. TIẾN TRÌNH THAO TÁC 10 BƯỚC LIỀN MẠCH

| Mốc thời gian | Tên bước thao tác | Thao tác thực tế trên màn hình | Lời thuyết minh kỹ thuật |
|---|---|---|---|
| **00:00 – 00:20** (20s) | **Bước 1: Khởi động & Vào lớp ẩn danh** | Mở trình duyệt tại đường dẫn sản phẩm. Hiển thị cổng trường ĐH Tây Nguyên. Nhập tên *"Cựu SV K44"*, chọn avatar nữ áo xanh. Bấm *"Vào lớp học ngay"*. | *"Người tham quan không cần đăng ký tài khoản phức tạp. Hệ thống tự động cấp phát token bảo mật HMAC tại Cloudflare Edge và đưa người dùng vào lớp học 3D ngay lập tức."* |
| **00:20 – 00:40** (20s) | **Bước 2: Multiplayer 2 người đồng thời** | Mở song song 2 cửa sổ trình duyệt (Tab A và Tab B). Di chuyển nhân vật Tab A bằng WASD, quan sát Tab B thấy nhân vật di chuyển mượt mà, không bị giật lag. | *"Hệ thống sử dụng Cloudflare Durable Objects kết hợp WebSocket WSS. Mọi chuyển động của sinh viên đều được đồng bộ tức thì với độ trễ dưới 20 mili-giây."* |
| **00:40 – 01:00** (20s) | **Bước 3: Tương tác ngồi ghế học sinh** | Nhân vật tiến lại gần một chiếc bàn học còn trống. Nút tương tác *"Ngồi xuống"* xuất hiện. Bấm 'E', nhân vật ngồi vào ghế, khóa di chuyển; bấm 'E' lần nữa đứng dậy ra vị trí an toàn. | *"Hệ thống quản lý 25 ghế ngồi với thuật toán chống tranh chấp ghế (Atomic Seat Lease) và tính toán vị trí đứng an toàn, tránh hoàn toàn lỗi đi xuyên bàn ghế."* |
| **01:00 – 01:25** (25s) | **Bước 4: Giáo viên đăng nhập & Bục giảng** | Tại Tab B, mở trang đăng nhập cán bộ (`/login`). Đăng nhập email giáo viên. Icon vương miện/giáo viên hiển thị trên đầu nhân vật. Bàn giáo viên kích hoạt menu quản trị. | *"Phân quyền nghiêm ngặt phía máy chủ bằng Postgres Row-Level Security. Khách tham quan tuyệt đối không thể tự phong quyền giáo viên trên trình duyệt."* |
| **01:25 – 01:45** (20s) | **Bước 5: Tặng hoa tri ân & Bó hoa 3D** | Tại Tab A, nhân vật sinh viên đến bàn giáo viên, mở bảng tặng hoa. Chọn *"Hoa Hồng Đỏ"*, nhập lời chúc 20/11. Bấm gửi: avatar cúi chào, bó hoa 3D và cánh hoa bay bổng; Tab B của giáo viên nhận thông báo chúc mừng trang trọng. | *"Mỗi sinh viên được gửi một đóa hoa biểu tượng duy nhất tới Thầy Cô, đi kèm hiệu ứng dâng hoa và cánh hoa 3D rực rỡ, được lưu trữ vĩnh viễn trên cơ sở dữ liệu."* |
| **01:45 – 02:05** (20s) | **Bước 6: Ghi Sổ lưu bút & Chống spam** | Mở modal Sổ lưu bút, gửi lời chúc tiếng Việt có dấu. Thử bấm gửi liên tục 2 lần -> hệ thống thông báo chặn throttle 8 giây. Modal duyệt lời chúc hiển thị cho giáo viên. | *"Sổ lưu bút hỗ trợ tiếng Việt Unicode hoàn chỉnh, chống mã độc XSS và kiểm soát tần suất gửi tin tự động."* |
| **02:05 – 02:25** (20s) | **Bước 7: Điều khiển Máy chiếu thời gian thực** | Giáo viên tại Tab B mở Bảng điều khiển máy chiếu, bấm chuyển sang Slide 2 và Slide 3. Quan sát màn chiếu 3D tại Tab A của sinh viên tự động đổi nội dung ngay lập tức mà không cần F5. | *"Màn chiếu lớp học là Single Source of Truth do Thầy Cô điều khiển. Học sinh có thể nhấn vào màn hình để phóng to chế độ 2D rõ nét trên điện thoại."* |
| **02:25 – 02:40** (15s) | **Bước 8: Chế độ Nhìn lại hành trình** | Giáo viên kích hoạt chế độ *"Nhìn lại hành trình tri thức"*. Màn chiếu chuyển sang duyệt các tấm thiệp dấu ấn kỷ niệm với hiệu ứng ánh sáng ấm. | *"Chế độ kỷ niệm tự động tổng hợp những dấu ấn đã được duyệt để cả lớp cùng hồi tưởng lại hành trình học tập bên nhau."* |
| **02:40 – 02:50** (10s) | **Bước 9: Bức tường dấu ấn & Chụp ảnh 3D** | Nhân vật tiến về bức tường cuối lớp ("Chúng ta đã từng ở đây"). Bấm *"Chụp ảnh lớp học"*: hệ thống đóng khung vàng Đại học Tây Nguyên và cho tải ảnh PNG về máy. | *"Góc chụp ảnh Photo Booth xử lý hoàn toàn tại trình duyệt của người dùng, không tải ảnh lên máy chủ, bảo vệ quyền riêng tư tuyệt đối."* |
| **02:50 – 03:00** (10s) | **Bước 10: Minh chứng Database & Kết thúc** | Mở nhanh Supabase Dashboard quay 3 giây bảng `wishes`, `flowers`, `memory_marks` đã ghi nhận dữ liệu thật. Màn hình kết thúc với thông điệp tri ân 20/11. | *"Dữ liệu được lưu trữ thực chất trên Supabase PostgreSQL. 'Lớp Học Ký Ức' sẵn sàng kết nối triệu trái tim sinh viên Đại học Tây Nguyên!"* |

---

## 2. LƯU Ý KHI THỰC HIỆN QUAY CLIP DEMO DỰ PHÒNG

1. **Chuẩn bị dữ liệu mẫu:** Trước khi quay, nhập sẵn 2-3 lời chúc và dấu ấn mẫu có nội dung trong sáng, trang trọng để màn chiếu và bức tường kỷ niệm không bị trống.
2. **Âm thanh trong clip:** Bật âm thanh Web Audio để thu được tiếng chuông trường và tiếng dâng hoa trong trẻo.
3. **Độ phân giải khuyến nghị:** Quay màn hình ở độ phân giải Full HD 1920x1080, tốc độ khung hình 60 FPS để thể hiện độ mượt mà của Three.js.
