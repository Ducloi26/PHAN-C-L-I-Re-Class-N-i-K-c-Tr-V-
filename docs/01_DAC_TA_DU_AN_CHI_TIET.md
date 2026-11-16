# HỒ SƠ TRIỂN KHAI DỰ ÁN — LỚP HỌC KÝ ỨC 20/11

**Tên sản phẩm đề xuất:** LỚP HỌC KÝ ỨC — Trở về lớp cũ, gửi lời tri ân  
**Tên kỹ thuật:** `lop-hoc-ky-uc-2026`  
**Cuộc thi:** CODE THE THANKS 2026 — “Sáng tạo không giới hạn – Tri ân bằng công nghệ”  
**Đơn vị/bối cảnh:** Trường Đại học Tây Nguyên  
**Tài liệu dành cho:** Người phát triển và AI coding agent **Antigravity**  
**Phiên bản:** 1.0 — lập ngày 14/11/2026 (giờ Việt Nam)  
**Trạng thái:** Đặc tả thực hiện; **chưa phải** hệ thống đã lập trình hoặc kiểm thử.

> **Mệnh lệnh triển khai:** Xây dựng một website lớp học ảo 3D có thể vận hành thật và nhiều người cùng truy cập, ưu tiên tính ổn định, cảm xúc tri ân và tính năng máy chiếu chung. Không tự mở rộng thành game thế giới mở hay sao chép game đi chùa. Dựng khu vực chào mừng Đại học Tây Nguyên tối giản; dành phần lớn công sức cho **một lớp học 3D**.

---

## 0. CÁCH SỬ DỤNG BỘ TÀI LIỆU

1. Đưa toàn bộ các file của thư mục này vào thư mục gốc dự án hoặc thư mục `docs/` trong Antigravity.
2. Mở `02_PROMPT_GIAO_VIEC_ANTIGRAVITY.md`, sao chép toàn bộ nội dung và gửi cho Antigravity ở chế độ **Agent**.
3. Cho Antigravity đọc `01_DAC_TA_DU_AN_CHI_TIET.md` trước khi tạo code và dùng `03_SUPABASE_SCHEMA.sql` làm bản migration gợi ý; kiểm tra cẩn thận trước khi chạy SQL trên dự án Supabase thật.
4. Hoàn thành lần lượt từng giai đoạn trong phần 14, chạy được ở mỗi mốc mới làm tiếp. Không xây tất cả tính năng cùng lúc.
5. Điền thông tin còn thiếu trong `04_THONG_TIN_CAN_CUNG_CAP_VA_CHECKLIST.md`. Không gửi mật khẩu hoặc service-role key cho AI/chat công khai.
6. Chạy test với 2 trình duyệt độc lập trước khi gắn tên miền và gửi bài.

## 1. CƠ SỞ TỪ THỂ LỆ CUỘC THI (GIỮ NGUYÊN THÔNG TIN)

Nguồn nội bộ: `The_le_CODE_THE_THANKS_2026_BAN_TAI_LAI.docx` và `CODE_THE_THANKS_2026_Ke_hoach_18h_20h30_VR_Gala.docx` do người tổ chức/người dùng cung cấp.

- Chủ đề: **Thầy cô – Mái trường – Hành trình tri thức – Tuổi trẻ và công nghệ**.
- Hình thức: website/phần mềm/mini game/sản phẩm công nghệ kết hợp đều hợp lệ; dùng AI **được phép nhưng không bắt buộc**; phải mô tả công cụ và đóng góp sáng tạo thực chất.
- Nhóm tối đa **05 thành viên**; mỗi đội nộp **01 tác phẩm**.
- **Trước 20:00 ngày 17/11/2026:** nộp thông tin đội, giới thiệu ý tưởng 100–200 từ, sản phẩm/link demo, video giới thiệu **20–60 giây**, mô tả công cụ/AI và điều học được. Có thể kèm demo dự phòng tối đa 03 phút.
- **18–19/11:** bình chọn fanpage chính thức; 8 đội có lượt cảm xúc hợp lệ cao nhất vào chung kết. Bình chọn mạng xã hội **không cộng vào điểm chuyên môn** vòng chung kết.
- **20/11, 18:00–20:30:** chung kết và Gala. Mỗi đội **07 phút**: **04 phút** giới thiệu và trình diễn, **02 phút** trả lời BGK, **01 phút** chuyển đội. Khuyến nghị tối đa **03 slide**.
- Thang điểm BGK: **Sáng tạo 30; Ý nghĩa tri ân 25; Làm chủ công nghệ 20; Hoàn thiện 15; Trình bày/hỏi đáp 10 = 100**.
- Có bình chọn sticker tại Gala, nhưng ba giải Nhất/Nhì/Ba do BGK quyết định theo điểm chung kết.
- Không sao chép, vi phạm bản quyền, sử dụng hình/giọng nhận diện của thầy cô hoặc cá nhân khác nếu chưa có sự đồng ý phù hợp.

**Hệ quả thiết kế:** phải có sản phẩm chạy được trước 17/11, quay clip truyền thông trước khi nộp; demo trực tiếp phải gói trong 04 phút. Không đợi đến 20/11 mới triển khai thành công.

## 2. TUYÊN BỐ Ý TƯỞNG VÀ THÔNG ĐIỆP

### 2.1. Một câu định vị

Một **lớp học kỷ niệm trên trình duyệt**, nơi sinh viên và thầy cô có thể cùng quay lại không gian lớp học, trò chuyện qua lời chúc, tặng hoa biểu tượng và xem những ký ức chung trên **màn chiếu được điều khiển bởi giáo viên/admin**.

### 2.2. Vấn đề được giải quyết

- Không phải sinh viên nào cũng có thể gặp lại thầy cô trực tiếp trong ngày 20/11.
- Lời chúc rời rạc trên mạng xã hội dễ bị trôi; thiếu một không gian chung và khoảnh khắc cả lớp đồng thời nhìn lại kỷ niệm.
- Một website thiệp/chúc mừng đơn thuần không truyền tải cảm giác “trở lại lớp”.

### 2.3. Điểm khác biệt cần thể hiện

1. **Một không gian lớp học 3D chung**, có cảm giác hiện diện thay vì chỉ cuộn trang.
2. **Máy chiếu chung theo thời gian thực** — giáo viên/admin thay ảnh/slide, tất cả người có mặt đồng thời thấy nội dung mới.
3. **Bó hoa và lời chúc được lưu lại** như một sổ lưu bút 20/11.
4. **Vai trò giáo viên rõ ràng**; người tham quan không được điều khiển máy chiếu hay tự cấp quyền.
5. Liên hệ văn hóa và bối cảnh **Đại học Tây Nguyên** nhưng không tự nhận bản đồ/kiến trúc 3D đúng thực địa khi chưa có dữ liệu tham chiếu.

### 2.4. Khẩu hiệu

> “Dù cách xa lớp học, chúng em vẫn có thể trở về bên thầy cô — cùng xem lại những kỷ niệm và gửi lời tri ân bằng công nghệ.”

## 3. MỤC TIÊU, PHẠM VI VÀ THƯỚC ĐO

### Mục tiêu P0 — nhất định phải hoàn tất trước hạn nộp

