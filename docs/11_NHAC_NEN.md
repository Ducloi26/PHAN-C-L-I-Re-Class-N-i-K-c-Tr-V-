# Nhạc nền được chọn

Nguồn do chủ dự án cung cấp: https://www.youtube.com/watch?v=zJs0UaWbuNU (thay cho link TikTok trước đó). Bản tải dài khoảng 211 giây, mashup Trăng ơi Trăng à / Nơi cuối mùa hạ / Liar, Quinvy Remix.

Tệp phục vụ cùng web: `public/media/tri-an-background-v1.mp3`, stereo 44.1 kHz / 96 kbps, khoảng 2.5 MB. Bộ lọc cân âm có mục tiêu -18 LUFS / peak -2 dBTP và làm nhẹ đầu/cuối bản nhạc. Không nhúng trình phát YouTube hoặc gọi TikTok khi người dùng nghe.

SoundManager chỉ tạo/tải audio sau tương tác đầu tiên nếu chưa chọn tắt nhạc/tắt âm. Yêu cầu phát bắt đầu ở 3%, tăng nhẹ lên 12% trong 700 ms. Khi cả phòng đang chiếu YouTube/chia sẻ màn hình, hoặc người xem mở màn chiếu lớn (kể cả slide), nhạc nền tạm dừng hoàn toàn, giữ vị trí và lựa chọn bật/tắt. Click, phím, bật tiếng máy chiếu và quay lại tab không thể khởi động nhạc nền trong lúc này. Đóng màn chiếu lớn vẫn giữ nhạc dừng nếu nguồn chiếu trực tiếp còn hoạt động; dừng nguồn trực tiếp hoặc đóng slide lớn mới phát tiếp nếu trước đó đã bật nhạc và không tắt âm/ẩn tab. Nút nhạc ghi “Tạm dừng” trong thời gian chiếu. Nút tắt âm tác động cả nhạc và hiệu ứng. Tắt nhạc giảm tiếng 250 ms rồi dừng và được ghi nhớ; không tự bật lại khi bấm nút khác.

BackgroundSoundtrack quản lý một bộ phát qua mở đầu, chọn nhân vật và lớp học; mở đầu không còn dừng nhạc khi unmount. Ẩn tab hoặc vào trang đăng nhập/quản trị tạm dừng; khi trở lại có thể tiếp tục ở cùng vị trí. Nếu trình duyệt chặn lần phát đầu, lần tương tác tiếp theo thử lại, không cần tắt rồi bật nhạc. Các nút nhận trạng thái thật qua subscription. Trước tương tác đầu không thể đảm bảo trình duyệt cho phép phát có tiếng; xem [MDN Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

File nguồn và công cụ chuyển đổi chỉ nằm trong thư mục kiểm thử bị Git bỏ qua. Khi thay bản nhạc, dùng tên file phiên bản mới để tránh cache bản cũ, cập nhật SoundManager và smoke check.
