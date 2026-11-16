# BỘ HỒ SƠ DỰ THI CHÍNH THỨC — CODE THE THANKS 2026
**Trường Đại học Tây Nguyên — Bộ môn Công nghệ Thông tin**  
**Chủ đề:** “Sáng tạo không giới hạn – Tri ân bằng công nghệ”  
**Tác phẩm:** **LỚP HỌC KÝ ỨC — NƠI CHÚNG TA TRỞ VỀ**  
**Tên kỹ thuật:** `lop-hoc-ky-uc-2026`  

---

## 1. MỤC LỤC TÀI LIỆU TRONG THƯ MỤC `contest-submission/`

Toàn bộ tài liệu đã được chuẩn hóa theo đúng cấu trúc yêu cầu của Thể lệ cuộc thi:

1. [GIOI_THIEU_Y_TUONG.md](file:///d:/20_11/contest-submission/GIOI_THIEU_Y_TUONG.md) — Đoạn văn giới thiệu ý tưởng chính thức (165 từ chuẩn), bối cảnh và giá trị nhân văn.
2. [CONG_NGHE_VA_DONG_GOP.md](file:///d:/20_11/contest-submission/CONG_NGHE_VA_DONG_GOP.md) — Báo cáo kiến trúc công nghệ, phân định đóng góp minh bạch giữa Lập trình viên và AI, các thách thức kỹ thuật và bài học kinh nghiệm.
3. [KICH_BAN_VIDEO_60S.md](file:///d:/20_11/contest-submission/KICH_BAN_VIDEO_60S.md) — Kịch bản phân cảnh từng giây (Storyboard), lời thoại voice-over, chỉ dẫn góc quay và hướng dẫn dựng video 55 giây cho Vòng 1.
4. [KICH_BAN_DEMO_3_PHUT.md](file:///d:/20_11/contest-submission/KICH_BAN_DEMO_3_PHUT.md) — Kịch bản 10 bước quay video demo kỹ thuật dự phòng (tối đa 3 phút) phản ánh 100% chức năng chạy thật.
5. [KICH_BAN_THUYET_TRINH_4_PHUT.md](file:///d:/20_11/contest-submission/KICH_BAN_THUYET_TRINH_4_PHUT.md) — Lời thoại thuyết trình sân khấu 4 phút chuẩn cho đêm Gala Chung kết 20/11 kèm phương án dự phòng sự cố.
6. [CAU_HOI_PHAN_BIEN.md](file:///d:/20_11/contest-submission/CAU_HOI_PHAN_BIEN.md) — Bộ 15 câu hỏi trọng tâm và đáp án kỹ thuật sắc bén phục vụ 2 phút vấn đáp với Ban Giám khảo.
7. [CAPTION_FACEBOOK.md](file:///d:/20_11/contest-submission/CAPTION_FACEBOOK.md) — Kế hoạch truyền thông, bài đăng Fanpage kêu gọi bình chọn tự nhiên cho Vòng 1 (18-19/11).
8. [CHECKLIST_NOP_BAI.md](file:///d:/20_11/contest-submission/CHECKLIST_NOP_BAI.md) — Danh mục kiểm tra từng đầu việc trước hạn chót 20:00 ngày 17/11/2026.
9. [HOSO_DU_THI.docx](file:///d:/20_11/contest-submission/HOSO_DU_THI.docx) — Bản Word hoàn chỉnh sẵn sàng in ấn hoặc nộp file trực tiếp cho Ban Tổ chức.
10. [SLIDE_CHUNG_KET.pptx](file:///d:/20_11/contest-submission/SLIDE_CHUNG_KET.pptx) — File trình chiếu PowerPoint 3 slide chuẩn phong cách trang trọng, hiện đại, hình lớn chữ gọn.

---

## 2. TÓM TẮT SẢN PHẨM THỰC TẾ ĐÃ HOÀN THIỆN (PROOF OF WORK)

- **Mã nguồn chạy thật:** 100% hoạt động trên trình duyệt web, không mockup tĩnh.
- **Không gian 3D WebGL:** Dựng Three.js low-poly lớp học Đại học Tây Nguyên (bàn ghế, bục giảng, bảng đen, khẩu hiệu 20/11, ánh sáng ấm, hoa sen, micro, laptop).
- **Multiplayer Edge:** Cloudflare Workers Durable Objects đồng bộ WebSocket thời gian thực, quản lý 25 ghế ngồi nguyên tử.
- **Bảo mật Server-side:** PostgreSQL Row-Level Security phân định rạch ròi Khách tham quan và Giáo viên/Admin.
- **Âm thanh Web Audio:** Chuông trường học "Bính... Boong...", tiếng hoa tri ân, audio ducking 0kb asset.
- **Photo Booth 3D:** Đóng khung vàng Đại học Tây Nguyên 20/11 và xuất ảnh PNG an toàn ngay tại client.
- **Chất lượng kiểm định:** **37/37 test cases PASS (100%)**, `npm run build` thành công 0 lỗi.