- Website hoạt động qua URL công khai trên desktop và điện thoại.
- Trang chào mừng đẹp, nhập tên, chọn “Học sinh/Sinh viên” hoặc “Khách tham quan”.
- Phòng học 3D **có thể nhận ra là lớp học**: bàn giáo viên, bảng/màn chiếu, ghế bàn, cửa sổ, không gian tri ân 20/11; camera điều khiển được.
- Khách tham gia bằng **Supabase Anonymous Auth**: không cần tự đăng ký email.
- Admin/giáo viên có tài khoản đăng nhập thật và quyền riêng.
- Gửi lời chúc, lưu và hiển thị cho những người tham gia; có kiểm tra độ dài/chống spam đơn giản.
- Tặng hoa biểu tượng cho giáo viên, lưu lịch sử và số lượt tặng, ngăn bấm trùng quá mức.
- Admin/giáo viên điều khiển **máy chiếu chung** (ít nhất ảnh + slide ảnh); người xem tự động cập nhật mà không cần refresh.
- Có trạng thái tải, mất kết nối, màn hình dự phòng nếu 3D lỗi và bộ nội dung mẫu để demo.
- Có hướng dẫn README, file `.env.example`, lệnh chạy, build, triển khai, kiểm thử, kịch bản demo 04 phút.

### Mục tiêu P1 — chỉ làm sau khi P0 chạy ổn

- Danh sách người đang trong phòng bằng Supabase Presence, hiển thị tên trên ghế ngồi/avatar đơn giản (không đồng bộ di chuyển).
- Clip video YouTube trên máy chiếu (cùng video, trạng thái phát/dừng ở mức cố gắng tốt nhất; cần người dùng chạm để phát trên một số thiết bị).
- Bộ ảnh mẫu 3D lối vào trường dựa trên tài liệu người dùng cung cấp; tuyệt đối không hứa đúng tỷ lệ địa lý.
- Âm thanh chuông lớp học (mặc định tắt), hiệu ứng hoa nhẹ, sổ lưu bút nổi bật.

### Không làm trong MVP

- Dựng toàn bộ bản đồ 3D Đại học Tây Nguyên; quét 3D bằng ảnh thực địa.
- Người chơi di chuyển tự do multiplayer với vị trí/va chạm đồng bộ liên tục.
- Voice chat, WebRTC livestream/chia sẻ toàn màn hình, game nhiệm vụ lớn, thanh toán, nhận diện khuôn mặt.
- Bảo đảm video đồng bộ đến từng mili-giây trên mọi thiết bị.
- AI trả lời tự do cho người tham gia; AI không bắt buộc theo thể lệ.

### Số lượng người tham gia dự kiến

- Mốc nghiệm thu MVP: **5–10 máy/phiên** chạy ổn; kiểm thử sức tải tăng dần đến **30–50 người** nếu có thiết bị/tình nguyện viên.
- **Không cam kết** chạy 200 người đồng thời chỉ vì gói Supabase Free ghi 200 kết nối Realtime. Số kết nối khác với sức tải 3D/thông điệp; phải đo thực tế.

## 4. NHÂN VẬT, VAI TRÒ VÀ PHÂN QUYỀN

| Vai trò | Xác thực | Được phép | Không được phép |
|---|---|---|---|
| Admin | Email + mật khẩu tài khoản đã tạo trước | Mọi quyền của giáo viên; cấp/thu hồi quyền giáo viên; chọn/duyệt nội dung máy chiếu; kiểm duyệt lời chúc | Không tự ý hiển thị thông tin riêng tư người dùng |
| Giáo viên | Email + mật khẩu riêng, do admin xác nhận | Chọn ảnh/slide và điều khiển máy chiếu; xem lời chúc; ẩn lời chúc không phù hợp; nhận hoa | Không cấp quyền admin; không tự nâng quyền cho ai |
| Học sinh/Sinh viên | Anonymous Auth + tên hiển thị | Vào lớp, xem máy chiếu, gửi lời chúc, tặng hoa, đọc lời chúc hợp lệ | Không điều khiển máy chiếu, không cấp quyền, không duyệt bài |
| Khách tham quan | Anonymous Auth + tên hiển thị | Vào lớp, xem máy chiếu, gửi lời chúc và hoa theo cùng quy định của người tham gia | Không có quyền giáo viên/admin |

**Chốt kỹ thuật:** nhãn “Sinh viên/Khách” là `participant_type` chỉ để hiển thị; quyền bảo mật thực sự nằm trong bảng `user_roles` (`member`, `teacher`, `admin`). Tuyệt đối không lấy `role` từ localStorage, frontend form, URL query hoặc `user_metadata` để quyết định quyền ghi. Phải dùng **Postgres RLS**.

**Quy trình cấp quyền:** giáo viên dùng tài khoản email đã xác minh/được admin tạo. Admin nhìn thông tin người dùng/UID đã xác nhận trực tiếp rồi nâng `member → teacher` trong trang quản trị. Tài khoản đăng nhập ẩn danh không thể được nâng thành giáo viên qua yêu cầu tự khai tên; cần xác nhận danh tính trước. Admin khởi tạo lần đầu bằng một câu SQL thực hiện thủ công trong Supabase SQL Editor.

## 5. LUỒNG NGƯỜI DÙNG CHI TIẾT

### 5.1. Người vào lần đầu

1. Mở URL trên điện thoại/máy tính → hiện trang chủ với logo/tên dự án, nút **“Bước vào lớp học”**.
2. Chọn **Học sinh/Sinh viên** hoặc **Khách tham quan**.
3. Nhập tên hiển thị 2–32 ký tự, không cho khoảng trắng toàn bộ; có thể dùng tiếng Việt dấu.
4. Bấm “Vào lớp” → gọi `supabase.auth.signInAnonymously()` nếu chưa có phiên. Server tạo profile/role mặc định qua trigger.
5. Cập nhật tên và loại người tham gia vào profile của chính mình; không cho sửa profile người khác.
6. Mở lớp học 3D; hiển thị lời chào nhỏ; preload hình ảnh, tìm trạng thái máy chiếu hiện tại; rồi subscribe sự kiện.
7. Gợi ý hành động “Gửi lời chúc”, “Tặng hoa”, “Xem màn chiếu”.
8. Trường hợp mất kết nối: thông báo mất mạng, giữ phần giao diện cơ bản và thử kết nối lại; **không nói thành công** khi yêu cầu chưa được database xác nhận.

### 5.2. Gửi lời chúc

1. Bấm biểu tượng phong thư/sổ lưu bút.
2. Chọn gửi chung hoặc chọn giáo viên trong danh sách người đã được phân quyền và đồng ý tham gia.
3. Viết 5–500 ký tự; xem trước văn bản.
4. Bấm “Gửi lời chúc” → lưu database; thành công mới phát hiệu ứng và hiện trong danh sách.
5. Người khác thấy cập nhật thời gian thực; danh sách sắp mới nhất trước, phân trang tối đa 20–50 lời/trang.
6. Hiển thị người gửi và thời gian, **không hiển thị email hoặc ID đăng nhập**.
7. Giáo viên/admin có quyền ẩn nội dung không phù hợp; các khách khác không thấy lời chúc đã ẩn.

### 5.3. Tặng hoa

1. Nhấn “Tặng hoa” → chọn giáo viên trong danh sách.
2. Chọn một bó hoa biểu tượng và tùy chọn lời nhắn ngắn.
3. Nhấn xác nhận → tạo `flower_gifts` với `sender_id`, `receiver_id`.
4. Mỗi người chỉ có **01 lượt tặng được ghi nhận cho mỗi giáo viên** trong MVP; nhấn lại hiển thị “Bạn đã tặng hoa” thay vì cộng số ảo.
5. Hiện hoạt ảnh hoa 1–2 giây và bộ đếm hoa lấy từ database.
6. Không dùng mua hoa thật, ví điện tử hoặc tính năng thanh toán.

