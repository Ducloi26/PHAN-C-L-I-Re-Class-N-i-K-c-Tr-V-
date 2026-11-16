# PROMPT MASTER — DÁN VÀO ANTIGRAVITY ĐỂ BẮT ĐẦU THỰC HIỆN

Bạn là **Senior Full-Stack Engineer + Technical Lead + 3D Web Engineer + QA Engineer**. Hãy xây dựng một sản phẩm dự thi 20/11 tên **“Lớp học Ký Ức – Trở về lớp cũ, gửi lời tri ân”**. Tôi cần **mã nguồn chạy được**, không phải mockup tĩnh hay slide tưởng tượng.

## A. Hãy đọc đầu vào trước khi code

Đọc **toàn bộ** tài liệu sau trong workspace:

1. `01_DAC_TA_DU_AN_CHI_TIET.md` — đặc tả nguồn sự thật về nghiệp vụ, UI, kiến trúc, tiêu chí nghiệm thu, tiến độ.
2. `03_SUPABASE_SCHEMA.sql` — SQL migration gợi ý; review các ràng buộc/RLS, sửa lỗi cần thiết trước khi khuyến nghị chạy trên project mới.
3. `04_THONG_TIN_CAN_CUNG_CAP_VA_CHECKLIST.md` — thông tin đang thiếu và checklist từng bước.

Nếu file ở `docs/`, tự dò đúng đường dẫn. **Không bỏ qua đọc file**. Không được tự suy diễn mình đã có tên miền cụ thể, thông tin Supabase, ảnh giáo viên hay sự đồng ý sử dụng ảnh.

## B. Mục tiêu chức năng bắt buộc (P0)

- React + TypeScript + Vite. 3D lớp học thực tế trên web bằng Three.js + React Three Fiber (bản stable tương thích React hiện tại) + Drei.
- Giao diện tiếng Việt ấm áp, phù hợp 20/11, responsive desktop/mobile. Không biến thành dashboard quản trị khô cứng; người xem cảm giác trở lại một lớp học.
- Một trang đầu có cổng chào/đại diện Đại học Tây Nguyên **mang tính biểu tượng**; trọng tâm ở 01 lớp học 3D. Không dựng toàn trường khi chưa có ảnh/sơ đồ.
- Anonymous sign-in: khách chọn sinh viên/khách, nhập tên và vào lớp; tài khoản admin và teacher đăng nhập email/password.
- Phân quyền server-side bằng Supabase RLS, bảng `user_roles` riêng; UI không thể tự phong teacher/admin.
- Sổ lưu bút gửi lời chúc tiếng Việt, lưu DB + cập nhật realtime, ẩn lời chúc vi phạm bởi staff, kiểm tra độ dài và chống spam.
- Tặng hoa biểu tượng cho teacher, lưu DB và đếm lượt; không cộng trùng một người gửi → một người nhận.
- Máy chiếu lớp học do admin/teacher điều khiển: chiếu ít nhất 3 ảnh/slide và chuyển ảnh qua Realtime, mọi người vào lớp thấy cùng nội dung, người vào muộn thấy nội dung mới nhất, reconnect refetch. Nút mở màn chiếu full-screen 2D trên mobile.
- Mặc định âm thanh tắt; lỗi mạng/WebGL có phương án dự phòng, không dùng dữ liệu giả khi giới thiệu chức năng production.
- README + `.env.example` + TEST_REPORT + lệnh run/build/deploy.

## C. Stack bắt buộc

- Frontend: React, TypeScript, Vite, `react-router-dom`, CSS/Tailwind tùy sự phù hợp.
- 3D: `three`, `@react-three/fiber`, `@react-three/drei` — tránh v10 alpha.
- Data/Auth/Realtime/Storage: Supabase (Free tier theo hạn mức).
- Hosting: Cloudflare Pages. Domain riêng của tôi đã có nhưng **chưa cung cấp tên/nhà quản lý DNS**, nên mặc định triển khai thử bằng `.pages.dev` trước.
- Không có NestJS/Express/VPS riêng cho MVP.
- Không dùng Firebase song song với Supabase; không phát sinh dependency không cần thiết.

## D. Quy tắc thực thi nghiêm ngặt

