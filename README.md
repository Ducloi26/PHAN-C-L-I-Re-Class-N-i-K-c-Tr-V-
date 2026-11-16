# Re:Class - Trở Về Lớp Học Ký Ức

Ứng dụng lớp học 3D với nhân vật, ghế ngồi, máy chiếu chung, lưu bút, tặng hoa và tường kỷ niệm. Giao diện dùng React/TypeScript/Three.js; backend dùng Cloudflare Worker và Durable Objects; tài khoản giáo viên/admin dùng Supabase Auth.

Bản đang chạy: **https://trianttn.ducloiphan.cyou** (cập nhật 16/11/2026). Tác giả: **Phan Đức Lợi**, thực hiện cá nhân, có sử dụng Codex/ChatGPT hỗ trợ phát triển và kiểm thử. Frontend, API và WebSocket cùng tên miền; production dùng kho dữ liệu phòng riêng trên Cloudflare. Tên miền gốc `ducloiphan.cyou` có thể dùng cho dự án khác.

- [Trải nghiệm website](https://trianttn.ducloiphan.cyou)
- [Video giới thiệu 48 giây](https://trianttn.ducloiphan.cyou/gioi-thieu.html)
- [Thuyết minh PDF](contest-submission/current/ReClass-Thuyet-minh.pdf)
- [Ảnh đại diện](contest-submission/current/ReClass-Anh-dai-dien.png)
- [Nội dung hồ sơ dự thi](contest-submission/current/NOI_DUNG_DIEN_FORM.md)

## Tính năng

Cổng thời gian với ảnh kỷ niệm tự bay trong vòng xoáy khoảng 6.5 giây, chạm ảnh để giữ lại; lớp 3D với avatar, di chuyển và ghế ngồi; tặng hoa tới giáo viên đã duyệt; sổ lưu bút và tường dấu ấn lưu bền; máy chiếu slide, YouTube và chia sẻ màn hình. Nút Vào lớp ngay luôn sẵn; nhập tên và chọn nhân vật không cần chờ tải xem trước 3D. Có chế độ 2D, joystick, góc nhìn 0.5×/1×/2× và giao diện co theo màn hình điện thoại. Nhạc nền tạm dừng hoàn toàn khi chiếu trực tiếp hoặc mở màn chiếu lớn.

## Chạy tại máy

Yêu cầu Node.js 22 và các dependency trong `package-lock.json`.

```powershell
git clone https://github.com/Ducloi26/PHAN-C-L-I-Re-Class-N-i-K-c-Tr-V-.git reclass
cd reclass
npm ci
Copy-Item .dev.vars.example .dev.vars
```

Backend đọc `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` từ `.dev.vars`. Điền cấu hình Supabase của bạn và JWT secret ngẫu nhiên đủ dài vào file vừa tạo; không đưa giá trị thật lên Git. Repository chỉ chứa các file cấu hình mẫu, không kèm tài khoản/mật khẩu quản trị hoặc dữ liệu phòng production.

Mở hai terminal:

```powershell
npm run dev:server
```

```powershell
npm run dev
```

Mở http://localhost:5173. Vite chuyển `/api` và `/ws` sang Worker tại `127.0.0.1:8787`.

Frontend không cần khóa Supabase. Hai biến tùy chọn trong `.env.example` chỉ dùng khi Worker nằm ở tên miền khác: `VITE_API_BASE_URL` và `VITE_MULTIPLAYER_SERVER_URL`. Cấu hình khóa bí mật hoặc JWT service-role trong `VITE_*` sẽ bị Vite từ chối.

## Dữ liệu và quyền truy cập

- Khách nhận phiên có chữ ký từ backend. Mỗi tab giữ phiên riêng và chỉ có quyền thành viên.
- Giáo viên đăng ký tại `/login`; quản trị viên duyệt tại `/admin`. Trạng thái và quyền nằm trong `auth.users.app_metadata`, được xác minh ở backend.
- Danh sách nhận hoa lấy từ giáo viên được duyệt và hồ sơ giáo viên thật trong CSDL. Không tự chèn tên hoặc số hoa mẫu.
- Hoa, lưu bút, dấu ấn và máy chiếu được ghi bền vào storage của Durable Object. Backend chỉ thông báo thành công sau khi lưu xong, rồi phát sự kiện WebSocket.
- Giới hạn hoa là một đóa cho mỗi **phiên người gửi/giáo viên**. Khách không có bước xác minh danh tính ngoài đời.
- Quyền điều khiển máy chiếu, kiểm duyệt và duyệt giáo viên đều được kiểm tra ở server. Dữ liệu role/ID do trình duyệt tự gửi không được dùng để cấp quyền.
- Admin theo dõi sự kiện mà không tạo thêm nhân vật trong lớp. Tổng hoa vẫn giữ cả các lượt đã gửi cho giáo viên sau này bị thu hồi quyền.
- Storage local nằm trong `.wrangler/state`; cần giữ thư mục này khi muốn giữ dữ liệu phát triển. Khi triển khai Worker, Durable Object sử dụng storage của Cloudflare; dữ liệu local không tự được chuyển lên production.

Không cần chạy các migration SQL cũ để sử dụng các luồng chính. `supabase/migrations/07_TEACHER_DIRECTORY.sql` là lựa chọn thêm danh sách giáo viên trực tiếp trong CSDL, không tự cấp quyền đăng nhập. Tài khoản/mật khẩu admin không lưu trong mã nguồn.

## Kiểm tra

Máy chiếu hỗ trợ dán link YouTube, đồng bộ phát/dừng/tua cho cả phòng, và chia sẻ màn hình/tab có âm thanh qua WebRTC. Giáo viên/admin điều khiển; người xem bấm **Bật tiếng** để cho phép âm thanh. Xem [hướng dẫn trình chiếu và cấu hình TURN](docs/09_TRINH_CHIEU_CHUNG.md) để dùng giữa các mạng khác nhau.

```powershell
npm test
npm run build
npm run test:config
```

`npm run build` kiểm tra TypeScript của cả frontend và Worker trước khi đóng gói.

Kiểm thử backend thật cần server đang chạy và tài khoản admin qua biến môi trường:

```powershell
$env:QA_ADMIN_EMAIL = '<email-admin>'
$env:QA_ADMIN_PASSWORD = '<mat-khau-admin>'
npm run test:integration
npm run test:capacity
```

Các script dùng phòng `qa-*` riêng. Kiểm thử tích hợp tạo tài khoản giáo viên dùng một lần và xóa đúng tài khoản đó khi kết thúc. Không dùng dữ liệu kiểm thử làm lời chúc/hoa của lớp chính. Bản hiện tại đạt 129 ca tự động; build frontend/Worker và 9 nhóm smoke check production đạt. Kiểm tra chức năng không thay cho đo FPS hoặc nghe tiếng trên mọi điện thoại.

Bằng chứng chạy được ghi trong `test-results/` (đã bỏ qua bởi Git). Kết quả và phần còn chưa xác minh nằm trong [TEST_REPORT.md](TEST_REPORT.md).

## Tài liệu

Để cập nhật ứng dụng tại **trianttn.ducloiphan.cyou**, dùng [hướng dẫn triển khai riêng](docs/10_TRIEN_KHAI_DUCLOIPHAN.md). Cấu hình production nằm trong `wrangler.production.toml`; `npm run deploy:check` đóng gói thử, `npm run deploy` triển khai cả frontend và backend sau khi tài khoản, DNS và secrets đã sẵn sàng.

- [Duyệt tài khoản](docs/08_QUAN_TRI_TAI_KHOAN.md)
- [Danh sách giáo viên](docs/07_DANH_SACH_GIAO_VIEN.md)
- [Trình chiếu YouTube và màn hình có âm thanh](docs/09_TRINH_CHIEU_CHUNG.md)
- Hồ sơ mới nhất nằm ở `contest-submission/current/`. Các đặc tả, ý tưởng và hồ sơ cũ trong `docs/` và `contest-submission/` là lịch sử, có thể mô tả kiến trúc/chức năng trước khi cập nhật; ưu tiên README này, `TEST_REPORT.md` và hồ sơ mới nhất.

## Ghi chú mã nguồn

Bản công bố GitHub bắt đầu bằng một snapshot sạch của mã nguồn hiện tại. Lịch sử phát triển cũ trên máy không được đưa lên vì từng chứa cấu hình nhạy cảm. File bí mật, cache, build, dữ liệu thử nghiệm và bản sao lưu được loại khỏi repository. Tư liệu ảnh/nhạc và nguồn ghi công được mô tả trong `docs/11_NHAC_NEN.md`, `docs/12_CONG_THOI_GIAN.md` và hồ sơ mới nhất.