### 5.4. Giáo viên hoặc admin điều khiển máy chiếu

1. Đăng nhập `/login` bằng email/mật khẩu đã cấu hình.
2. Vai trò từ database xác nhận là `teacher` hoặc `admin` → xuất hiện nút **“Điều khiển máy chiếu”**.
3. Chọn từ thư viện ảnh/slide được duyệt, hoặc (P1) nhập YouTube ID hợp lệ.
4. Chọn “Chiếu” → ghi `projector_state` vào database, kèm thời điểm cập nhật thực từ server.
5. Các trình duyệt đang vào lớp nhận `UPDATE` và render cùng nội dung; trình duyệt vào muộn phải `SELECT` trạng thái hiện tại trước khi subscribe.
6. Nếu ngắt mạng 10 giây rồi quay lại, client tự đọc lại trạng thái mới để không mắc ở slide cũ.
7. Giáo viên có nút “Quay về lời chào”, “Trang trước”, “Trang sau” nếu nội dung là bộ slide.
8. Nếu nội dung video bị chặn tự phát, client hiển thị nút “Nhấn để phát” và nhãn “Đang chiếu cùng lớp”, không giả vờ video đã phát.

### 5.5. Admin cấp quyền giáo viên

1. Admin đăng nhập.
2. Vào `/admin`, mở danh sách người dùng có tài khoản xác nhận.
3. Chọn đúng người dựa trên UID đã đối chiếu tài khoản thật (không dựa tên giống nhau).
4. Nâng `member → teacher`; DB RLS cho admin sửa riêng `user_roles`, **không cho cấp thêm `admin` qua giao diện**.
5. Khi người giáo viên refresh hoặc ứng dụng refetch role, nút điều khiển hiện ra. Admin có thể thu hồi `teacher → member`.
6. Nếu tài khoản chưa có, admin phải tạo/invite trên Supabase Auth hoặc hướng dẫn giáo viên đăng ký theo cách đã kiểm soát; không cấp quyền cho session guest chỉ từ nickname.

## 6. THIẾT KẾ GIAO DIỆN VÀ KHÔNG GIAN 3D

### 6.1. Ngôn ngữ thiết kế

- Ấm áp, gợi ký ức: màu kem, vàng nhạt, gỗ sáng, đỏ nâu/burgundy, xanh lá nhẹ; **không phải** cyberpunk neon chói.
- 3D stylized/low-poly đồng bộ, dễ chạy trên điện thoại, có ánh sáng cửa sổ, bảng đen/bảng trắng, bóng bay hoặc trang trí 20/11 tiết chế.
- Dòng chữ trên bảng: **“Chào mừng Ngày Nhà giáo Việt Nam 20/11”**.
- Nhãn trang: **“Lớp học Ký Ức | Đại học Tây Nguyên”**; chỉ dùng logo trường chính thức nếu được phép/có tệp hợp lệ.
- Trên mobile: canvas 3D chiếm phần trên, các nút tương tác dưới hoặc dạng sheet; màn chiếu có nút mở toàn màn hình **2D overlay** để dễ đọc.

### 6.2. Trang chào mừng

1. Header: tên dự án và dòng phụ “Một lời tri ân – Một lần trở lại lớp”.
2. Nền: ảnh minh họa lớp học 3D render tĩnh hoặc chính scene 3D tối giản.
3. Biểu mẫu chọn loại người tham gia, tên.
4. Nút chính “Bước vào lớp học”; nút phụ “Đăng nhập Giáo viên/Admin”.
5. Ghi chú quyền riêng tư: tên hiển thị và lời chúc sẽ được người khác trong lớp nhìn thấy; không yêu cầu email của khách.

### 6.3. Phòng học 3D: danh sách vật thể và tọa độ tương đối

Dùng hệ tọa độ Three.js: tâm sàn `(0,0,0)`, mặt sàn cỡ **14×10** đơn vị, chiều cao tường khoảng **4**; phía bảng ở `z=-4`.

- Sàn gỗ: Plane 14×10, vật liệu mat, số texture ít.
- Tường và trần: 3 phía hoặc tường với độ trong suốt thích hợp tránh chặn camera.
- Bảng/màn chiếu chính: mặt trước `z=-3.8`, chiều rộng 5–6 đơn vị; hiển thị ảnh qua `meshBasicMaterial` hoặc HTML overlay có cùng nội dung.
- Bàn giáo viên: phía trước bên trái; bục/biểu tượng hoa phía cạnh bảng.
- Bàn ghế: 3 hàng × 4 cụm, vật thể 3D hình hộp/cylinder tự dựng, dùng `instancedMesh` khi cần.
- Cửa sổ: 2–3 cửa trên tường bên phải, ánh sáng vàng nhẹ.
- Dải cờ/chữ chào mừng 20/11, một bảng lời chúc ở tường cạnh.
- Avatar giáo viên: mannequin low-poly hoặc hình đại diện 2D đứng ở bục (không cần ảnh cá nhân thật).
- Avatar người tham quan (P1): đứng/ngồi ở các ghế, hiện nickname; không cần đi bộ.
- Camera: vị trí ban đầu `[0, 3.2, 8]` nhìn về `[0,1.5,-2]`; OrbitControls giới hạn góc tránh xuyên tường; click máy chiếu để mở overlay.
- Chuyển góc bằng 3 nút: “Toàn lớp”, “Bảng chiếu”, “Bàn giáo viên”.

**Không được bỏ trống scene 3D và thay toàn bộ bằng ảnh nền tĩnh.** Nếu WebGL không khả dụng thì hiển thị chế độ 2D dự phòng riêng có thông báo rõ.

### 6.4. Phần “bản đồ Đại học Tây Nguyên” để kịp tiến độ

**P0:** Không xây bản đồ 3D thật của khuôn viên. Trang đầu có biển tên Đại học Tây Nguyên, một đường dẫn/cổng trường tượng trưng dẫn vào 01 lớp học. Tên trường trên cảnh minh họa không đồng nghĩa là mô phỏng địa lý chính xác.  
**P1/P2:** Chỉ dựng một góc sân/cổng trường dựa trên ảnh mặt tiền và sơ đồ có quyền sử dụng do người dùng cung cấp.  
**Không** dùng Google Maps API hoặc dựng cả trường trong 3 ngày đầu.

### 6.5. Máy chiếu: nguyên tắc bắt buộc

- Hiển thị hình/slide rõ trên màn hình 3D; **đồng thời** có nút phóng to thành 2D overlay để đọc trên mobile.
- Máy chiếu phải có **nguồn sự thật duy nhất** trong DB; không giả đồng bộ bằng state trên máy của admin.
- Hỗ trợ `idle`, `image`, `youtube` (video là P1); cho phép bộ slide nhiều ảnh bằng chọn ảnh kế/ảnh trước.
- Trạng thái lưu trong DB để người vào muộn nhận đúng nội dung.
- YouTube/video: cùng video nhưng thời điểm phát chính xác là best-effort; browser có thể chặn autoplay, giới hạn API, quảng cáo hoặc khác tốc độ mạng.
- Tránh livestream/chia sẻ màn hình và tránh upload video lớn vào Supabase Storage ở MVP.

## 7. HẠ TẦNG VÀ CÔNG CỤ SỬ DỤNG

