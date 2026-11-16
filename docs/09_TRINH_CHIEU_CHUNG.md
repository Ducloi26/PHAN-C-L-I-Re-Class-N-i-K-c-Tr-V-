# Trình chiếu chung: YouTube và màn hình có âm thanh

Đăng nhập giáo viên đã được duyệt hoặc admin, vào lớp rồi mở **Máy chiếu** trên thanh công cụ (trên điện thoại: menu giáo viên).

## YouTube

1. Dán link YouTube vào ô **Chiếu YouTube cho cả phòng**, bấm **Chiếu**.
2. Màn chiếu mở cho các thành viên đang ở cùng phòng. Người vào sau nhận video và vị trí hiện tại từ backend.
3. Mỗi người bấm **Bật tiếng** để trình duyệt cho phát âm thanh. Nút tắt âm thanh chung của ứng dụng vẫn có hiệu lực.
4. Giáo viên/admin dùng **Phát/Tạm dừng cả phòng**, **Tua** hoặc **Phát lại**. Khách chỉ xem và điều chỉnh tiếng của mình.

Chấp nhận link watch, youtu.be, embed, Shorts và live với ID video hợp lệ; mốc `t`/`start` được đọc khi chọn video. API phát nhúng chính thức của YouTube được dùng, không tải video xuống hay chuyển thành texture. Một số video bị chủ sở hữu chặn nhúng, giới hạn tuổi/quốc gia hoặc không công khai sẽ không phát được; giao diện báo lỗi và có thể đổi video hoặc chia sẻ tab đang phát.

Đồng bộ dựa trên trạng thái lưu bền, revision, đồng hồ server và kiểm tra lệch mỗi 2 giây; tự sửa khi lệch hơn 2 giây. Quảng cáo, thời gian buffering, chính sách của YouTube và đường mạng từng người có thể gây lệch tạm thời. Đây không phải đồng bộ từng khung hình.

Ảnh kỷ niệm dùng canvas của cảnh 3D; phần video nhúng bằng HTML không được đưa vào ảnh canvas đó.

## Chia sẻ tab, cửa sổ hoặc màn hình

1. Bấm **Chia sẻ màn hình / cửa sổ / tab**.
2. Trong hộp thoại của trình duyệt, chọn đúng nguồn muốn chiếu. Muốn truyền tiếng, ưu tiên **tab** có nội dung và bật **Chia sẻ âm thanh** trước khi xác nhận.
3. Người xem bấm **Bật tiếng**. Bản xem trước của người phát luôn tắt tiếng để tránh tự nghe lặp.
4. Bấm **Dừng chia sẻ** trong ứng dụng hoặc **Dừng chia sẻ** của trình duyệt để kết thúc. Chuyển sang YouTube/slide/dấu ấn, rời lớp, thu hồi quyền hay mất kết nối sẽ dừng nguồn đang phát. Tải lại trang không tự xin quyền chụp màn hình lần nữa.

Ứng dụng chỉ xin hình và tiếng từ nguồn được chọn, không bật microphone/camera. Trình duyệt có thể không cung cấp track tiếng cho một loại nguồn; khi đó màn chiếu báo **Nguồn chia sẻ không có âm thanh**. Cần HTTPS hoặc localhost cho `getDisplayMedia`; địa chỉ HTTP bằng IP mạng LAN thường không đủ điều kiện. Điện thoại có thể xem nhưng không phải trình duyệt điện thoại nào cũng hỗ trợ phát màn hình.

## Hạ tầng mạng

Các thành viên phải kết nối cùng backend và `roomId`. Trên nhiều thiết bị, `localhost` của mỗi thiết bị là một máy khác nhau: dùng địa chỉ triển khai HTTPS chung khi kiểm tra từ xa.

Hình/tiếng truyền bằng WebRTC trực tiếp từ người phát tới từng người xem; WebSocket xác thực chỉ chuyển SDP/ICE tới đúng đối tác của phiên đang hoạt động. STUN mặc định là `stun:stun.l.google.com:19302`. Mạng chặn kết nối trực tiếp cần TURN; chưa cấu hình hay thuê TURN cho dự án này.

Backend nhận biến `RTC_ICE_SERVERS` là mảng JSON `RTCIceServer`; xem mẫu trong `.dev.vars.example`. Khi triển khai, đặt cấu hình ở môi trường Worker rồi khởi động/triển khai lại. Dùng thông tin truy cập TURN dành riêng cho ứng dụng và giới hạn thời hạn/quota phù hợp, vì người xem hợp lệ cần nhận thông tin này để kết nối.

Cách truyền hiện tại tạo một kết nối cho mỗi người xem. Băng thông tải lên của người phát tăng theo số người xem; phòng đông cần thử tải hình/tiếng thực tế và có thể cần SFU. Kiểm thử 25 người di chuyển trước đây không phải phép đo 25 luồng video.

## Kiểm thử và giới hạn bằng chứng

`npm test` kiểm tra parser, đồng hồ, lưu trạng thái, xung đột revision, phân quyền/routing tín hiệu, SDP/ICE, track hình/tiếng và dọn kết nối bằng các boundary mô phỏng. `npm run test:integration` chạy API và WebSocket thật trong phòng `qa-*`; SDP trong các ca routing là dữ liệu kiểm thử, không phải kết nối truyền media thực.

Cần chạy thủ công bằng hai phiên trình duyệt: giáo viên phát YouTube, khách bật tiếng; thử tạm dừng/tua, vào sau, đóng/phóng to, chuyển 3D/2D; tiếp theo chia sẻ một tab có âm thanh, kiểm tra khách nhận đúng hình/tiếng, dừng ở trình duyệt, đổi nguồn và rời lớp. Kiểm tra từ hai mạng khác nhau sau khi cấu hình TURN. Không có quyền công cụ mở localhost thì không thể xác nhận các bước này bằng tự động hóa.

Tài liệu nền tảng: [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia), [WebRTC peer connections và ICE/TURN](https://webrtc.org/getting-started/peer-connections).
