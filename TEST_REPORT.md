# Báo cáo kiểm thử — cập nhật 16/11/2026

Môi trường: Windows, Node.js 22.16.0, Vite 6.4.6, Wrangler 4.162.0; production **https://trianttn.ducloiphan.cyou**, Supabase Auth thật của dự án. Các mục triển khai ban đầu bên dưới lưu lịch sử, không thay thế kết quả mới nhất này.

## Bộ hồ sơ và video giới thiệu ngày 16/11

Version hiện tại: `4a7aa253-c083-4bee-bb63-5153152665a8`. Bổ sung static page `/gioi-thieu.html` (Cloudflare chuyển tới `/gioi-thieu`), poster PNG, MP4 48 giây và phụ đề VTT. Build production và 9/9 smoke check đạt; không đổi logic ứng dụng so với bản nhạc máy chiếu bên dưới.

MP4 H.264/AAC 1280×720, 24 fps, khoảng 738 KB; dùng ảnh giao diện thực tế và nhạc tổng hợp riêng. HTTP trả video/mp4 với chữ ký MP4 đúng; máy chủ hiện trả toàn bộ file 200 kể cả yêu cầu range. Trình duyệt phát được, duration 48, readyState 4, currentTime tăng tới 18.20 giây, không có lỗi media. Bằng chứng `test-results/submission-assets.json`, `test-results/ui/reclass-submission-video.jpg`.

Hồ sơ cá nhân Phan Đức Lợi trong `output/reclass-submission`: nội dung điền form, ảnh đại diện PNG, video MP4, PDF 4 trang; ZIP tổng hợp ở `output/ReClass-Ho-so-du-thi.zip`. PDF được render và xem đủ bốn trang; PDF và PNG đều dưới 5 MB. Mã nguồn chưa có repository remote; tài khoản GitHub kết nối chưa trả về repository, nên chưa có link GitHub/GitLab để điền. Không khẳng định ô này là tùy chọn với loại hình Website.

## Nhạc nền khi trình chiếu ngày 16/11

Version đợt sửa nhạc: `c26b2817-e428-42bd-b95e-7fef930b8426`. **123/123 ca tự động**, build production và **9/9 smoke check** đạt.

- Thay giảm âm nhạc nền bằng tạm dừng hoàn toàn khi phòng dùng YouTube/chia sẻ màn hình, hoặc người xem mở màn chiếu lớn kể cả slide. Chặn mọi đường khởi động lại nhạc trong thời gian chiếu (click/phím, quay lại tab, bỏ mute, nút nhạc); không đổi lựa chọn nhạc đã lưu. Kết thúc chiếu phát tiếp đúng vị trí nếu người dùng đã bật nhạc, không mute và tab đang hiện.
- UI production: trước khi vào phòng QA có YouTube, nhạc đang phát; sau vào phòng, native audio `paused=true`, giữ mốc `6.041834` giây kể cả sau thao tác mute/unmute. Menu hiện **Nhạc: Tạm dừng**. Với phòng QA chỉ có slide, mở màn chiếu dừng ở `5.265763`, đóng phát tiếp từ khoảng `5.52678`; chủ động tắt nhạc rồi mở/đóng slide vẫn giữ dừng. Không sửa dữ liệu phòng chính.
- Ca chạy SoundManager thật kiểm tra pause/resume và vị trí, không bật lại do tương tác, giữ lựa chọn tắt/mute, không tạo audio mới khi chưa từng phát, chặn promise cũ, và kết thúc chiếu trong tab ẩn chờ quay lại mới phát. Chưa nghe qua loa thiết bị vật lý. Ảnh: `test-results/ui/projector-bgm-paused.jpg`; chi tiết `test-results/projector-bgm.json`.

## Cổng thời gian và hành trình ảnh ngày 16/11

Version đợt rút thời gian hành trình: `2e953395-f1af-44fe-b5d8-2fbb4a07122c`. **120/120 ca tự động**, build TypeScript/Vite và **9/9 smoke check production** đạt.