| Lớp | Công nghệ khuyến nghị | Công dụng | Giá dự kiến |
|---|---|---|---|
| Frontend | Vite + React + TypeScript | Trang web, router, UI | Miễn phí |
| 3D | Three.js + `@react-three/fiber` + `@react-three/drei` | Render lớp học 3D trên WebGL | Miễn phí |
| Giao diện | CSS Modules/Tailwind (chọn 1), Lucide | Nút, form, layout responsive | Miễn phí |
| Auth | Supabase Auth | Ẩn danh khách; email/password cho staff | Gói Free theo hạn mức |
| DB | Supabase PostgreSQL | Profiles, roles, wishes, flowers, media, projector | Gói Free theo hạn mức |
| Realtime | Supabase Realtime | Bắn thay đổi máy chiếu, hoa, lời chúc | Gói Free theo hạn mức |
| Media | Supabase Storage hoặc thư mục `public/media` | Ảnh slide, ảnh kỷ niệm được phép sử dụng | Gói Free/tệp tĩnh |
| Hosting | Cloudflare Pages | Host web tĩnh React | Gói Free |
| Tên miền | **Tên miền sẵn có của người dùng** | Subdomain như `20-11.tenmiencuaban...` | Không cần mua mới |
| Phiên bản mã nguồn | Git + GitHub | Commit, rollback, deploy | Gói miễn phí tùy tài khoản |
| Phát triển | VS Code hoặc Antigravity | Tạo code/test/refactor | Theo quyền sử dụng tài khoản |

**Lựa chọn:** Không thuê VPS, không cần backend NestJS riêng cho MVP. Hosting static không thay thế backend; backend realtime được cung cấp bởi Supabase.

**Giới hạn được kiểm tra từ tài liệu chính thức (tháng 11/2026):** Supabase Free khoảng **200 kết nối Realtime**, **100 tin nhắn/giây**, **2 triệu tin nhắn Realtime/tháng**, **500 MB database**, **5 GB egress**; giới hạn và bảng giá có thể thay đổi. Đó không phải đảm bảo số người chơi 3D hoặc uptime miễn phí. Chỉ dùng miễn phí nếu không vượt hạn mức hoặc nhu cầu dịch vụ trả phí. Cloudflare Pages hỗ trợ Vite/React với `npm run build` → `dist` và custom subdomain.

Tài liệu kỹ thuật chính thức:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/realtime/limits
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- https://supabase.com/docs/guides/storage/security/access-control
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://r3f.docs.pmnd.rs/getting-started/installation

## 8. KIẾN TRÚC KỸ THUẬT

```text
[Điện thoại / Laptop: trình duyệt]
              |
              | HTTPS
              v
[Cloudflare Pages: React + 3D/WebGL]
              |
              | Supabase JS SDK + JWT người dùng
              v
[Supabase Auth] -----> [profiles] + [user_roles]
              |
              +-------> [wishes] + [flower_gifts]
              |
              +-------> [media_items] + [projector_state]
              |
              +-------> [Realtime Postgres Changes]
              |
              +-------> [Storage: ảnh/slide]
```

### Các quy tắc thiết kế

1. React là SPA phía trình duyệt; máy chủ không phải chạy frontend 24/7 trên máy người dùng.
2. Tất cả truy vấn dữ liệu từ browser thực thi qua Supabase với RLS. Mọi thao tác admin kiểm tra quyền ở **DB**, không chỉ ẩn nút trên UI.
3. `.env.local` chỉ chứa `VITE_SUPABASE_URL` và **public/publishable key**. **CẤM** đưa secret/service role vào frontend, Git, ZIP gửi giám khảo hoặc prompt công khai.
4. Ảnh kỷ niệm công khai phải là ảnh đã được cho phép sử dụng; Supabase public bucket đồng nghĩa ai có URL cũng đọc được ảnh.
5. Thiết kế không phụ thuộc vào một tài khoản Gmail/Google API nào để khách vào lớp.
6. Không dùng localStorage làm kho lưu lời chúc, quyền hoặc máy chiếu. Có thể dùng để nhớ lựa chọn camera/nickname sau khi đã ghi DB.
7. Dùng đơn phòng `ROOM_ID=1`, không thêm tính năng tạo nhiều phòng ở P0.

## 9. THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ RLS

Xem migration gợi ý có thể chỉnh sửa và chạy **một lần trên Supabase mới** tại file `03_SUPABASE_SCHEMA.sql`. Không chạy vào database đang có dữ liệu khác nếu chưa review.

### 9.1. Sáu bảng chính

| Bảng | Trường quan trọng | Ý nghĩa |
|---|---|---|
| `profiles` | `user_id`, `display_name`, `participant_type`, `created_at` | Tên hiển thị, học sinh/khách; không lưu email công khai |
| `user_roles` | `user_id`, `role`, `updated_at` | Quyền thật: member/teacher/admin |
| `wishes` | `id`, `author_id`, `teacher_id`, `content`, `is_hidden`, `created_at` | Sổ lời chúc, có kiểm duyệt |
| `flower_gifts` | `id`, `sender_id`, `receiver_id`, `note`, `created_at` | Một lượt tặng hoa/giáo viên/người gửi |
| `media_items` | `id`, `title`, `kind`, `payload`, `created_by`, `created_at` | Thư viện ảnh, slide, YouTube ID |
| `projector_state` | `id=1`, `media_id`, `is_playing`, `position_sec`, `updated_at` | Máy chiếu chung nguồn sự thật duy nhất |

### 9.2. Quy định an ninh RLS

- Người đăng nhập ẩn danh vẫn được Supabase Auth cấp `auth.uid()` và nhận vai trò Postgres `authenticated`; do đó phải phân quyền bằng bảng role/`is_anonymous`, **không được coi mọi `authenticated` là giáo viên**.
- `profiles`: người dùng xem tên công khai và chỉ sửa profile của **chính mình**.
- `user_roles`: người dùng được xem quyền liên quan; chỉ admin sửa `member ↔ teacher`; không cho cấp `admin` qua API/browser.
- `wishes`: khách được đọc lời chúc chưa ẩn, tự đăng lời chúc của mình; staff được ẩn/xóa khi vi phạm. Giới hạn độ dài và chặn spam bằng cơ sở dữ liệu.
- `flower_gifts`: chỉ ghi cho người thực sự là giáo viên; 01 cặp người gửi–giáo viên nhận có tối đa 01 bản ghi.
- `media_items` và `projector_state`: chỉ admin/teacher thêm/sửa/chuyển nội dung.
- Dữ liệu thời gian lấy từ DB `now()`; không tin thời gian tự khai của trình duyệt.
- Không có endpoint nào cho khách thay đổi vị trí admin/teacher hoặc toàn bộ projector state.

### 9.3. Realtime

- Đầu vào lớp: query `projector_state` trước, sau đó subscribe `UPDATE` của bản ghi id=1; sau khi SUBSCRIBED, refetch để không lỡ khoảng trống giữa query và subscribe.
- Chúc mừng: query 20 lời chúc gần nhất chưa ẩn; subscribe `INSERT`; khi có moderation/refetch và khi app focus lại thì refetch.
- Hoa: query theo `receiver_id`, nhận sự kiện `INSERT`, đếm lại từ DB khi cần.
- Nếu Supabase Realtime rớt: reconnect có backoff và **refetch**; không dùng giả dữ liệu thành công.
- P1 Presence: dùng kênh Presence riêng để xem số người online, tuyệt đối không ghi `last_seen` mỗi giây vào DB.

## 10. CẤU TRÚC DỰ ÁN MONG MUỐN

