# Cổng thời gian và hành trình ảnh

Trang chủ → **Trở về lớp học** mở cổng thời gian, đồng thời phát lại nhạc từ đầu bằng chính thao tác bấm. Phần cổng khoảng 3 giây, sau đó mỗi ảnh tự chuyển sau 3 giây; tổng hành trình khoảng 18 giây. Cuối cùng dừng ở lời tri ân và mã QR; người dùng tự chọn tiếp sang giới thiệu tính năng. Có dừng/tiếp, ảnh trước/sau, chọn ảnh, đi tới lời hẹn cuối, xem lại và bỏ qua toàn bộ.

Ảnh kỷ niệm do chủ dự án cung cấp, giữ nguyên tệp và hiển thị trọn khung:

- `club-gathering.png` — từ clipboard 7d1dc0d5.
- `classroom-friends.png` — từ clipboard 14c223fe.
- `together.png` — từ clipboard 933cf293. Ảnh 900f837a có cùng SHA-256 nên không thêm lần thứ hai.
- `connect-qr.png` — từ clipboard 004c3786, được yêu cầu đặt ở cuối hành trình. Đã giải mã tệp nguồn bằng OpenCV: `https://trianttn.ducloiphan.cyou/`. Không tạo QR mới hay tự chuyển người dùng tới đích.

Hai ảnh lập trình minh họa tải từ trang nguồn Pexels, kèm ghi công trong cảnh kết:

| Tệp | Tác giả và trang nguồn |
| --- | --- |
| `coding-screen.jpg` | [luis gomes — Close Up Photo of Programming of Codes](https://www.pexels.com/photo/close-up-photo-of-programming-of-codes-546819/) |
| `coding-laptop.jpg` | [Nemuel Sereti — Programming Code on Laptop Screen](https://www.pexels.com/photo/programming-code-on-laptop-screen-6424590/) |

[Giấy phép Pexels](https://www.pexels.com/license/) được xem khi chọn ảnh. Ảnh minh họa có nhãn riêng, không gán là hoạt động thật của lớp. Tất cả tệp phục vụ cùng tên miền trong `public/media/memories`, không hotlink ảnh ngoài khi xem.

Canvas 2D tạo vòng xoáy và vệt sao ở tối đa khoảng 30 fps; số hạt và DPR giảm trên điện thoại. Không tạo thêm WebGL context. Dừng RAF khi ẩn trang, dừng hành trình hoặc tắt hiệu ứng; hủy RAF/ResizeObserver khi unmount. Timer ảnh cũng dừng khi ẩn tab; tắt hiệu ứng giữa chừng không đổi ảnh đang xem. Reduced-motion mở nhanh và không chạy hoạt ảnh. QR kết không tự đóng hoặc tự chuyển trang.