- Bấm **Trở về lớp học** mở cổng thời gian Canvas 2D và phát lại cùng bản nhạc từ đầu trong thao tác bấm; sau 3 giây đi qua năm cảnh ảnh, mỗi ảnh tự chuyển sau 3 giây (tổng khoảng 18 giây). Ba ảnh kỷ niệm do người dùng cung cấp; hai ảnh lập trình minh họa từ Pexels có ghi công. Ảnh gửi trùng được bỏ một bản.
- Cuối hành trình giữ nguyên lời tri ân và QR người dùng cung cấp, không tự chuyển đi. QR nguồn giải mã ra `https://trianttn.ducloiphan.cyou/`. Có dừng/tiếp, trước/sau, chọn ảnh, đi thẳng tới cuối, xem lại, đọc câu chuyện hoặc tới giới thiệu tính năng.
- Trình duyệt production xác nhận cả năm ảnh và QR tải thành công; nhạc phát (`readyState=4`, `paused=false`), bấm xem lại đưa thời gian về khoảng 0.23 giây. Không có lỗi console trong lượt kiểm tra. Chưa nghe qua loa thiết bị vật lý.
- Kiểm tra desktop, 390×844, 320×568 và 844×390: không tràn ngang, nút không đè ảnh. Sửa lỗi ảnh vượt khung làm cắt người và lỗi chọn ảnh/kết thúc khi tạm dừng giữ hiệu ứng ở opacity 0. Ảnh thật hiển thị `contain` trọn khung; ảnh lập trình dùng `cover`.
- Timer và Canvas dừng khi ẩn trang; tắt hiệu ứng không đổi mốc ảnh đang xem. Ca boundary kiểm tra dừng/tiếp, ẩn tab, cuối hành trình giữ QR và dọn RAF/observer. UI xác nhận bật/tắt hiệu ứng và cả hai đường từ QR sang câu chuyện/giới thiệu tính năng.

Bằng chứng: `test-results/memory-journey-ui.json`; ảnh `memory-journey-desktop.jpg`, `memory-journey-mobile.jpg`, `memory-journey-small-phone.jpg`, `memory-journey-landscape.jpg`, `memory-qr-desktop.jpg`, `memory-qr-mobile.jpg` trong `test-results/ui`. Chi tiết nguồn ảnh: `docs/12_CONG_THOI_GIAN.md`. Các kiểm tra nghiệp vụ 23 nhóm tích hợp và 25 ghế bên dưới được chạy ở bản sửa ghế, trước thay đổi mở đầu này.

## Bản sửa trước trong ngày 16/11: vào lớp, ghế ngồi, nhạc và hiệu ứng

Version đợt sửa ghế: `eb6963ba-35a7-4dc6-baa3-1994ee67b5d3`.