```text
lop-hoc-ky-uc-2026/
├─ docs/
│  ├─ 01_DAC_TA_DU_AN_CHI_TIET.md
│  ├─ 02_PROMPT_GIAO_VIEC_ANTIGRAVITY.md
│  ├─ 03_SUPABASE_SCHEMA.sql
│  └─ 04_THONG_TIN_CAN_CUNG_CAP_VA_CHECKLIST.md
├─ public/
│  ├─ media/                    # Ảnh được phép sử dụng và slide dự phòng
│  ├─ models/                   # .glb tùy chọn, KHÔNG bắt buộc
│  └─ favicon.svg
├─ src/
│  ├─ app/                      # Router, providers, entrypoint
│  ├─ components/
│  │  ├─ common/                # Button, Modal, Toast, Loader, ErrorBoundary
│  │  ├─ classroom/             # ClassroomScene, CameraPresets, Projector3D
│  │  ├─ wishes/                # WishForm, WishWall
│  │  ├─ flowers/               # FlowerGiftButton, FlowerCounter
│  │  ├─ projector/             # ProjectorOverlay, MediaPicker, ProjectorControls
│  │  └─ auth/                  # LoginForm, RoleGate
│  ├─ pages/
│  │  ├─ WelcomePage.tsx
│  │  ├─ ClassroomPage.tsx
│  │  ├─ LoginPage.tsx
│  │  └─ AdminPage.tsx
│  ├─ hooks/                    # useAuth, useProjector, useWishes, useFlowers
│  ├─ lib/                      # supabaseClient, validation, date, mediaResolver
│  ├─ services/                 # typed Supabase queries/subscriptions
│  ├─ types/                    # database + domain types
│  └─ styles/
├─ supabase/migrations/         # schema SQL được kiểm soát phiên bản
├─ tests/                       # ít nhất tests bảo mật/logic cơ bản
├─ .env.example                 # CHỈ chứa tên biến/giá trị placeholder
├─ .gitignore
├─ README.md
├─ package.json
└─ vite.config.ts
```

**Trang đường dẫn:** `/` (vào lớp), `/classroom` (phòng học), `/login` (staff), `/admin` (quản trị). Teacher có thể dùng panel trong lớp thay vì thêm route riêng.

## 11. QUY ƯỚC API / HÀNH VI THƯ VIỆN

**Auth**
- Anonymous: `supabase.auth.signInAnonymously()` nếu không có session.
- Staff: `supabase.auth.signInWithPassword({ email, password })`.
- Ngay sau đăng nhập: đọc `profiles` và `user_roles` theo `auth.uid()`; nếu thiếu profile do lỗi trigger, hiển thị lỗi rõ, không tự cấp quyền.
- Guard route admin dựa trên database; đồng thời DB RLS vẫn chặn truy cập trái phép.

**Database**
- `sendWish(content, teacherId?)`: trim, validate, insert; show toast dựa trên kết quả DB.
- `giftFlower(teacherId, note?)`: insert, xử lý lỗi unique constraint thành “Đã tặng hoa”.
- `setProjector(mediaId, options)`: quyền staff, update `projector_state` id=1, xử lý optimistic UI chỉ sau khi DB xác nhận hoặc rollback.
- `promoteTeacher(userId)` / `revokeTeacher(userId)`: admin only; xác nhận trước khi đổi.

**Media**
- `image`: chỉ ảnh trong `/media/` hoặc Supabase public bucket `classroom-media`, không render URL bất kỳ/`javascript:`.
- `youtube`: chỉ chấp nhận **YouTube video ID** gồm 11 ký tự hợp lệ, không nhận HTML iframe do người nhập gửi vào.
- `text`: thông điệp hiển thị an toàn như text React, **không render raw HTML**.

## 12. THIẾT KẾ TRẠNG THÁI VÀ SỰ KIỆN

### 12.1. Máy chiếu

```text
Giáo viên bấm 'Chiếu ảnh'
  -> browser gửi UPDATE projector_state với media_id
  -> database kiểm tra RLS teacher/admin
  -> DB commit + cập nhật updated_at
  -> Supabase Realtime gửi UPDATE đến người trong phòng
  -> mọi client tải media và cập nhật bảng chiếu 3D + overlay 2D
  -> người mới vào lấy projector_state hiện tại rồi hiển thị đúng ảnh
```

**Nghiệm thu:** mở tab A staff và tab B khách, thay 3 ảnh liên tiếp; B hiện đúng không refresh; mở tab C sau đó thấy ảnh mới nhất.

### 12.2. Đồng bộ video (P1)

- Dùng YouTube IFrame API hoặc HTML5 video có quyền sử dụng.
- DB lưu YouTube ID, `is_playing`, `position_sec`, `updated_at` tại thời điểm thao tác.
- Khi nhận cập nhật, ước lượng vị trí phát = `position_sec + (now - updated_at)` nếu đang phát, dùng để seek khi API cho phép.
- Browser có thể cần người xem nhấn play do autoplay policy. Luôn cung cấp nút play chủ động.
- Không quảng cáo “livestream” hoặc “chiếu thời gian thực chính xác tuyệt đối”. Trong P0 chỉ bảo đảm **nội dung ảnh/slide được đồng bộ**.

### 12.3. Những trường hợp lỗi

| Lỗi | Hành vi chuẩn |
|---|---|
| Mất mạng khi gửi lời chúc | Giữ nội dung, báo chưa gửi, thử lại thủ công; không hiển thị đã lưu |
| Guest thay role qua DevTools/API | Database từ chối; ghi test bảo mật |
| Guest thay projector_state trực tiếp | Database từ chối, không ảnh hưởng các trình duyệt |
| Admin đổi ảnh, mạng B ngắt 10s | Khi B online lại, query lại trạng thái máy chiếu |
| Ảnh hỏng/URL hết hạn | Khung hiển thị lỗi kèm ảnh mẫu dự phòng |
| WebGL không chạy | Có giao diện 2D xem chiếu, lời chúc, tặng hoa; nêu rõ 3D không khả dụng |
| Trùng tên người tham gia | Vẫn phân biệt bằng UID, không dùng tên làm khóa quyền |
| Nội dung phản cảm | Staff ẩn/xóa; chữ React được escape, giới hạn ký tự |
| Chạm gửi hoa 2 lần | Unique constraint giữ 1 tặng hoa, UI thông báo đã tặng |
| Liên kết lạ trong máy chiếu | Không cho nhập URL/HTML tùy ý của khách |

## 13. CÀI ĐẶT MÔI TRƯỜNG — LỆNH CỤ THỂ

Môi trường mục tiêu: **Windows 11, Node.js LTS, npm, Git, VS Code/Antigravity**, trình duyệt Chrome/Edge. Mỗi lệnh chạy trong PowerShell tại thư mục dự án.

```powershell
# 1. Kiểm tra công cụ
node --version
npm --version
git --version

# 2. Tạo React + TypeScript bằng Vite
npm create vite@latest lop-hoc-ky-uc-2026 -- --template react-ts
cd lop-hoc-ky-uc-2026
npm install

# 3. Cài gói cần thiết
npm install three @react-three/fiber @react-three/drei @supabase/supabase-js react-router-dom lucide-react
npm install -D @types/three

# 4. Khởi chạy local
npm run dev

# 5. Trước khi đưa lên Internet
npm run build
```

- Với React 19, dùng bản ổn định tương thích `@react-three/fiber@9`, **không dùng R3F v10 alpha** khi thời hạn gấp.
- Nếu Antigravity quyết định thêm state library hoặc CSS library, phải giải thích lý do và đảm bảo build hoạt động.
- Nếu npm báo conflict peer dependency, sửa phiên bản tương thích thay vì `--force` bừa bãi.