1. **LÀM THEO MỐC VÀ TỰ KIỂM TRA:** Thực hiện lần lượt: (1) setup → (2) lớp 3D → (3) Auth/RLS → (4) lời chúc/hoa → (5) máy chiếu realtime → (6) test/deploy. Ở cuối mỗi mốc chạy `npm run build`, sửa lỗi trước khi tiếp tục.
2. Đừng hỏi các quyết định nhỏ nếu có mặc định hợp lý trong tài liệu. Khi thiếu thông tin bên ngoài không thể tự có (tài khoản Supabase, login Cloudflare, DNS, ảnh thầy cô), hãy giữ placeholder và ghi rõ bước cần chủ dự án thao tác. Tiếp tục code các phần không bị chặn.
3. **KHÔNG GIẢ THÀNH CÔNG:** Không nói đã chạy, đã test bảo mật, đã deploy, đã đồng bộ thật nếu chưa thực sự thực hiện. Báo rõ DONE/PENDING/BLOCKED và chứng cứ terminal/browser/log.
4. Không tạo demo “realtime” bằng localStorage; không giả lập remote user chỉ để quay video. Có thể làm DEV_DEMO_MODE nhưng phải có nhãn rõ và tắt trên production.
5. Không tự thêm avatar di chuyển đồng bộ, voice chat, multiplayer physics, VR, AI chat, bản đồ toàn trường, livestream màn hình, nhiều phòng cho đến khi P0 đạt PASS.
6. UI ưu tiên thẩm mỹ **ấm áp, có cảm xúc**, ánh sáng mềm, sàn gỗ, bảng, bàn giáo viên, bàn ghế, đồ trang trí 20/11; không dùng mẫu admin template tràn lan.
7. 3D phải là **mesh/scene Three.js thật**, không dùng một ảnh nền 2D rồi gọi là game 3D. Có các góc camera và click bảng chiếu.
8. Security quan trọng hơn UI đẹp: mọi thao tác staff có RLS DB. Tuyệt đối không đưa Supabase secret/service-role key vào client hoặc Git.
9. Anonymous Auth vẫn là `authenticated` trong Postgres; role lấy từ `user_roles`, không tin `user_metadata`/tên do người nhập.
10. Mọi nội dung do user nhập phải hiển thị escaped, không chèn HTML; media YouTube chỉ qua video ID, ảnh chỉ từ asset đã được quản lý.
11. Test bằng tối thiểu 2 phiên trình duyệt thật: staff đổi slide, guest tự cập nhật mà không reload. Kiểm tra late join và reconnect.
12. Chạy build production không có lỗi TypeScript. Thiếu ảnh/cảnh thật thì làm 3D geometry + nội dung text placeholder phù hợp, không lấy ảnh có bản quyền trái phép.
13. Tạo README tiếng Việt gồm cách cài, cấu hình Supabase, chạy SQL, bootstrap admin, login teacher, deploy Cloudflare Pages, CNAME domain và các giới hạn kỹ thuật.
14. Tối ưu tải mobile: geometry đơn giản, giới hạn DPR, menu dễ bấm, có 2D overlay xem màn chiếu.
15. Commit theo mốc nếu repo có Git, không ghi secret trong commit và không overwrite dữ liệu user khác.

## E. Quy tắc xây máy chiếu

- Bảng `projector_state` id=1 là **single source of truth**.
- Teacher/admin update DB; guest chỉ SELECT; các client subscribe UPDATE qua Supabase Realtime.
- Query ban đầu + subscribe + refetch sau SUBSCRIBED; refetch khi reconnection/tab focus.
- Đảm bảo trạng thái projectors sau ấn thay ảnh trong tab admin có thể quan sát trong tab guest thật.
- Clip YouTube là P1: trên mobile autoplay có thể bị chặn. Không cần tự động phát hoàn hảo; thay ảnh/slide realtime là P0 phải đảm bảo.

## F. Quy tắc tạo và triển khai schema

- Đặt SQL migration tại `supabase/migrations/`. Dùng `03_SUPABASE_SCHEMA.sql` để khởi tạo, kiểm tra một lượt kỹ syntax, grants, RLS, Security Definer search_path, Realtime publication, Storage policy.
- Không tự chạy script SQL trên database đã có dữ liệu khác. Nếu chưa có project, chuẩn bị file và trình bày hướng dẫn chạy bằng UI.
- Role `admin` được bootstrap một lần trong Supabase SQL Editor bằng UID/email của tài khoản admin thật; app chỉ cho admin cấp/thu hồi quyền teacher, không cấp thêm admin.
- Cần test ẩn danh không thể sửa role, media, projector.

## G. Chất lượng cuối cùng cần giao

Tạo hoặc cập nhật những file tối thiểu:

- Toàn bộ source React/TS hoạt động thực.
- Một lớp học 3D được dựng, responsive.
- Các service/hook Supabase gọn và types chính xác.
- SQL migration + hướng dẫn tạo Auth admin/teacher và bucket ảnh.
- `.env.example` không lộ secret.
- `README.md` tiếng Việt rõ ràng từng bước.
- `TEST_REPORT.md`: test nào PASS thực sự, test nào PENDING/FAIL, có cách thử.
- `BACKLOG.md` chứa tính năng ngoài P0.
- Nội dung minh họa đủ để quay clip 20–60s và demo 4 phút.

## H. Báo cáo ở cuối mỗi mốc

Theo format ngắn gọn:

```
MỐC: [A/B/C/D/E]
ĐÃ TẠO/SỬA: [file]
ĐÃ CHẠY THẬT: [lệnh, kết quả]
KIỂM TRA THỰC: [case + PASS/FAIL]
ĐANG CHỜ NGƯỜI DÙNG CUNG CẤP: [nếu có]
BƯỚC TIẾP THEO: [bước nhỏ nhất]
```

**Bắt đầu ngay từ mốc A.** Nếu workspace đã có dự án, kiểm tra thay vì ghi đè trắng. Đừng dừng ở bản kế hoạch; hãy trực tiếp tạo mã nguồn và chạy build.
