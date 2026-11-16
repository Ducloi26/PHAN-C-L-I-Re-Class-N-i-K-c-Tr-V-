# Cổng thời gian và hành trình ảnh

Trang chủ giữ bìa **Tiếng chuông vẫn đợi**. Bấm **Trở về lớp học** mở cổng thời gian và phát lại nhạc từ đầu trong chính thao tác bấm. Cổng mở khoảng 0.8 giây; năm ảnh tự bay theo đường xoắn từ tâm ra ngoài, cách nhau 1 giây và chồng chuyển động nhẹ. Tổng hành trình khoảng **6.5 giây**, không cần vuốt hoặc bấm chuyển ảnh. Chạm ảnh để giữ lại ở giữa màn hình và đọc lời nhắn; chạm tiếp hoặc bấm Đi tiếp để chạy tiếp. Cuối cùng giữ nguyên lời tri ân và QR cho người xem quét.

**Vào lớp ngay** luôn sẵn ở đầu trang/trong vòng xoáy/cuối hành trình, đi thẳng tới nhập tên và chọn nhân vật (hoặc vào lớp nếu đã có phiên). Hướng dẫn tính năng và câu chuyện là lựa chọn riêng. Form vào lớp dùng được trước khi tải xem trước 3D; bản xem trước và tùy chỉnh chi tiết chỉ mở khi người dùng yêu cầu. Các màn hình được tách bundle; JSX/commonjs helpers đặt cùng React để trang đầu không phải tải Three.js.

Ảnh kỷ niệm do chủ dự án cung cấp, giữ nguyên tệp và hiển thị trọn khung:

- `club-gathering.png` — từ clipboard 7d1dc0d5.
- `classroom-friends.png` — từ clipboard 14c223fe.
- `together.png` — từ clipboard 933cf293. Ảnh 900f837a có cùng SHA-256 nên không thêm lần thứ hai.
- `connect-qr.png` — từ clipboard 004c3786, được yêu cầu đặt ở cuối hành trình. Đã giải mã tệp nguồn bằng OpenCV: `https://trianttn.ducloiphan.cyou/`. Không tạo QR mới hay tự chuyển người dùng tới đích.

Năm ảnh trong vòng xoáy có thêm bản WebP cùng kích thước gốc để phục vụ nhanh: tổng khoảng 213 KB thay cho 1.17 MB, nhẹ hơn khoảng 82%. File nguồn PNG/JPG vẫn giữ nguyên; QR vẫn dùng nguyên PNG. Ảnh người thật luôn hiển thị contain để không cắt khung ảnh.

Hai ảnh lập trình minh họa tải từ trang nguồn Pexels, kèm ghi công trong cảnh kết:

| Tệp | Tác giả và trang nguồn |
| --- | --- |
| `coding-screen.jpg` | [luis gomes — Close Up Photo of Programming of Codes](https://www.pexels.com/photo/close-up-photo-of-programming-of-codes-546819/) |
| `coding-laptop.jpg` | [Nemuel Sereti — Programming Code on Laptop Screen](https://www.pexels.com/photo/programming-code-on-laptop-screen-6424590/) |

[Giấy phép Pexels](https://www.pexels.com/license/) được xem khi chọn ảnh. Ảnh minh họa có nhãn riêng, không gán là hoạt động thật của lớp. Tất cả tệp phục vụ cùng tên miền trong `public/media/memories`, không hotlink ảnh ngoài khi xem.

Canvas 2D tạo vòng xoáy bốn nhánh, các vòng sâu và vệt sao ở tối đa khoảng 30 fps; số hạt và DPR giảm trên điện thoại. Card cập nhật pose theo cùng đồng hồ của hành trình, không có vòng xoay yêu cầu kéo/vuốt. Không tạo thêm WebGL context. Dừng RAF khi ẩn trang, giữ ảnh hoặc tắt hiệu ứng; hủy RAF/ResizeObserver khi unmount. Timer ảnh cũng dừng khi ẩn tab; tắt hiệu ứng giữa chừng không đổi ảnh đang xem. Reduced-motion mở nhanh và hiển thị ảnh tĩnh tự chuyển. QR kết không tự đóng hoặc tự chuyển trang.