### 13.1. Tạo Supabase

1. Truy cập https://supabase.com/ và đăng nhập.
2. New project → chọn organization → đặt tên `lop-hoc-ky-uc-2026`, region gần Việt Nam nếu có lựa chọn phù hợp, lưu DB password ở password manager riêng.
3. Trong **Auth → Providers**, bật Anonymous Sign-ins theo UI hiện hành; bật Email auth cho staff.
4. Vào **Project Settings / API** (tên menu có thể đổi), lấy **Project URL** và **publishable/anon key** để dùng cho client.
5. Tạo `.env.local` ở root:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

6. Trong `src/lib/supabaseClient.ts`, đọc 2 biến `import.meta.env.VITE_*`, fail-fast nếu thiếu.
7. Không ghi `.env.local` lên Git; đảm bảo `.gitignore` bỏ qua file đó.
8. Vào **SQL Editor**, mở nội dung `03_SUPABASE_SCHEMA.sql`, đọc lại và chạy trên **project mới**. Kiểm tra bảng xuất hiện và RLS đã bật.
9. Tạo tài khoản admin thật tại **Authentication → Users**, rồi chạy câu SQL bootstrap admin đã ghi ở cuối file SQL. Không đặt mật khẩu trong source.
10. Tạo một tài khoản giáo viên test bằng Supabase Dashboard; admin cấp quyền `teacher` qua app sau khi xác nhận UID.
11. Tạo bucket public `classroom-media` theo SQL hoặc UI, chỉ upload ảnh được phép sử dụng, chính sách upload chỉ staff.
12. Thử tab trình duyệt khách (anonymous) và admin (email/password) cùng lúc, kiểm tra RLS.

### 13.2. Triển khai Cloudflare Pages + tên miền riêng

1. Tạo GitHub repo **private** nếu cần; commit source (không commit env/secrets).
2. Tạo tài khoản Cloudflare, vào Workers & Pages → Create application → Pages → kết nối GitHub repo.
3. Production branch `main`; **Build command:** `npm run build`; **Output directory:** `dist`.
4. Thêm build environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (đây là key public; DB vẫn phải được bảo vệ bằng RLS).
5. Deploy → thử link `*.pages.dev` trên điện thoại 4G/5G khác mạng; test lại đăng nhập và Realtime.
6. Vào Pages → **Custom domains** → thêm tên miền phụ mà người dùng sở hữu, ví dụ `trian20-11.<TEN_MIEN_CUA_BAN>`.
7. Nếu DNS bên ngoài Cloudflare, thêm CNAME theo hướng dẫn của Pages trỏ tới `<TEN_PROJECT>.pages.dev`. Nếu dùng domain gốc/apex, có yêu cầu zone/nameserver Cloudflare riêng; **không đổi DNS chính của website đang dùng nếu chưa có phương án tránh gián đoạn**.
8. Chờ xác thực HTTPS, kiểm tra `https://subdomain...` và chuyển hướng SPA `/classroom`, `/admin` vẫn hoạt động sau refresh.
9. Kiểm tra Supabase URL/key trong môi trường production, Auth redirect URLs (nếu sau này dùng OAuth/magic link), và chính sách CORS nếu thêm edge functions.
10. Lưu URL production và một URL dự phòng `pages.dev` trong hồ sơ nộp.

## 14. LỘ TRÌNH TỪNG GIAI ĐOẠN DÀNH CHO ANTIGRAVITY

### Giai đoạn A — Khởi tạo và giao diện (14/11)

- [ ] Tạo Vite React TypeScript, cài dependencies, chuẩn hóa thư mục.
- [ ] Tạo README, `.env.example`, cấu hình đường dẫn alias nếu cần.
- [ ] Dựng trang Welcome với form tên + loại người tham gia, giao diện tiếng Việt responsive.
- [ ] Viết input validation và trạng thái loading/errors.
- [ ] Dựng lớp học 3D hoàn toàn bằng geometry cơ bản (không chờ model bên ngoài): sàn, tường, bảng, máy chiếu, bàn ghế, ánh sáng, camera, cổng chào tượng trưng.
- [ ] Thêm chế độ fallback 2D và nút mở màn chiếu toàn màn hình.
- [ ] Chạy `npm run build`, sửa mọi lỗi.
- **Điều kiện qua giai đoạn:** thấy một lớp học hoàn chỉnh về mặt bố cục trên Chrome desktop và màn hình mobile.

### Giai đoạn B — Database/Auth/Role (14–15/11)

- [ ] Khởi tạo Supabase project và chạy migration sau review.
- [ ] Anonymous sign-in cho sinh viên/khách; đăng nhập email/password cho staff.
- [ ] Profile không chứa email công khai; validate display name.
- [ ] Khởi tạo admin thủ công; tạo giáo viên thử và phân quyền admin qua UI.
- [ ] Bảo vệ `/admin` ở giao diện **và** DB RLS.
- [ ] Viết test ẩn quyền admin/teacher và chặn API trực tiếp.
- **Điều kiện qua giai đoạn:** admin và khách đăng nhập hai trình duyệt, quyền không bị nâng giả mạo.

### Giai đoạn C — Lời chúc và hoa (15/11)

- [ ] Form lời chúc; chọn thầy/cô hoặc gửi chung; lưu SQL và hiển thị danh sách.
- [ ] Realtime INSERT, phân trang, bộ lọc lời chúc ẩn.
- [ ] Trang quản trị ẩn lời chúc vi phạm; client refresh phù hợp khi moderation.
- [ ] Danh sách thầy/cô từ role đã xác nhận; tính năng tặng hoa 1 lần/giáo viên/người dùng.
- [ ] Hiệu ứng hoa nhẹ và đếm hoa thực qua DB; chống double-click/duplicate.
- [ ] Test spam 8s, input XSS và mạng lỗi.
- **Điều kiện qua giai đoạn:** mở 2 trình duyệt, khách chúc/tặng, giáo viên thấy dữ liệu và đếm đúng.

### Giai đoạn D — Máy chiếu chung (16/11)

- [ ] Thư viện ảnh/slide 20/11 tối thiểu 3 hình demo do nhóm có quyền dùng.
- [ ] UI chọn ảnh cho teacher/admin.
- [ ] Cập nhật `projector_state` và subscribe Realtime cho mọi client.
- [ ] Thể hiện hình trên mặt màn chiếu 3D và overlay 2D; không refresh vẫn cập nhật.
- [ ] Thử người mới vào giữa chừng và mạng rớt/reconnect.
- [ ] Cơ chế fallback ảnh lỗi và trường hợp user chưa từng click canvas.
- [ ] Chỉ nếu còn dư thời gian: YouTube video ID, play/pause best-effort.
- **Điều kiện qua giai đoạn:** 3 trình duyệt xem 3 ảnh nối tiếp theo admin; tab vào muộn nhận ảnh hiện tại.

### Giai đoạn E — Hoàn thiện, kiểm thử, nộp bài (16–17/11 trước 20:00)

