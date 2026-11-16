# Vận hành https://trianttn.ducloiphan.cyou

Đã triển khai ngày **15/11/2026**, cập nhật sửa lỗi ngày **16/11/2026** tại **https://trianttn.ducloiphan.cyou**. Cấu hình `wrangler.production.toml` chạy giao diện React, API, WebSocket và Durable Objects trên cùng hostname này. Cloudflare zone `ducloiphan.cyou` đã Active; version hiện tại: `ad6b063a-1904-4469-869e-8156f7d9530e`.

Tên miền đã chuyển từ DNS NicNames sang `armando.ns.cloudflare.com` và `rose.ns.cloudflare.com`; đã xác nhận qua DNS và RDAP registry. Các bước thiết lập bên dưới dùng để tham khảo/cài lại, không cần đổi nameserver lần nữa.

Tra cứu RDAP tại registry ghi nhà đăng ký là **NicNames, Inc.** ([kết quả RDAP](https://rdap.centralnic.com/cyou/domain/ducloiphan.cyou)). Nếu mua qua đại lý, tài khoản quản lý có thể vẫn ở trang đại lý thay vì đăng nhập trực tiếp NicNames.

## 1. Đưa DNS về Cloudflare

1. Đăng nhập/tạo tài khoản tại [Cloudflare](https://dash.cloudflare.com/), thêm website `ducloiphan.cyou` và chọn gói phù hợp. Không cần chuyển nơi đăng ký hay mua lại tên miền.
2. Xem lại bản ghi DNS được nhập vào. Nếu đang dùng website/email, giữ đầy đủ A/CNAME, MX và TXT liên quan; ghi lại cấu hình cũ trước khi chuyển DNS.
3. Cloudflare sẽ cấp **hai nameserver riêng cho zone của tài khoản**. Không dùng tên nameserver tự đoán hoặc sao chép của tên miền khác.
4. Tại trang đã mua tên miền: mở **Tên miền → ducloiphan.cyou → Nameservers/Máy chủ tên miền → Tùy chỉnh**. Thay nameserver hiện tại bằng đúng hai giá trị Cloudflare vừa cấp rồi lưu.
5. Chờ Cloudflare báo zone **Active**. Thời gian phụ thuộc cập nhật DNS, không có mốc cố định cho mọi nhà cung cấp.

Ứng dụng hiện dùng **Custom Domain `trianttn.ducloiphan.cyou`**, DNS/chứng chỉ của hostname này do Cloudflare quản lý. Route cũ `ducloiphan.cyou/*` đã được gỡ và xác minh qua API để tên miền gốc có thể dùng cho website khác; các bản ghi DNS gốc cũ vẫn giữ nguyên. Không tự chuyển hướng tên miền gốc sang lớp học.

Vẫn dùng cùng Worker `lop-hoc-ky-uc-server`, Durable Object và secrets nên dữ liệu/tài khoản production được giữ. Trình duyệt cần đăng nhập lại trên hostname mới vì localStorage/sessionStorage của hai hostname khác nhau.

## 2. Đăng nhập công cụ triển khai

Trong PowerShell:

```powershell
cd D:\20_11\code
npx wrangler login
npx wrangler whoami
```

Hoàn thành bước đăng nhập/cấp quyền của Cloudflare trong trình duyệt. Không gửi mật khẩu Cloudflare hoặc API token vào chat. Nếu có nhiều tài khoản Cloudflare, chọn tài khoản chứa zone `ducloiphan.cyou` khi triển khai.

## 3. Đặt secret cho Worker production

`.dev.vars` chỉ dùng ở máy local, không tự được đẩy lên Cloudflare. Đặt các secret bằng lệnh tương tác để không ghi giá trị vào mã nguồn hoặc lịch sử lệnh:

```powershell
npx wrangler secret put JWT_SECRET --config wrangler.production.toml
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.production.toml
```

`JWT_SECRET` dùng giá trị ngẫu nhiên dài dành riêng cho production. `SUPABASE_SERVICE_ROLE_KEY` dùng khóa backend của Supabase project được cấu hình, tuyệt đối không đặt trong `VITE_*`. Vì khóa server đã từng nằm trong cấu hình frontend cũ, nên thay khóa cũ và dùng khóa mới khi triển khai.

Lần triển khai này đã tạo JWT secret ngẫu nhiên riêng và đặt hai secret ở Worker; file secret tạm được xóa sau lệnh. Khóa Supabase backend hiện có được dùng lại để các tài khoản hoạt động. Chưa thay khóa Supabase tại project; sau khi chủ dự án thay khóa, cập nhật lại secret bằng lệnh trên. Không đổi JWT secret thường xuyên vì sẽ hết hiệu lực các phiên khách production đang mở.

Nếu cần chia sẻ màn hình giữa các mạng không nối trực tiếp được, cấu hình TURN của mình qua `RTC_ICE_SERVERS`; xem [hướng dẫn trình chiếu](09_TRINH_CHIEU_CHUNG.md). Chưa có TURN không đảm bảo media xuyên mọi NAT/firewall.

## 4. Kiểm tra và triển khai

```powershell
npm run deploy:check
npm run deploy
```

`deploy:check` build và đóng gói thử, không tải ứng dụng lên hay đổi DNS. `deploy` tải giao diện và Worker lên Cloudflare, cập nhật Custom Domain đã khai báo cho hostname; Cloudflare phục vụ HTTPS. Không chỉ tải riêng thư mục `dist` lên một hosting tĩnh vì API và phòng học realtime cũng cần chạy.

Tài khoản Cloudflare đã có namespace Workers `ducloiphan`. Cấu hình `workers_dev = false` giữ ứng dụng chỉ phục vụ trên tên miền đã chọn.

Lệnh cũ `deploy:server` cũng chuyển tới quy trình triển khai này để tránh vô tình ghi đè Worker bằng bản chỉ có backend.

Build production chủ động để trống URL API/WebSocket trong bundle; trình duyệt dùng `https://trianttn.ducloiphan.cyou/api/...` và `wss://trianttn.ducloiphan.cyou/ws`. ASSETS phục vụ file thật; Worker chỉ trả shell cho `/`, `/login`, `/classroom`, `/admin`. Không bật `single-page-application` toàn bộ vì CSS/ảnh thiếu phải trả 404 thay vì HTML cache dài. `/api/*` và `/ws` luôn tới backend. `ALLOWED_ORIGINS` chỉ nhận hostname mới.

## 5. Xác minh sau triển khai

Audit mới nhất đạt **129/129 ca tự động**, **9/9 nhóm smoke check** và **23/23 nhóm tích hợp** trên hostname mới; kiểm tra công suất backend 25 khách và đường đi/ngồi/đứng 25/25 ghế đạt. Đã xác minh Custom Domain mới đúng Worker cùng route lớp học trên hostname gốc đã được gỡ. Kiểm thử dùng các phòng QA riêng; không ghi hoa/lưu bút kiểm thử vào phòng thật. Chi tiết UI và giới hạn tại `TEST_REPORT.md`.

Trang chủ `/` có phần mở đầu “Tiếng chuông vẫn đợi” và giới thiệu sáu tính năng. Bấm Trở về lớp học để mở câu chuyện có nhạc/hiệu ứng; Bỏ qua đi thẳng tới chọn nhân vật hoặc trở vào lớp nếu đã đăng nhập. Mở trực tiếp `/classroom` vẫn giữ luồng vào lớp cũ. Trang chọn nhân vật có nút xem lại câu chuyện. Bản nhạc người dùng chọn phục vụ cùng web trong `public/media/tri-an-background-v1.mp3`; không cần cấu hình Cloudflare thêm hoặc nhúng trình phát bên ngoài. Chi tiết tại `11_NHAC_NEN.md`.

Tự chạy lại smoke check:

```powershell
$env:QA_PRODUCTION_URL = 'https://trianttn.ducloiphan.cyou'
node scripts/check-production.mjs
```

Đã kiểm tra bằng trình duyệt production: danh tính nhiều khách, hoa/lưu bút/dấu ấn, phân quyền máy chiếu, hình YouTube và dừng đồng bộ, slide 3D/2D, camera 0.5×/1×/2× và bố cục dọc/ngang. Tiếng thật qua loa và chia sẻ màn hình giữa hai thiết bị/hai mạng vẫn cần kiểm tra; API/SDP không thay cho media nghe/nhìn được.

- `/api/health` trả JSON `ok: true`, `authConfigured: true`.
- Mở thẳng `/classroom` và tải lại không lỗi 404.
- Hai trình duyệt đăng nhập hai khách riêng, vào cùng phòng và thấy đủ hai người.
- Admin đăng nhập, duyệt giáo viên; hoa/lưu bút/dấu ấn lưu được và giữ lại sau khi tải lại.
- Slide/YouTube đồng bộ; chia sẻ màn hình có tiếng thử từ hai thiết bị và hai mạng khác nhau.

Supabase Auth vẫn dùng project thật đang cấu hình nên các tài khoản hiện có được giữ. Hoa/lưu bút/dấu ấn và trạng thái phòng ở `.wrangler/state` là dữ liệu local; production có kho Durable Object riêng và không tự mang theo các bản ghi này. Không chép dữ liệu QA vào phòng thật khi chuyển môi trường.

Tài liệu chính thức: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [routing SPA/API](https://developers.cloudflare.com/workers/static-assets/binding/), [Worker Routes trên DNS proxied](https://developers.cloudflare.com/workers/configuration/routing/routes/).

Hành trình mở đầu hiện có cổng thời gian, ba ảnh lớp, hai ảnh lập trình minh họa và QR ở cuối. Nhạc phát lại từ đầu khi bấm Trở về lớp học; QR giữ lại tới khi người xem chọn tiếp. Nguồn ảnh và hành vi ở `docs/12_CONG_THOI_GIAN.md`.