- **116/116 ca tự động**, build TypeScript/Vite và **8/8 smoke check** đạt. Sau thay đổi backend ghế, đã chạy lại **23/23 nhóm tích hợp** và công suất **25 khách / 25 ghế / 1.000 gói di chuyển trong 5 giây** trên production. Các phòng đều là `qa-*`; không thay quyền giáo viên thật hoặc dữ liệu lớp chính.
- Bỏ effect tự gọi mở overlay khi máy chiếu có video. Người mới vào nhìn lớp 3D, video vẫn nằm trên bảng; xem lớn chỉ khi chủ động bấm. Trình duyệt đã vào phòng QA có YouTube đang phát, xác nhận không có nút đóng popup tự bật; mở/đóng thủ công hoạt động, không tự bật lại.
- Ghế: lọc ghế có người ngồi và ghế không đúng quyền trước khi chọn ghế gần nhất; dùng cùng giới hạn khoảng cách với backend; đẩy tọa độ mới nhất trước yêu cầu ngồi; chỉ một yêu cầu chờ; đợi phản hồi tối đa 5 giây, thông báo rõ thay vì im lặng. Client nhận cả cập nhật vị trí/trạng thái của chính mình để tránh ghế bị server giữ mà giao diện vẫn đứng khi xác nhận đến trễ. Đổi hướng camera theo ghế; giữ E không lặp thao tác ngồi/đứng.
- Kiểm tra đường đi bằng collision code thật rồi gửi qua WebSocket: từ khu vực giáo viên, đi/ngồi/đứng lần lượt **25/25 ghế**. Ghế đã có người chặn người thứ hai nhưng ghế bên cạnh vẫn ngồi được; sinh viên bị chặn ghế giáo viên. Dọn kết nối còn 0 người/0 ghế. Báo cáo `test-results/seat-route.json`.
- Giao diện thật: vào phòng có video không popup; bấm ngồi ghế A, đứng lên, giữ nút sang phải để đi tới B và ngồi B thành công. Ảnh `classroom-entry-no-popup.jpg`, `seat-neighbour-confirmed.jpg`, `classroom-seat-and-projector-fixed.jpg`. Đây là thao tác UI trên hai ghế; con số 25/25 là kiểm tra đường đi và backend, không phải 25 lần điều khiển thủ công bằng trình duyệt.
- Nhạc: một bộ phát dùng chung cho mở đầu → chọn nhân vật → lớp; không còn bị dừng khi unmount mở đầu. Lần tương tác đầu phát nhạc nếu chưa chọn tắt, yêu cầu phát có âm lượng nhỏ ngay từ đầu rồi lên 12%. Bị chặn phát sẽ thử lại ở thao tác tiếp theo. Tạm dừng khi ẩn tab/trang đăng nhập giữ ý định nghe; tắt nhạc chủ động được nhớ. Nút nhạc/âm thanh đồng bộ theo bộ phát, không đúp thao tác do sự kiện capture. Đã quan sát nhạc chạy liên tục từ khoảng giây 7 ở intro, giây 13 ở chọn nhân vật tới giây 18 trong lớp ở lượt trước; bấm tắt/bật mỗi lần một lần đạt. Chưa đo âm thanh qua loa thiết bị vật lý.
- Thêm hiệu ứng: pháo hoa vòng ngoài/ngôi sao nhiều đợt và quạt hai bên, nút bắn ở header, tia sáng khi chạm, cánh hoa rơi, sao băng, quầng sáng, ánh nắng, tiêu đề/nút lướt sáng, postcard và chuông chuyển động, thẻ tính năng hiện lần lượt. Điện thoại giảm số hạt; 320px có 6 cánh hoa, các nút nằm trong màn hình. Tắt hiệu ứng ẩn các lớp và hủy lịch pháo hoa; reduced-motion mặc định tắt. Đã thấy pháo hoa thực, kiểm tra bật/tắt trên UI. Ảnh `effects-fireworks-final.jpg`, `effects-mobile-final.jpg`.

Các ảnh nằm trong `test-results/ui`; báo cáo UI tại `test-results/entry-seat-ui.json`. Các giới hạn media/thiết bị ở cuối tài liệu vẫn áp dụng.

## Chi tiết các đợt kiểm tra trước

Version đợt thay nhạc nền trước: `000bacb7-a0f8-40dc-819d-1e93598bbd51`.