- [ ] Responsive và tối ưu 3D: giảm mesh, tắt animation nặng, giới hạn DPR, load assets nhỏ.
- [ ] Chạy build production, thử desktop Chrome/Edge và 1–2 điện thoại Android/iOS nếu có.
- [ ] Test bảo mật không thể đổi role/media trái phép qua console.
- [ ] Deploy Cloudflare Pages trước, gắn tên miền riêng sau (đừng để DNS chặn tiến độ).
- [ ] Tạo 3–5 ảnh slide thật/ký ức đúng quyền sử dụng.
- [ ] Quay video giới thiệu **20–60 giây**, thêm caption và URL demo.
- [ ] Viết 100–200 từ mô tả bài thi, công cụ, phần AI nếu có, điều đã học.
- [ ] Chốt 3 slide thuyết trình 04 phút, câu hỏi BGK và video demo 03 phút dự phòng nếu cần.
- [ ] Nộp **trước 20:00 17/11/2026**, lưu bằng chứng nộp.
- **Điều kiện cuối:** web online hoạt động trên mạng bên ngoài; không lỗi JS nghiêm trọng; tất cả P0 đã chạy end-to-end.

### Giai đoạn F — 18–20/11 (sau khi nộp)

- [ ] Chia sẻ bài đăng gốc được BTC duyệt theo thể lệ; không mua tương tác/tài khoản ảo.
- [ ] Tập demo 04 phút; bấm giờ trước.
- [ ] Chuẩn bị hai laptop hoặc hai trình duyệt phân vai admin/khách; hotspot dự phòng và video demo dự phòng <=3 phút.
- [ ] Nếu đã vào chung kết, chỉ sửa bug/đánh bóng; không thêm tính năng có thể phá bản chạy ổn.
- [ ] Thử điểm trình diễn thực tế và kiểm tra trang online ngay trước Gala.

## 15. KIỂM THỬ CHẤP NHẬN — PHẢI CÓ BIÊN BẢN

| ID | Kiểm thử | Kết quả mong đợi |
|---|---|---|
| T01 | Vào web từ Chrome ẩn danh | Nhập tên → vào lớp, không bắt email |
| T02 | Tên rỗng/1 ký tự/33 ký tự | Bị từ chối bằng thông báo tiếng Việt |
| T03 | 2 khách cùng tên | Vào được; UID và dữ liệu không nhầm nhau |
| T04 | Guest gọi UPDATE projector bằng SDK/API | Bị RLS chặn |
| T05 | Guest gọi UPDATE user_roles thành admin | Bị RLS chặn |
| T06 | Guest sửa profile người khác | Bị RLS chặn |
| T07 | Staff hợp lệ vào panel | Điều khiển máy chiếu thành công |
| T08 | Admin nâng đúng teacher UID | Teacher có quyền sau refetch/login lại |
| T09 | Teacher muốn cấp admin | Bị DB chặn |
| T10 | Guest gửi chúc có Unicode tiếng Việt | Lưu/hiện đúng |
| T11 | Gửi quá nhiều chúc trong 8 giây | Bị throttle từ DB |
| T12 | Lời chúc chứa `<script>` | Chỉ hiển thị như chữ, không chạy script |
| T13 | Staff ẩn lời chúc | Không còn hiển thị cho guest sau refetch |
| T14 | Tặng hoa 2 lần cho 1 thầy/cô | Chỉ ghi 1 bản ghi, counter đúng |
| T15 | Tab A chiếu ảnh A → B → C | Tab B/C đồng bộ, không reload |
| T16 | Người D vào muộn | D thấy ảnh C hiện tại |
| T17 | Guest offline 10s → online | Trạng thái máy chiếu được đồng bộ lại |
| T18 | WebGL bị tắt/không hỗ trợ | Giao diện dự phòng 2D dùng được |
| T19 | Dùng mobile màn nhỏ | Đọc nội dung máy chiếu được trong overlay |
| T20 | `npm run build` và mở domain HTTPS | Không lỗi build, không 404 route SPA |
| T21 | URL media không hợp lệ | Không được render script/iframe tùy ý |
| T22 | Khách gửi khi mất mạng | Không báo đã gửi; có retry rõ ràng |
| T23 | 5–10 người cùng tham gia | Không crash; thao tác chính đúng; đo latency |
| T24 | Refresh F5 lúc đang ở `/classroom` | Giao diện không bị 404/đăng nhập vòng lặp |

**Cách ghi:** Antigravity tạo `TEST_REPORT.md` có cột PASS/FAIL, cách chạy, ảnh chụp hoặc log, thông tin môi trường; không tự đánh dấu PASS nếu chưa thực sự kiểm thử.

## 16. HIỆU NĂNG, KHẢ NĂNG MỞ RỘNG VÀ CHI PHÍ

- Ưu tiên 30 fps ổn trên máy phổ thông; `dpr={[1,1.5]}` hoặc adaptive DPR; tắt bóng động nếu máy yếu; hạn chế texture >2048px.
- Khi khởi động tải scene cơ bản trước, ảnh kỷ niệm tải sau; media đính kèm nén WebP/JPEG hợp lý.
- Không stream vị trí avatar 30–60 lần/giây; đó là một bài toán game-server riêng.
- Khi số khách tăng, theo dõi Realtime messages/s, kết nối, database, egress trên dashboard Supabase.
- Khi vượt Free hoặc có nhu cầu hàng trăm người, đánh giá chia phòng/kết nối hoặc nâng cấp dịch vụ; **không hứa 0đ vĩnh viễn**.
- Nếu đơn vị tổ chức sử dụng lại lâu dài, xem xét chính sách lưu/xóa lời chúc và backup; gói Free không thay thế chiến lược backup.

## 17. AN TOÀN, QUYỀN RIÊNG TƯ, BẢN QUYỀN

1. **Ảnh/thông tin thầy cô**: chỉ dùng khi có đồng ý phù hợp; nếu thiếu thì dùng nhân vật tượng trưng và danh xưng chung “Thầy/Cô”.
2. **Hình ảnh lớp/cổng trường/logo**: sử dụng ảnh tự chụp được phép hoặc tài liệu được cấp quyền; không tự công bố mô hình là sao chép chính xác thực tế.
3. **Lời chúc**: thông báo rằng tên và nội dung sẽ được hiển thị công khai trong lớp; có cơ chế ẩn/xóa, chống spam; hạn chế thu thập dữ liệu cá nhân.
4. **Không mã độc/XSS**: render text qua React, không `dangerouslySetInnerHTML` cho dữ liệu không tin cậy.
5. **Không tiết lộ secret**: chỉ publishable key được dùng ở browser; secret/password lưu trong dashboard/secret manager cá nhân.
6. **Chống giả quyền**: kiểm thử RLS từ tài khoản anonymous, không chỉ kiểm thử UI.
7. **Không tạo deepfake thầy cô** nếu chưa có phép sử dụng hình/giọng; mọi video/slide lấy đúng quyền sử dụng.
8. **Không cần lưu địa chỉ IP, nhận diện khuôn mặt hoặc định danh sinh trắc học** cho tính năng cốt lõi.
9. **Thời gian lưu dữ liệu:** nếu có yêu cầu nhà trường, cấu hình lịch xóa/xuất lời chúc sau sự kiện; không xóa đột ngột khi chưa có thống nhất.

## 18. NỘI DUNG DEMO TRI ÂN MẪU

### Bộ slide máy chiếu P0 (được phép dùng nội dung chữ giả lập)

1. **Slide 1 — Ngày trở về:** “Chào mừng các thầy cô và các bạn trở về lớp học Ký Ức.”
2. **Slide 2 — Hành trình tri thức:** “Mỗi bài giảng là một hạt giống; mỗi thế hệ sinh viên là một mùa hoa.”
3. **Slide 3 — Lời cảm ơn:** “Cảm ơn thầy cô vì đã kiên nhẫn, tin tưởng và đồng hành cùng chúng em.”
4. **Slide 4 — Khoảnh khắc chung:** collage ảnh tập thể được phép sử dụng, thay sau khi nhận ảnh thật.

