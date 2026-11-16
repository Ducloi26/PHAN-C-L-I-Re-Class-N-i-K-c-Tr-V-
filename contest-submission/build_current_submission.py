"""Build the current, factual Re:Class contest materials from QA screenshots."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import math
import shutil
import struct
import subprocess
import wave
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/reclass-submission'
PDF_DIR = ROOT / 'output/pdf'
TMP = ROOT / 'tmp/pdfs/reclass-submission'
UI = ROOT / 'test-results/ui'
for folder in [OUT, PDF_DIR, TMP]:
    folder.mkdir(parents=True, exist_ok=True)
for name, filename in [('Arial', 'arial.ttf'), ('ArialBold', 'arialbd.ttf'), ('ArialItalic', 'ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(name, f'C:/Windows/Fonts/{filename}'))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='ArialBold', italic='ArialItalic', boldItalic='ArialBold')

GREEN = '#0B342F'
GOLD = '#F3D18A'
INK = '#183D37'
MUTED = '#526861'
CREAM = '#FAF7EF'
URL = 'https://trianttn.ducloiphan.cyou'
VIDEO_URL = URL + '/gioi-thieu.html'
REPO_URL = 'https://github.com/Ducloi26/PHAN-C-L-I-Re-Class-N-i-K-c-Tr-V-'
TITLE = 'Re:Class - Trở Về Lớp Học Ký Ức'

DESCRIPTION = '''Re:Class - Trở Về Lớp Học Ký Ức là website tương tác 3D dành cho ngày Nhà giáo Việt Nam 20/11, giúp thầy cô, sinh viên và những người bạn gặp lại nhau dù không thể trực tiếp về trường.

Hành trình bắt đầu bằng cổng thời gian, đưa người xem qua những tấm ảnh kỷ niệm cùng âm nhạc và lời tri ân. Bước vào lớp học, người dùng có thể chọn nhân vật, di chuyển, tìm chỗ ngồi, nhìn thấy những người cùng tham gia, tặng hoa cho giáo viên đã được duyệt, viết sổ lưu bút, ghim kỷ niệm và chụp ảnh lưu niệm. Giáo viên và quản trị viên có thể trình chiếu slide, YouTube hoặc chia sẻ màn hình để cả phòng cùng theo dõi. Website hỗ trợ máy tính và điện thoại, có điều chỉnh góc nhìn và chế độ 2D.

Sản phẩm kết hợp trải nghiệm gặp gỡ trực tuyến với việc lưu giữ lời nhắn để người đến sau vẫn có thể đọc. Qua đó, Re:Class mang đến một cách tri ân gần gũi bằng công nghệ, với thông điệp: “Không khoảng cách nào ngăn một lời cảm ơn.”'''

TOOLS = '''Tác giả: Phan Đức Lợi, thực hiện cá nhân. Tôi xác định ý tưởng và thông điệp tri ân, lựa chọn tính năng, cung cấp ảnh kỷ niệm, đưa ra yêu cầu trải nghiệm và trực tiếp dùng thử, phản hồi để hoàn thiện sản phẩm.

Công nghệ sử dụng: React, TypeScript, Vite và Tailwind CSS cho giao diện; Three.js, React Three Fiber và Drei cho không gian 3D; Canvas 2D và canvas-confetti cho hiệu ứng; WebSocket, Cloudflare Workers và Durable Objects để đồng bộ và lưu dữ liệu phòng; Supabase Auth cho tài khoản giáo viên/quản trị; YouTube IFrame API và WebRTC cho trình chiếu; HTML Audio và Web Audio API cho âm thanh.

Tôi sử dụng Codex/ChatGPT hỗ trợ viết và chỉnh sửa mã nguồn, phân tích lỗi, xây dựng và chạy kiểm thử, tinh chỉnh giao diện, triển khai website và biên soạn tài liệu. Nội dung này công khai vai trò hỗ trợ của AI; các ảnh lập trình minh họa lấy từ Pexels có ghi công trong sản phẩm.'''

form = f'''# NỘI DUNG ĐIỀN HỒ SƠ RE:CLASS

Tác giả: Phan Đức Lợi - thực hiện cá nhân.

## Tên tác phẩm
{TITLE}

## Loại hình
Website

## Mô tả tác phẩm
{DESCRIPTION}

## Link xem / chơi tác phẩm
{URL}

## Link video giới thiệu 20-60 giây
{VIDEO_URL}

Video dài 48 giây, giới thiệu bằng ảnh giao diện thật và chú thích; có nhạc nền tổng hợp riêng. Tệp MP4 có trong bộ hồ sơ để tải lên YouTube/Drive nếu ban tổ chức yêu cầu nền tảng cụ thể.

## Link GitHub / GitLab
{REPO_URL}

## File thuyết minh
Chọn ReClass-Thuyet-minh.pdf trong bộ hồ sơ (giới hạn biểu mẫu: 5 MB).

## Ảnh đại diện
Chọn ReClass-Anh-dai-dien.png trong bộ hồ sơ (giới hạn biểu mẫu: 5 MB).

## Công cụ sử dụng & vai trò tự thực hiện
{TOOLS}

## Trước khi gửi
Mở thử hai link công khai; chọn đúng PDF và ảnh. Đọc thể lệ, quyền sử dụng nội dung và điều khoản trưng bày trước khi tự xác nhận ô cam kết. Các thông tin cá nhân/lớp/khoa ở phần 01 điền theo thông tin thực tế của tác giả.
'''
(OUT / 'NOI_DUNG_DIEN_FORM.md').write_text(form, encoding='utf-8')

def para(c, text, x, top, width, size=11, color=INK, font='Arial', leading=None):
    style = ParagraphStyle('text', fontName=font, fontSize=size, leading=leading or size*1.48, textColor=HexColor(color), alignment=TA_LEFT)
    p = Paragraph(text, style)
    _, height = p.wrap(width, 2000)
    p.drawOn(c, x, top-height)
    return top-height

def fitted_image(c, path, x, y, width, height, bg=None):
    if bg:
        c.setFillColor(HexColor(bg)); c.roundRect(x, y, width, height, 8, fill=1, stroke=0)
    image = Image.open(path)
    ratio = min(width/image.width, height/image.height)
    w, h = image.width*ratio, image.height*ratio
    c.drawImage(str(path), x+(width-w)/2, y+(height-h)/2, w, h, mask='auto')

PW, PH = 595.276, 841.89
doc = canvas.Canvas(str(PDF_DIR/'ReClass-Thuyet-minh.pdf'), pagesize=(PW, PH), pageCompression=1)
doc.setTitle(TITLE); doc.setAuthor('Phan Đức Lợi')

def page(number, label):
    doc.setFillColor(HexColor(CREAM)); doc.rect(0, 0, PW, PH, fill=1, stroke=0)
    doc.setFillColor(HexColor(GREEN)); doc.rect(0, PH-15, PW, 15, fill=1, stroke=0)
    para(doc, 'RE:CLASS / CODE THE THANKS 2026', 44, PH-39, 360, 8.2, MUTED, 'ArialBold')
    doc.setStrokeColor(HexColor('#D9E0D6')); doc.line(44, 49, PW-44, 49)
    para(doc, 'Phan Đức Lợi | 16/11/2026', 44, 38, 350, 8, MUTED)
    doc.setFont('Arial', 8); doc.setFillColor(HexColor(MUTED)); doc.drawRightString(PW-44, 27, f'{number:02d} / 04')
    para(doc, label.upper(), 44, PH-71, 500, 9, MUTED, 'ArialBold')

def heading(text, top):
    return para(doc, text, 44, top, PW-88, 23, GREEN, 'ArialBold')-17

def section(title, body, y):
    y=para(doc,title,44,y,PW-88,12,GREEN,'ArialBold')-5
    return para(doc,body,44,y,PW-88,10.5)-16

page(1,'Hồ sơ tác phẩm dự thi')
y=para(doc,'Re:Class',44,727,PW-88,47,GREEN,'ArialBold')
y=para(doc,'Trở Về Lớp Học Ký Ức',44,y-8,PW-88,23,GREEN,'ArialBold')
y=para(doc,'Website tương tác 3D / Tác giả: Phan Đức Lợi / Cá nhân',44,y-12,PW-88,10,MUTED)
fitted_image(doc,UI/'story-cover-desktop.jpg',44,298,PW-88,270,GREEN)
para(doc,'Ảnh giao diện mở đầu của sản phẩm.',44,285,PW-88,8,MUTED)
y=para(doc,'Không khoảng cách nào ngăn một lời cảm ơn.',44,254,PW-88,21,GREEN,'ArialBold')
y=para(doc,'Một chuyến trở về dành cho những người chưa thể về trường. Re:Class đưa thầy cô và sinh viên vào cùng một lớp học trực tuyến, để gặp lại nhau, gửi lời tri ân và giữ lại kỷ niệm cho người đến sau.',44,y-15,PW-88,11)
para(doc,f'<link href="{URL}" color="{GREEN}"><b>{URL}</b></link>',44,y-18,PW-88,11)
doc.showPage()

page(2,'Ý tưởng và tính năng')
y=heading('Một lớp học, nhiều cách kết nối.',735)
y=section('Vấn đề cần giải quyết','Không phải ai cũng có thể về trường vào ngày 20/11. Những lời cảm ơn và hình ảnh kỷ niệm thường nằm rải rác, khó tạo cảm giác cùng trở lại một không gian chung.',y)
y=section('Đối tượng và giải pháp','Dành cho thầy cô, sinh viên, cựu sinh viên và khách tham quan. Website kết hợp lớp học 3D gặp gỡ thời gian thực với sổ lưu bút và tường kỷ niệm được lưu lại; không cần online cùng giờ mới đọc được lời nhắn.',y)
features=[
('01 / Mở cổng ký ức','Cổng thời gian đưa ba ảnh kỷ niệm và hai ảnh lập trình tự bay theo vòng xoáy trong khoảng 6.5 giây. Chạm ảnh để giữ lại đọc lời nhắn; QR ở cuối giữ lại để quét.'),
('02 / Gặp nhau trong lớp 3D','Chọn avatar, di chuyển, ngồi ghế và nhìn thấy thành viên khác. Khách vào bằng tên hiển thị; giáo viên dùng tài khoản được duyệt.'),
('03 / Gửi lời tri ân','Tặng hoa tới giáo viên trong danh sách thật, viết lưu bút và ghim dấu ấn. Dữ liệu được lưu ở backend, có phân quyền và kiểm duyệt.'),
('04 / Cùng xem và lưu khoảnh khắc','Slide, YouTube và chia sẻ màn hình cho cả phòng; nhạc nền dừng khi chiếu trực tiếp. Có chụp ảnh lưu niệm, camera 0.5x/1x/2x và hỗ trợ màn hình điện thoại.'),
]
for a,b in features:y=section(a,b,y)
assert y>75, y
doc.showPage()

page(3,'Cách thực hiện và đóng góp')
y=heading('Công nghệ phục vụ trải nghiệm.',735)
stack=[
('Giao diện và đồ họa','React, TypeScript, Vite, Tailwind CSS; Three.js, React Three Fiber và Drei dựng lớp học, avatar và camera. Canvas 2D tạo cổng thời gian; canvas-confetti tạo pháo hoa.'),
('Đồng bộ và dữ liệu','Cloudflare Workers xử lý API, Durable Objects quản lý và lưu dữ liệu phòng, WebSocket phát trạng thái tới thành viên. Supabase Auth phục vụ tài khoản giáo viên và quản trị; quyền được kiểm tra tại backend.'),
('Trình chiếu và âm thanh','YouTube IFrame API cho video; WebRTC cho chia sẻ màn hình/tab. HTML Audio phát nhạc nền; Web Audio API tạo hiệu ứng. Nhạc nền tạm dừng hoàn toàn khi chiếu trực tiếp hoặc mở slide lớn.'),
('Phần việc của tác giả','Phan Đức Lợi thực hiện cá nhân: định hướng ý tưởng và thông điệp, lựa chọn tính năng, cung cấp ảnh kỷ niệm, yêu cầu và đánh giá trải nghiệm; trực tiếp dùng thử và phản hồi để hoàn thiện.'),
('Minh bạch hỗ trợ AI','Codex/ChatGPT hỗ trợ viết và sửa mã, phân tích lỗi, xây dựng và chạy kiểm thử, tinh chỉnh giao diện, triển khai website và biên soạn tài liệu. Hồ sơ không coi mã do AI hỗ trợ là phần tác giả tự viết hoàn toàn.'),
]
for a,b in stack:y=section(a,b,y)
assert y>75,y
doc.showPage()

page(4,'Hướng dẫn trải nghiệm và kiểm chứng')
y=heading('Mở web và cùng trở về.',735)
y=section('Trải nghiệm trong khoảng một phút',f'1. Mở <link href="{URL}" color="{GREEN}">{URL}</link>.<br/>2. Bấm Trở về lớp học để ảnh tự bay qua vòng xoáy; chạm ảnh nếu muốn giữ lại đọc lời nhắn. Nút Vào lớp ngay luôn sẵn để đi tiếp trực tiếp.<br/>3. Nhập tên, chọn nhân vật và vào lớp; không cần đợi xem trước 3D tải xong.<br/>4. Di chuyển, tìm ghế; mở Tặng hoa, Sổ lưu bút hoặc Dấu ấn.<br/>5. Điện thoại có joystick, zoom và nút Xoay ngang; một số trình duyệt cần xoay máy thủ công.',y)
y=section('Kết quả kiểm tra hiện có','129 ca tự động đạt; build TypeScript/Vite đạt. Đợt kiểm tra backend trước đó đạt 23 nhóm tích hợp và mô phỏng 25 khách / 25 ghế. Đây là kết quả kiểm tra chức năng và backend, không phải cam kết FPS hoặc số người tối đa trên mọi thiết bị.',y)
y=section('Phạm vi và hướng phát triển','Âm thanh từ trình chiếu cần thao tác Bật tiếng của người xem. Chia sẻ âm thanh màn hình phụ thuộc nguồn và trình duyệt; truyền giữa các mạng còn cần kiểm chứng thêm và bổ sung TURN khi cần. Hướng phát triển: mở phòng theo lớp, quản lý bộ ảnh riêng và tối ưu thêm trải nghiệm di động.',y)
y=section('Nguồn tư liệu','Ảnh lớp và QR do tác giả cung cấp. Hai ảnh lập trình minh họa: luis gomes (Pexels 546819), Nemuel Sereti (Pexels 6424590), có ghi công trong web. Nhạc nền website theo nguồn tác giả chọn: YouTube zJs0UaWbuNU. Video giới thiệu trong bộ hồ sơ dùng nhạc tổng hợp riêng, không sử dụng bản nhạc YouTube này.',y)
y=section('Video và mã nguồn',f'Video giới thiệu 48 giây bằng ảnh giao diện thực tế: <link href="{VIDEO_URL}" color="{GREEN}">{VIDEO_URL}</link>.<br/>Mã nguồn GitHub công khai: <link href="{REPO_URL}" color="{GREEN}">{REPO_URL}</link>.',y)
assert y>65,y
doc.save()

# Vector title cards with unchanged, proportionally fitted UI screenshots.
frames=[
('CODE THE THANKS 2026 / PHAN ĐỨC LỢI','Re:Class - Trở Về Lớp Học Ký Ức','Một chuyến trở về cho những người chưa thể về trường.', 'story-cover-desktop.jpg'),
('MỞ CỔNG KÝ ỨC','Những ngày cùng nhau','Ảnh kỷ niệm, âm nhạc và một lời cảm ơn gửi tới thầy cô.', 'memory-journey-desktop.jpg'),
('GẶP LẠI TRONG LỚP 3D','Một chỗ ngồi. Một cuộc gặp.','Chọn nhân vật, di chuyển và cùng bạn bè trở lại lớp học.', 'classroom-desktop.jpg'),
('GỬI LỜI TRI ÂN','Giữ lại điều muốn nói','Tặng hoa, viết lưu bút, ghim kỷ niệm để người đến sau vẫn đọc được.', 'story-features-desktop.jpg'),
('CÙNG XEM, CÙNG NHỚ','Kết nối cả phòng','Trình chiếu slide, YouTube hoặc chia sẻ màn hình; chụp ảnh lưu niệm.', 'responsive-controls-landscape.jpg'),
('KHÔNG KHOẢNG CÁCH NÀO','Ngăn một lời cảm ơn.','Phan Đức Lợi / Website dự thi CODE THE THANKS 2026', 'memory-qr-desktop.jpg'),
]
video_doc=canvas.Canvas(str(TMP/'video-cards.pdf'),pagesize=(1280,720),pageCompression=1)
for i,(tag,title,caption,shot) in enumerate(frames):
    video_doc.setFillColor(HexColor(GREEN));video_doc.rect(0,0,1280,720,fill=1,stroke=0)
    video_doc.setFillColor(HexColor(GOLD));video_doc.rect(40,674,55,4,fill=1,stroke=0)
    para(video_doc,tag,40,657,1120,12,GOLD,'ArialBold')
    para(video_doc,title,40,627,1200,32,'#FFF7E4','ArialBold')
    fitted_image(video_doc,UI/shot,40,141,1200,414,'#061F1C')
    para(video_doc,caption,40,121,1200,18,'#F4E9CF')
    para(video_doc,'trianttn.ducloiphan.cyou',40,67,900,16,GOLD,'ArialBold')
    para(video_doc,f'{i+1:02d} / 06',1150,65,100,13,GOLD)
    para(video_doc,'Ảnh giao diện thực tế / Video giới thiệu',40,33,900,9,'#ADC6BB')
    video_doc.showPage()
video_doc.save()

poppler=shutil.which('pdftoppm')
subprocess.run([poppler,'-png','-r','72',str(TMP/'video-cards.pdf'),str(TMP/'frame')],check=True)
shutil.copyfile(TMP/'frame-1.png',OUT/'ReClass-Anh-dai-dien.png')
subprocess.run([poppler,'-png','-r','95',str(PDF_DIR/'ReClass-Thuyet-minh.pdf'),str(TMP/'thuyet-minh')],check=True)

# A quiet original synthesized instrumental bed, independent of the website track.
rate=22050; duration=48
chords=[(261.63,329.63,392.00),(220.00,261.63,329.63),(174.61,220.00,261.63),(196.00,246.94,293.66)]
with wave.open(str(TMP/'video-bed.wav'),'wb') as wav:
    wav.setparams((1,2,rate,0,'NONE','not compressed'))
    samples=bytearray()
    for n in range(rate*duration):
        t=n/rate; beat=t%4; fade=min(1,t/2,(duration-t)/2)
        envelope=math.sin(math.pi*beat/4)**2
        chord=chords[int(t//4)%4]
        value=sum(math.sin(2*math.pi*freq*t) for freq in chord)/3
        samples.extend(struct.pack('<h',int(32767*.09*value*envelope*fade)))
    wav.writeframes(samples)
ffmpeg=ROOT/'test-results/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe'
playlist=''.join(f"file '{(TMP/f'frame-{i+1}.png').as_posix()}'\nduration 8\n" for i in range(6))
playlist+=f"file '{(TMP/'frame-6.png').as_posix()}'\n"
(TMP/'frames.txt').write_text(playlist,encoding='utf-8')
subprocess.run([str(ffmpeg),'-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i',str(TMP/'frames.txt'),'-i',str(TMP/'video-bed.wav'),'-t','48','-vf','fps=24,fade=t=in:st=0:d=0.7,fade=t=out:st=47.3:d=0.7','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(OUT/'ReClass-Gioi-thieu-48s.mp4')],check=True)
shutil.copyfile(PDF_DIR/'ReClass-Thuyet-minh.pdf',OUT/'ReClass-Thuyet-minh.pdf')
for path in [OUT/'ReClass-Anh-dai-dien.png',PDF_DIR/'ReClass-Thuyet-minh.pdf']:
    assert path.stat().st_size<5_000_000,(path,path.stat().st_size)
print(json.dumps({'output':str(OUT),'files':[{ 'name':p.name,'bytes':p.stat().st_size } for p in OUT.iterdir() if p.is_file()]},ensure_ascii=False,indent=2))