- **106/106 ca tự động** đạt, gồm 37 ca mô phỏng cũ và 69 ca chạy mã thật qua các boundary. Build frontend/Worker đạt. File `test-results/unit.tap` đã cập nhật.
- Đã lấy được âm thanh từ YouTube `zJs0UaWbuNU` theo nguồn người dùng chọn và phục vụ MP3 cùng web, dài khoảng 211 giây. Nhạc nền mặc định 12%, hạ còn 2.5% khi chiếu video, vào tiếng 1.2 giây và dừng mềm 250 ms; lặp lại bản nhạc. Không thay thế bằng nhạc khác khi phát lỗi. Ba ca mới kiểm tra cùng SoundManager thật về mức âm, mute/duck, restart trong lúc fade-out và play bị từ chối.
- Trình duyệt production: trước thao tác chưa tạo audio; sau bấm phát đúng URL MP3, `readyState=4`, `paused=false`, `muted=false`, thời gian phát tăng và không có lỗi media. Tắt nhạc xác nhận paused/muted; bật lại tiếp tục phát. Công cụ DOM không trả thuộc tính volume, nên mức âm xác minh bằng mã/boundary test; chưa nghe qua loa vật lý. Bằng chứng `test-results/background-track.json`, `test-results/ui/background-track-playing.jpg`. Smoke check mở rộng thành **8/8**, có kiểm tra MP3 đúng MIME và dữ liệu/range thay vì HTML.
- Mở đầu mới **Tiếng chuông vẫn đợi** ở `/`: bìa minh họa lớp học bằng CSS, ba chương tự điều hướng, sáu thẻ hướng dẫn tính năng thật, nút bỏ qua và xem lại. Nhạc khởi động theo thao tác bấm; tiếng chuông, sao sáng và pháo hoa từng đợt ngắn. Có bật/tắt nhạc/hiệu ứng, ưu tiên giảm chuyển động; dừng hiệu ứng và âm nền khi rời trang/ẩn tab. Nhạc tổng hợp ban đầu đã được thay bằng MP3 nguồn người dùng chọn ở mục trên.
- Đã kiểm tra trực quan bìa desktop/320px, hướng dẫn ở màn hình 844×390, ba chương, nhảy chương, tắt nhạc/hiệu ứng, bật pháo hoa thủ công, đi vào lớp với phiên đã đăng nhập, bỏ qua/xem lại với khách chưa đăng nhập, lối đăng nhập giáo viên. Không có lỗi console trong lượt mở câu chuyện. Hai ca mới xác nhận không tự khởi động âm trước thao tác, bỏ qua không chặn, luồng giới thiệu, reduced-motion và dọn âm khi unmount. Chưa xác nhận tiếng qua loa điện thoại vật lý. Ảnh: `story-cover-desktop.jpg`, `story-cover-mobile.jpg`, `story-features-desktop.jpg` trong `test-results/ui`.
- Nút điều khiển dùng một đơn vị CSS co theo cả chiều rộng và chiều cao, giới hạn 70–100% kích thước desktop. Kiểm tra production 320×568, 390×844, 844×390, 1280×720: nút camera rộng lần lượt 30.8/36.1/30.8/44px, joystick rộng 106.4/124.6/106.4/152px; không tràn ngang hoặc chồng nhóm hành động. Joystick quy đổi tọa độ con trỏ theo kích thước thực để giữ độ nhạy; ca hồi quy xác nhận cùng lực di chuyển ở ba tỷ lệ. Bằng chứng `test-results/responsive-controls.json`, `test-results/ui/responsive-controls-landscape.jpg` và `responsive-controls-small-phone.jpg`.
- **7/7 nhóm smoke check** đạt cả bản đóng gói local riêng và HTTPS production: deep links, API/WebSocket, MIME CSS/JS, file thiếu trả 404/no-store, media ảnh, CORS và phiên khách. Báo cáo `test-results/production-preview.json` chứa lượt production mới nhất.
- **23/23 nhóm tích hợp** và **9/9 kiểm tra đầu vào** đã chạy lại trên hostname `trianttn` trong đợt audit này, trước các thay đổi camera/giao diện. Kiểm tra backend với 25 khách, 25 ghế và 1.000 gói di chuyển cũng chạy trên production; không đo FPS thiết bị.
- Trình duyệt production đã xác nhận hai khách có danh tính riêng, cùng một admin, hiển thị đủ ba người; gửi hoa, lưu bút, dấu ấn; admin ẩn lưu bút và người xem cập nhật; quyền điều khiển máy chiếu trên điện thoại.
- Đã quan sát slide trên bảng 3D, sơ đồ Slide 4 ở chế độ 2D, YouTube phát hình thật; nút bật tiếng đổi trạng thái muted, lệnh dừng cả phòng dừng video người xem. Chưa xác nhận âm thanh phát qua loa thiết bị.
- Ảnh lưu niệm 2D được tạo đúng PNG 1280×720, có ảnh sơ đồ và khung. Sự kiện tải file gốc của trình duyệt thử nghiệm bị timeout; chưa kết luận thao tác tải xuống native đạt.
- Camera có **0.5× / 1× / 2×**, mặc định góc rộng trên điện thoại khi chưa có lựa chọn lưu. Đổi zoom chỉ đổi projection, không đẩy camera qua vật cản. Thực tế giao diện đổi khung hình và giữ mức đã chọn sau reload.
- Nút **Xoay ngang** mở toàn màn hình và thử khóa hướng landscape. Trình duyệt audit mở được fullscreen nhưng không hỗ trợ khóa hướng, ứng dụng hiện hướng dẫn bật tự xoay. Đã kiểm tra bố cục 320×740, 390×844, 844×390 và 1280×720; chưa thử trên điện thoại vật lý.