### Nội dung lời chúc khởi tạo demo (gắn rõ “dữ liệu mẫu”)

- “Nhân ngày 20/11, chúng em kính chúc thầy cô luôn mạnh khỏe và giữ mãi ngọn lửa với nghề.”
- “Cảm ơn thầy cô vì những bài học trên giảng đường và cả những điều chúng em mang theo vào cuộc sống.”

## 19. THUYẾT MINH Ý TƯỞNG 100–200 TỪ DÙNG ĐỂ NỘP

**Tên tác phẩm:** Lớp học Ký Ức – Trở về lớp cũ, gửi lời tri ân.

> “Lớp học Ký Ức” là không gian lớp học ảo 3D được xây dựng trên nền tảng web, lấy cảm hứng từ những kỷ niệm học tập tại Trường Đại học Tây Nguyên. Người tham gia chỉ cần nhập tên để bước vào lớp học, gửi lời chúc, tặng hoa biểu tượng tới thầy cô và cùng nhìn lại những hình ảnh, câu chuyện đáng nhớ. Điểm nhấn của sản phẩm là máy chiếu chung: khi giáo viên hoặc người quản trị thay đổi nội dung, các thành viên trong lớp đều được cập nhật gần như ngay lập tức. Hệ thống còn có phân quyền, lưu trữ lời chúc và cơ chế kiểm duyệt để tạo môi trường trải nghiệm phù hợp. Thông qua sự kết hợp giữa đồ họa 3D, ứng dụng web và công nghệ đồng bộ thời gian thực, nhóm mong muốn biến lời tri ân thành một khoảnh khắc chung — nơi khoảng cách địa lý không ngăn chúng em trở về bên thầy cô.

**Lưu ý trước khi nộp:** rà soát để mô tả chỉ đúng các chức năng **đã chạy**; nếu chức năng nào chưa hoàn tất thì bỏ khỏi bản nộp, không giới thiệu quá khả năng thật.

## 20. KỊCH BẢN TRÌNH DIỄN TRÊN SÂN KHẤU — ĐÚNG 04 PHÚT

| Mốc | Nội dung | Thực hiện |
|---|---|---|
| 00:00–00:30 | Vấn đề/câu chuyện: không phải ai cũng trở lại được lớp cũ | MC/thành viên nói, chiếu slide 1 |
| 00:30–01:15 | Demo vào lớp 3D, nhập tên, xoay góc máy | Máy B truy cập như khách |
| 01:15–02:00 | Demo tặng hoa + gửi lời chúc | Máy B gửi; máy A nhận |
| 02:00–03:10 | Demo **máy chiếu chung** 2 trình duyệt | Máy A staff chuyển 3 ảnh, máy B tự cập nhật |
| 03:10–03:40 | Nói kiến trúc, phân quyền, điểm sáng tạo | Slide 2 (có sơ đồ) |
| 03:40–04:00 | Lời tri ân kết và thông điệp | Slide 3, QR trải nghiệm |

**Hai phút hỏi đáp — dự phòng câu hỏi:**

1. **Có phải game 3D đi chùa đổi bối cảnh?** Không: sản phẩm tập trung kịch bản “cùng trở lại lớp”, tương tác tri ân và màn chiếu chung do giáo viên điều khiển.
2. **Vì sao chọn 1 lớp thay vì toàn trường?** Ưu tiên hoàn thiện trải nghiệm ý nghĩa, chạy được và mở rộng theo giai đoạn.
3. **Nhiều người có thật sự thấy cùng nội dung?** Đúng với ảnh/slide: trạng thái lưu Supabase, Realtime phát cập nhật; người mới vào đọc trạng thái hiện tại. Video có giới hạn autoplay.
4. **Có AI không?** Thể lệ không bắt buộc AI; điểm công nghệ là 3D, web realtime, RLS, đồng bộ đa thiết bị. AI (nếu dùng để hỗ trợ lập trình/thiết kế) được công khai minh bạch.
5. **Có an toàn không?** Staff có auth thật; DB RLS chặn guest; không lưu email công khai; có kiểm duyệt lời chúc.
6. **Chi phí?** Demo trên gói Free theo hạn mức; không có cam kết miễn phí vô hạn hoặc số kết nối thực không giới hạn.

## 21. TIÊU CHÍ CHẤT LƯỢNG TƯƠNG ỨNG THANG BGK

| Thang BGK | Việc phải chứng minh | Điểm tối đa |
|---|---|---:|
| Sáng tạo, độc đáo | Không gian ký ức, cùng gặp mặt và cùng xem máy chiếu; không chỉ template chúc mừng | 30 |
| Thông điệp tri ân | Có câu chuyện, hoa/lời chúc, ảnh kỷ niệm thật có phép | 25 |
| Ứng dụng/làm chủ công nghệ | 3D WebGL, Auth, RLS, Realtime, xử lý reconnect/máy chiếu | 20 |
| Chất lượng hoàn thiện | Build online, mobile, 3 trình duyệt đồng bộ, failover | 15 |
| Trình bày/trả lời | Demo 4 phút, 3 slide, hỏi đáp về kiến trúc và giới hạn | 10 |

**Không ghi trước “đạt 90/100” khi chưa có sản phẩm hoàn chỉnh.** Đây là thước đo để nhóm tự rà soát, không phải điểm BGK dự báo.

## 22. NGHIỆM THU CUỐI CÙNG CỦA ANTIGRAVITY

Chỉ trả lời “đã hoàn thành” khi có **bằng chứng thực tế**: (i) source code đầy đủ, (ii) `npm run build` PASS, (iii) URL local và URL production thật, (iv) 2 tài khoản độc lập kiểm tra realtime, (v) test guest sửa role và máy chiếu thất bại, (vi) README từng bước, (vii) TEST_REPORT kết quả thực, (viii) danh sách phần chưa làm.

Nếu chưa có Supabase project URL/key, ảnh thầy cô hoặc tên miền thì **vẫn tạo frontend và local fallback để chạy**, giữ placeholder rõ ràng và hướng dẫn đúng bước cần chủ sở hữu thao tác. Không tự tạo/đoán URL, mật khẩu, tài khoản, logo trường hoặc tên giáo viên. Không tuyên bố đã deploy nếu chưa deploy.

---

## PHỤ LỤC A. CHẾ ĐỘ KHÔNG CÓ DỊCH VỤ BACKEND (DEV DEMO ONLY)

Để chạy ngay từ phút đầu khi chưa được cấp Supabase project, làm `VITE_DEMO_MODE=true` cho hiển thị một lớp học demo với ảnh mẫu và dữ liệu mock **chỉ trên trình duyệt**. Gắn nhãn **“CHẾ ĐỘ DEMO CỤC BỘ — CHƯA ĐỒNG BỘ REALTIME”** dễ nhìn. Chỉ dùng cho phát triển giao diện; **không** sử dụng như bản nộp thật nếu chưa có backend. Khi cấu hình Supabase, buộc tắt mock mode.

## PHỤ LỤC B. CAM KẾT PHẠM VI VÀ QUY TẮC THAY ĐỔI

Mọi ý tưởng bổ sung (avatar di chuyển, nhiều lớp, voice chat, AI, cả trường 3D, chia sẻ màn hình, VR) phải ghi vào `BACKLOG.md`. Antigravity không tự thêm khi chưa hoàn tất P0. Ưu tiên theo thứ tự **chạy được → an toàn → đúng cảm xúc → đẹp → nâng cao**.