Lỗi được sửa trong audit: camera toàn lớp đứng ngoài tường; nút hành động chồng joystick; điện thoại thiếu lối mở điều khiển máy chiếu; tiêu đề/nút máy chiếu tràn ngang; thanh điều hướng quá dài ở màn hình vừa. Dùng `h-dvh` để chiều cao lớp học theo vùng hiển thị di động.

Phát hiện tài nguyên thiếu `/assets/*.css` và `/media/*.png` từng trả HTML 200 cùng cache dài; trình duyệt bị mất CSS sau reload. Đã tắt SPA fallback chung, chỉ phục vụ shell cho bốn route ứng dụng bằng ASSETS binding, file thiếu trả JSON 404/no-store. Tài nguyên build chuyển sang namespace CSS mới để tránh cache lỗi cũ. Đã kiểm tra MIME và reload trực quan sau deploy.

Bằng chứng ảnh tại `test-results/ui/`: `camera-mobile-05x.jpg`, `camera-mobile-2x.jpg`, `camera-landscape-final.jpg`, `projector-mobile-final.jpg`, `youtube-viewer.jpg`, `generated-photo.png`. Các phiên UI dùng phòng `qa-ui-audit-20261115`, được đóng sau kiểm tra; không ghi nội dung thử vào phòng thật.

## Kết quả đã xác minh

| Phần kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Kiểm thử tự động | 123/123 đạt | `test-results/unit.tap` |
| Tích hợp HTTP/WebSocket/Supabase Auth thật | 23/23 nhóm đạt | `test-results/live-integration.json` |
| Đầu vào sai và chặn nâng quyền | 9/9 đạt | `test-results/validation.json` |
| Ngăn khóa backend xuất hiện trong cấu hình frontend | 2/2 đạt | `test-results/config-safety.json` |
| Phòng 25 người, 25 ghế | Đạt; 1.000 gói di chuyển/5 giây; đóng hết còn 0 người/0 ghế | `test-results/capacity.json` |
| Lưu bền sau khi dừng và chạy lại backend | Giữ nguyên 2 hoa, 1 lưu bút, 1 dấu ấn và máy chiếu revision 2 của phòng kiểm thử | `test-results/persistence.json` |
| TypeScript và build sản xuất | Đạt cho frontend và Worker | `npm run build` |
| Tệp ảnh/slide/bản đồ | 5 tài nguyên trả HTTP 200 và đúng MIME ảnh | Kiểm tra HTTP trực tiếp |

Các ca logic cũ không được dùng làm bằng chứng thao tác giao diện. Kiểm tra cấu hình và restart lưu bền thuộc đợt 14/11; unit, build, tích hợp, validation và công suất production được cập nhật ngày 15/11 như mục mới nhất ở trên.

## Sửa slide trắng trên bảng 3D

Ảnh người dùng cung cấp cho thấy màn chiếu trắng và viền hình thoi. Đã tái hiện ở boundary thư viện: `applyProps(material, { map: texture })` của R3F đang cài gắn texture nhưng giữ nguyên `material.version = 0`; shader ban đầu không có map không được yêu cầu biên dịch lại. Đã đặt key material theo UUID texture để material được tạo lại khi canvas sẵn sàng; dùng MeshBasicMaterial không chịu ánh sáng/tone mapping của lớp học, khai báo sRGB cho CanvasTexture. Viền ring bốn cạnh được thay bằng khung chữ nhật phía sau màn chiếu.

Ba ca hồi quy chạy component thật với React/canvas/Image boundary mô phỏng: thay material khi có texture, vẽ SVG/JPG và tăng version upload, ảnh cũ không ghi đè ảnh mới và lỗi ảnh hiển thị đúng tên slide. Cả bốn URL media trả HTTP 200 với MIME ảnh đúng. Lượt audit production mới nhất đã quan sát trực tiếp slide trên bảng 3D; hạn chế localhost bên dưới là lịch sử.

Tham khảo: [Three.js về material.needsUpdate và thay đổi map](https://threejs.org/manual/pages/materials.html), [quản lý màu của texture](https://threejs.org/manual/pages/color-management.html).

## Đổi sang tên miền phụ trianttn

Địa chỉ hiện tại: **https://trianttn.ducloiphan.cyou**. Version `f9552171-b324-4599-8085-b8ac48ea400e`, Custom Domain trỏ cùng Worker đang chứa dữ liệu/secrets production. Route cũ `ducloiphan.cyou/*` đã được gỡ và kiểm tra lại qua API để tên miền gốc dùng được cho dự án khác; giữ nguyên DNS gốc, không tạo redirect từ gốc.

Lượt đổi hostname ban đầu đạt **5/5 nhóm smoke check**. Đợt audit sau đó đã chạy lại **23/23 nhóm tích hợp** trên hostname mới và mở rộng smoke check thành **7/7**, xem mục kết quả mới nhất. Trình duyệt cần đăng nhập lại khi chuyển hostname.

## Triển khai production ban đầu ngày 15/11/2026

- URL: **https://ducloiphan.cyou**. Cloudflare zone Active; nameserver `armando.ns.cloudflare.com` và `rose.ns.cloudflare.com`. Wrangler OAuth đã xác minh đúng tài khoản chứa zone.
- Version: `aaf172dd-4321-45fa-8bb0-96a8af54022b`. Worker Route `ducloiphan.cyou/*` phục vụ static assets, SPA, API và WebSocket; giữ bản ghi A/AAAA proxied hiện có. Namespace Workers của tài khoản là `ducloiphan`, endpoint workers.dev của ứng dụng bị tắt theo cấu hình.
- Có JWT secret ngẫu nhiên riêng cho production và Supabase backend secret; không đưa giá trị vào source/frontend, file JSON secret tạm được xóa sau lệnh. Khóa Supabase hiện có chưa được thay tại project; chủ dự án vẫn cần thay khóa từng bị đưa vào frontend trước đây rồi cập nhật secret Worker.
- `npm run deploy:check` đạt; đã bỏ `_redirects` cũ của Pages khỏi build Workers để không gây vòng lặp.
- **5/5 nhóm smoke check trên HTTPS production đạt**: SPA deep links, API không bị SPA nuốt, 4 ảnh/slide đúng MIME, origin đúng/sai, phiên khách và WebSocket. `/api/health` trả HTTP 200, `ok: true`, `authConfigured: true`. Bằng chứng: `test-results/production-smoke.json`.
- **23/23 nhóm tích hợp trên chính production đạt**: tài khoản admin thật, duyệt/thu hồi giáo viên tạm, nhiều khách và admin observer, ghi/lấy/kiểm duyệt hoa/lưu bút/dấu ấn, revision máy chiếu, tín hiệu chia sẻ màn hình và ghế. Báo cáo ghi `base: https://ducloiphan.cyou` tại `test-results/live-integration.json`. Tài khoản QA tạm đã được dọn, dữ liệu QA chỉ nằm trong phòng thử riêng.
- Chưa đo hình/tiếng WebRTC thực, UI/GPU và tải media trên production. Chưa cấu hình TURN. Dữ liệu phòng local không được tự sao chép sang kho production; tài khoản Supabase được giữ.
- Hướng dẫn vận hành/cập nhật: [triển khai tên miền](docs/10_TRIEN_KHAI_DUCLOIPHAN.md).

## Trình chiếu chung bổ sung ngày 15/11

- Dán link YouTube hợp lệ và mốc bắt đầu; lưu nguồn chiếu thật, phát/dừng/tua đồng bộ, vị trí cho người vào sau, đồng hồ server và revision chống ghi đè thao tác mới. Link ngoài YouTube và khách gửi lệnh bị từ chối.
- Chia sẻ màn hình/cửa sổ/tab dùng `getDisplayMedia` ngay từ thao tác bấm; yêu cầu cả hình và tiếng nguồn được chọn, không bật micro/camera. UI có bật tiếng theo chính sách autoplay, bản xem trước của người phát tắt tiếng, báo nguồn không có track tiếng và báo video bị chặn nhúng.
- WebRTC chuyển track qua kết nối tới từng người xem; tín hiệu chỉ được server chuyển giữa người phát hiện tại và người xem đúng phiên. Kiểm tra guest giả offer, giả fromId, phiên cũ, tín hiệu sang người thứ ba, SDP sai; không phát tín hiệu cho cả phòng.
- Kiểm thử transport qua PeerConnection mô phỏng: offer hình/tiếng, answer, xếp ICE đến sớm, retry sau lỗi, dọn peer khi rời lớp. Kiểm thử hook qua React/capture mô phỏng: hủy chọn nguồn vẫn giữ phiên cũ, backend từ chối thì dừng track mới, rời lớp khi picker chưa trả kết quả, mất kết nối và sự kiện kết thúc từ phiên cũ.
- Qua backend/WebSocket thật: người xem nhận cùng nguồn YouTube, pause/seek, người vào sau nhận đúng mốc; screen metadata có ID người phát từ phiên server, tín hiệu được chuyển đúng đích; thu hồi quyền dừng nguồn đang chia sẻ.
- Có giao diện chiếu ở cửa sổ phóng to, bảng 3D và 2D; chỉ một bộ phát media ở một vị trí mỗi lúc. Chưa xác minh trực quan do cổng quyền trình duyệt còn chặn localhost, kể cả sau khi người dùng đồng ý trong chat.

Các ca SDP/ICE/track mô phỏng và routing WebSocket không chứng minh đã truyền hình/tiếng thực tế giữa hai trình duyệt. Chưa kiểm tra loa nghe được, picker của hệ điều hành, nhúng YouTube thực, bố cục, hoặc mạng khác nhau. Chưa cấu hình TURN; STUN mặc định không đảm bảo kết nối qua mọi NAT/firewall. Mesh một người phát tới từng người xem chưa được đo tải media. Xem [hướng dẫn và giới hạn](docs/09_TRINH_CHIEU_CHUNG.md).

## Luồng đã chạy thật qua backend

- Tài khoản admin đăng nhập, gia hạn phiên; mật khẩu sai bị từ chối.
- Hai khách độc lập, tên tiếng Việt; ID và role tự gửi không thể giả admin.
- Đăng ký giáo viên → chờ duyệt → admin duyệt → đăng nhập được → xuất hiện ở danh sách nhận hoa. Khách và giáo viên không được duyệt tài khoản.
- Thu hồi quyền làm giáo viên mất quyền sửa máy chiếu, mất mục nhận hoa và đóng kết nối lớp của tài khoản đó.
- Ba người chơi và một kết nối admin theo dõi; admin theo dõi không làm tăng số nhân vật/ghế.
- Tặng hoa lưu bền, tăng tổng thật, phát một sự kiện cho người xem; gửi lại bị 409. Hai yêu cầu đồng thời chỉ một yêu cầu được ghi.
- Loại hoa giả, khóa `__proto__`, ghi chú quá dài, người nhận không còn hợp lệ bị từ chối và không tăng số hoa.
- Lưu bút tiếng Việt lưu đúng nội dung, tác giả lấy từ phiên thật; gửi liên tục bị 429. Khách không được ẩn/bỏ ẩn; bản công khai và bản kiểm duyệt nhất quán.
- Tường dấu ấn lưu thật; kiểm duyệt, ẩn, duyệt lại; khách không được đọc danh sách ẩn. Dữ liệu dấu ấn backend cũ được chuyển sang kho mới mà không tạo bản sao.
- Máy chiếu dùng trạng thái backend chung, có revision; khách không được đổi slide; giáo viên đổi được, người vào sau nhận đúng slide. Chế độ nhìn lại chọn đúng dấu ấn được phép hiển thị.
- Không cho tạo thông báo tặng hoa/lưu bút giả bằng cách gửi thẳng lệnh WebSocket.
- Ghế sai ID, ngoài tầm và ghế giáo viên đối với khách bị từ chối. Chỉ một người ngồi một ghế; không di chuyển khi ngồi; rời lớp giải phóng ghế. Người đang ngồi vẫn giữ ghế qua lần hibernation dù thời hạn lease cũ đã hết.
- Ngoại hình và trạng thái hoạt động được phát tới người khác; người đứng yên không bị xóa sau 12 giây.
- Tổng hoa lịch sử vẫn đúng khi người nhận bị thu hồi quyền.
- JSON sai, payload quá lớn, email/tên/mật khẩu đăng ký sai và thao tác cấp admin qua API duyệt đều bị chặn trước khi tạo/cấp quyền tài khoản.

Các phòng kiểm thử đều mang tiền tố `qa-*`. Tài khoản giáo viên tạm được dọn sau kiểm thử; không sửa quyền của giáo viên thật. Kiểm thử công suất đo xử lý backend, không đo FPS hay khả năng dựng 25 nhân vật trên thiết bị cụ thể.

## Những lỗi đã sửa trong đợt này

1. Tặng hoa còn phụ thuộc kết nối Supabase trực tiếp nên báo “Chưa kết nối CSDL để lưu hoa tri ân”. Đã chuyển sang API xác minh người gửi/người nhận và giao dịch lưu bền.
2. Lưu bút ghi ở localStorage, máy chiếu đồng bộ cục bộ; đã chuyển sang cùng backend dùng storage và WebSocket. Không báo thành công khi chưa ghi được dữ liệu.
3. Dữ liệu mẫu và đăng nhập demo không còn được dùng thay cho dữ liệu/tài khoản thật.
4. Ghế ngồi không còn tự xác nhận thành công khi mất kết nối hoặc quá thời gian chờ; server kiểm tra ID, khoảng cách, quyền và trạng thái ghế.
5. Thông báo hoa/lưu bút được phát sau khi lưu, tránh gửi hai lần từ client và server.
6. Bộ tải dữ liệu tránh phản hồi cũ ghi đè phản hồi mới; kết nối lại dùng token đã gia hạn. Quyền thay đổi được kiểm tra lại thay vì tin role do client tự gửi.
7. Mã giao diện giới hạn lớp nổi của cảnh 3D để nhãn tên không đè hộp thoại; bổ sung đường chuyển 2D khi cảnh 3D lỗi và tạo ảnh từ màn chiếu 2D. Lượt audit production đã xác nhận hộp thoại không bị nhãn đè và ảnh 2D tạo được.
8. Khóa backend chuyển sang `.dev.vars` và bị bỏ qua bởi Git; frontend không cần Supabase key. Build chặn cả secret API key mới lẫn JWT service-role trong `VITE_*`.

## Phần chưa xác minh và giới hạn

Lịch sử: công cụ từ chối origin `http://localhost:5173`; không vượt chặn. Lượt audit hiện tại dùng origin production được phép, đã xác nhận các luồng UI nêu trên. Còn chưa xác minh: tải PNG qua hộp tải native, tiếng thật qua loa, chia sẻ màn hình có tiếng giữa hai máy/hai mạng, thao tác cảm ứng/FPS trên điện thoại vật lý. Chưa cấu hình TURN để hỗ trợ những mạng không nối WebRTC trực tiếp được. Không tuyên bố chạy hoàn chỉnh trên mọi thiết bị.

Các phép đo công suất và restart storage ban đầu chạy ở local; lượt triển khai hiện tại đã bổ sung kiểm thử HTTPS production như mục trên. Các khóa server từng có trong cấu hình frontend trước đợt sửa; việc bỏ khỏi mã hiện tại không thay thế thao tác thay khóa cũ tại Supabase. Migration và dữ liệu local không tự chuyển sang môi trường Cloudflare khi deploy.

Giới hạn một hoa áp dụng cho từng phiên khách/giáo viên; ứng dụng không xác minh một người thật có dùng nhiều phiên khác nhau hay không.
