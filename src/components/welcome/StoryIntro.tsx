import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Bell, BookOpen, Camera, Heart, MonitorPlay, Move, Pin, Sparkles, Users, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../lib/audioManager';
import { MemoryJourney } from './MemoryJourney';

const chapters = [
  { label: '01 / Một lời hẹn', title: 'Có những người hôm nay chưa thể trở về.', text: 'Một chuyến xe xa, một lịch làm việc bận rộn, hay khoảng cách qua nhiều thành phố. Ngày 20/11 đến, bạn vẫn nhớ một căn phòng, một tiếng gọi tên, một người thầy.', line: 'Khoảng cách có thể xa. Kỷ niệm vẫn rất gần.' },
  { label: '02 / Điều chưa nói', title: 'Có những lời cảm ơn vẫn còn để ngỏ.', text: 'Cảm ơn vì một lần kiên nhẫn giảng lại. Vì lời động viên đúng lúc. Vì đã tin vào chúng em, ngay cả khi chúng em chưa tin vào mình.', line: 'Hôm nay, hãy gửi đi điều bạn vẫn muốn nói.' },
  { label: '03 / Cùng trở về', title: 'Ở đây, tiếng chuông vẫn đợi bạn.', text: 'Lớp Học Ký Ức mở một cánh cửa để thầy cô, sinh viên và những người bạn gặp lại nhau. Bạn có thể ghé vào cùng mọi người, hoặc để lại lời tri ân để người đến sau đọc được.', line: 'Một lớp học. Nhiều nơi chốn. Chung một lời tri ân.' },
];

const features = [
  { icon: Users, number: '01', name: 'Gặp nhau trong lớp 3D', text: 'Chọn avatar, đi quanh lớp, tìm một chỗ ngồi và nhìn thấy những người đang cùng tham gia.', hint: 'Điện thoại: kéo joystick để đi, vuốt vùng trống để nhìn quanh.' },
  { icon: Heart, number: '02', name: 'Gửi một đóa hoa', text: 'Chọn thầy cô trong danh sách đã được duyệt, chọn hoa và gửi kèm một lời cảm ơn ngắn.', hint: 'Mỗi lượt tham gia tặng một đóa hoa tới mỗi thầy cô.' },
  { icon: BookOpen, number: '03', name: 'Viết điều chưa nói', text: 'Sổ lưu bút giữ lời chúc của bạn. Không cần online cùng giờ, người đến sau vẫn có thể đọc.', hint: 'Mở Sổ lưu bút để viết lời chúc chung hoặc gửi tới thầy cô.' },
  { icon: Pin, number: '04', name: 'Để lại một dấu ấn', text: 'Ghim một kỷ niệm lên bức tường của lớp. Những dấu ấn được duyệt có thể xuất hiện trong trình chiếu chung.', hint: 'Đến gần bức tường hoặc bấm Dấu ấn để mở.' },
  { icon: MonitorPlay, number: '05', name: 'Cùng xem, cùng nhớ', text: 'Xem slide, YouTube hoặc màn hình do giáo viên và quản trị viên trình chiếu cho cả phòng.', hint: 'Bấm màn chiếu để xem lớn; bật tiếng khi muốn nghe.' },
  { icon: Camera, number: '06', name: 'Mang một khoảnh khắc về', text: 'Chụp ảnh kỷ niệm có khung 20/11. Chọn camera 0.5×, 1×, 2× và xoay ngang điện thoại để nhìn lớp thoải mái hơn.', hint: 'Các nút tự co theo màn hình. Có chế độ 2D cho thiết bị cần giao diện nhẹ.' },
];

export function StoryIntro({ onFinish, returning = false }: { onFinish: () => void; returning?: boolean }) {
  const [stage, setStage] = useState<'cover' | 'journey' | 'story' | 'features'>('cover');
  const [chapter, setChapter] = useState(0);
  const [music, setMusic] = useState(soundManager.getBgmEnabled() && !soundManager.getMuted());
  const [playing, setPlaying] = useState(soundManager.getIsBgmPlaying());
  const [starting, setStarting] = useState(soundManager.getBgmStarting());
  const [effects, setEffects] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try { const saved = localStorage.getItem('lop_hoc_intro_effects'); if (saved !== null) return saved === 'true'; } catch { /* Optional preference. */ }
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstRef = useRef<confetti.CreateTypes | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastSpark = useRef(0);
  useEffect(() => soundManager.subscribe(() => {
    setMusic(soundManager.getBgmEnabled() && !soundManager.getMuted());
    setPlaying(soundManager.getIsBgmPlaying());
    setStarting(soundManager.getBgmStarting());
  }), []);

  const stopEffects = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    burstRef.current?.reset();
  };
  const celebrate = (gentle = false) => {
    stopEffects();
    if (!effects || document.hidden || !canvasRef.current) return;
    burstRef.current ??= confetti.create(canvasRef.current, { resize: true, useWorker: false });
    const compact = window.innerWidth < 768 || window.innerHeight < 500;
    const fire = (x: number, y: number) => {
      if (document.hidden) return;
      void burstRef.current?.({ particleCount: compact ? 22 : 40, spread: 360, startVelocity: compact ? 20 : 32, gravity: 0.24, decay: 0.94, ticks: 145, scalar: compact ? 0.6 : 0.8, shapes: ['circle'], colors: ['#ffd775', '#fff9dc', '#f6a6c1', '#6ee7b7'], origin: { x, y } });
      void burstRef.current?.({ particleCount: compact ? 7 : 12, spread: 360, startVelocity: compact ? 11 : 18, gravity: 0.16, decay: 0.95, ticks: 160, scalar: compact ? 0.65 : 0.95, shapes: ['star'], colors: ['#fff3ba', '#f7c969'], origin: { x, y } });
    };
    const positions = gentle ? [[0.2, 0.3], [0.8, 0.25]] : compact ? [[0.2, 0.25], [0.8, 0.3], [0.5, 0.17]] : [[0.16, 0.28], [0.84, 0.25], [0.4, 0.18], [0.68, 0.32], [0.5, 0.17]];
    positions.forEach(([x, y], i) => {
      if (i === 0) fire(x, y);
      else timers.current.push(setTimeout(() => fire(x, y), i * (gentle ? 380 : 480)));
    });
    if (!gentle) timers.current.push(setTimeout(() => {
      if (document.hidden) return;
      for (const left of [true, false]) void burstRef.current?.({ particleCount: compact ? 18 : 32, angle: left ? 65 : 115, spread: 65, startVelocity: compact ? 26 : 39, gravity: 0.6, ticks: 130, scalar: 0.7, shapes: ['star', 'circle'], colors: ['#f6d692', '#f9b7ca', '#a8e6c7'], origin: { x: left ? 0 : 1, y: 0.85 } });
    }, positions.length * 480));
  };
  const sparkAtPointer = (event: MouseEvent<HTMLDivElement>) => {
    if (!effects || document.hidden || !canvasRef.current || event.detail === 0 || Date.now() - lastSpark.current < 240) return;
    lastSpark.current = Date.now();
    burstRef.current ??= confetti.create(canvasRef.current, { resize: true, useWorker: false });
    void burstRef.current({ particleCount: window.innerWidth < 768 ? 7 : 12, spread: 80, startVelocity: 10, gravity: 0.35, ticks: 60, scalar: 0.65, shapes: ['star'], colors: ['#ffe4a5', '#fff6dd'], origin: { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight } });
  };
  useEffect(() => {
    const pause = () => {
      setPageHidden(document.hidden);
      if (document.hidden) stopEffects();
    };
    document.addEventListener('visibilitychange', pause);
    return () => { document.removeEventListener('visibilitychange', pause); stopEffects(); };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (stage !== 'cover') headingRef.current?.focus({ preventScroll: true });
  }, [stage, chapter]);
  useEffect(() => {
    if (!effects || document.hidden) return;
    timers.current.push(setTimeout(() => celebrate(true), 600));
    return stopEffects;
  }, [effects]);
  const begin = () => {
    stopEffects();
    if (music) soundManager.restartBgm();
    setStage('journey');
  };
  const enterNow = () => {
    stopEffects();
    if (music) soundManager.resumeBgm();
    onFinish();
  };
  const toggleMusic = () => {
    if (music && !playing && !starting && stage !== 'cover') { soundManager.startBgm(); return; }
    const enabled = !music;
    setMusic(enabled); soundManager.setMuted(!enabled);
    if (enabled) soundManager.startBgm(); else soundManager.stopBgm();
  };
  const toggleEffects = () => {
    setEffects(!effects); stopEffects();
    try { localStorage.setItem('lop_hoc_intro_effects', String(!effects)); } catch { /* Optional preference. */ }
  };
  const next = () => {
    if (chapter < chapters.length - 1) { setChapter(chapter + 1); celebrate(true); }
    else { setStage('features'); celebrate(); }
  };
  return (
    <div className="arrival" data-effects={effects ? 'on' : 'off'} data-paused={pageHidden ? 'true' : 'false'} data-scene={stage} onClick={sparkAtPointer}>
      <canvas ref={canvasRef} className="arrival-fireworks" aria-hidden="true" />
      <div className="arrival-scene-sweep" key={`${stage}-${chapter}`} aria-hidden="true" />
      <div className="arrival-atmosphere" aria-hidden="true"><div className="arrival-aurora" /><div className="arrival-halo" /><i className="arrival-comet" /><i className="arrival-comet arrival-comet-second" /></div>
      <div className="arrival-petals" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 29 + 4) % 100}%`, animationDelay: `${-i * 1.8}s`, animationDuration: `${15 + i % 5 * 3}s`, '--petal-drift': `${i % 2 ? -80 : 90}px` } as CSSProperties} />)}</div>
      <div className="arrival-glow arrival-glow-a" aria-hidden="true" />
      <div className="arrival-glow arrival-glow-b" aria-hidden="true" />
      <div className="arrival-stars" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 9) % 100}%`, top: `${(i * 19 + 5) % 100}%`, animationDelay: `${i * -0.7}s` }} />)}</div>
      <header className="arrival-header">
        <Link to="/" className="arrival-brand" aria-label="Lớp Học Ký Ức"><span className="arrival-brand-mark"><BookOpen size={21} /></span><span>LỚP HỌC KÝ ỨC<small>ĐẠI HỌC TÂY NGUYÊN · 20/11</small></span></Link>
        <div className="arrival-settings">
          <button type="button" data-audio-control onClick={toggleMusic} aria-pressed={music} aria-label={music ? !playing && !starting && stage !== 'cover' ? 'Phát nhạc mở đầu' : 'Tắt nhạc mở đầu' : 'Bật nhạc mở đầu'}>{music ? <Volume2 /> : <VolumeX />}<span>{starting ? 'Đang tải nhạc' : music ? playing ? 'Nhạc bật' : stage === 'cover' ? 'Có nhạc' : 'Chạm để nghe' : 'Nhạc tắt'}</span></button>
          <button type="button" onClick={toggleEffects} aria-pressed={effects} aria-label={effects ? 'Tắt hiệu ứng mở đầu' : 'Bật hiệu ứng mở đầu'}><Sparkles /><span>Hiệu ứng {effects ? 'bật' : 'tắt'}</span></button>
          <button type="button" className="arrival-fireworks-control" onClick={() => celebrate()} disabled={!effects} aria-label="Bắn pháo hoa"><Sparkles /><span>Pháo hoa</span></button>
          <button type="button" data-audio-control className="arrival-skip" onClick={enterNow} aria-label="Đi thẳng vào lớp">Vào lớp <ArrowRight /></button>
        </div>
      </header>

      {stage === 'cover' && <main className="arrival-cover">
        <div className="arrival-cover-copy">
          <div className="arrival-eyebrow"><span /> MỘT CHUYẾN TRỞ VỀ, TỪ BẤT CỨ ĐÂU</div>
          <p className="arrival-date">20 <span>/</span> 11</p>
          <h1>Tiếng chuông<br /><em>vẫn đợi.</em></h1>
          <p className="arrival-lead">Có thể hôm nay bạn chưa thể về trường.<br />Nhưng vẫn còn một lớp học, một người thầy<br className="hidden sm:block" /> và một lời cảm ơn đang chờ.</p>
          <div className="arrival-cover-actions">
            <button type="button" data-audio-control className="arrival-primary" onClick={begin}><Bell size={19} /> Trở về lớp học <ArrowRight size={18} /></button>
            <div className="arrival-cover-extras">
              <button type="button" data-audio-control className="arrival-secondary" onClick={enterNow}><ArrowRight size={16} /> Vào lớp ngay</button>
              <button type="button" className="arrival-secondary" onClick={() => setStage('features')}><Move size={16} /> Cách chơi</button>
            </div>
          </div>
          <p className="arrival-footnote">Chạm mở cổng thời gian. Kỷ niệm tự bay theo vòng xoáy.<br />Chạm ảnh để giữ lại, hoặc vào lớp ngay bất cứ lúc nào.</p>
          <Link to="/login" className="arrival-staff">Dành cho giáo viên & quản trị viên <ArrowRight size={14} /></Link>
        </div>
        <div className="arrival-art" aria-label="Minh họa lớp học và lời chào mừng ngày 20 tháng 11" role="img">
          <div className="arrival-art-sun" />
          <div className="arrival-window"><i /><i /><i /><i /></div>
          <div className="arrival-board"><small>GỬI NHỮNG NGƯỜI ĐÃ GIEO MẦM</small><strong>Cảm ơn<br />Thầy Cô.</strong><span>Những bài học còn ở lại, mãi về sau.</span><div className="arrival-chalk" /></div>
          <div className="arrival-desk arrival-desk-back" /><div className="arrival-desk arrival-desk-front"><span className="arrival-notebook" /><span className="arrival-flower">✿</span></div>
          <div className="arrival-note">“Lớp mình vẫn ở đây nhé.”<span>— Hẹn bạn ngày trở về</span></div>
          <span className="arrival-art-spark arrival-art-spark-a">✧</span><span className="arrival-art-spark arrival-art-spark-b">✦</span>
        </div>
      </main>}

      {stage === 'journey' && <MemoryJourney effects={effects} onEnter={enterNow} onComplete={() => { setStage('features'); celebrate(); }} onReadStory={() => { setChapter(0); setStage('story'); }} onReplay={() => { if (music) soundManager.restartBgm(); }} />}

      {stage === 'story' && <main className="arrival-story" aria-label="Câu chuyện Tiếng chuông vẫn đợi">
        <div className="arrival-story-icon"><Bell /></div>
        <div key={chapter} className="arrival-chapter">
          <p className="arrival-eyebrow">{chapters[chapter].label}</p>
          <h1 ref={headingRef} tabIndex={-1}>{chapters[chapter].title}</h1>
          <p className="arrival-story-text">{chapters[chapter].text}</p>
          <p className="arrival-story-line">{chapters[chapter].line}</p>
        </div>
        <nav aria-label="Các chương câu chuyện" className="arrival-chapters">{chapters.map((c, i) => <button key={c.label} type="button" onClick={() => { setChapter(i); celebrate(true); }} aria-label={`Chương ${i + 1}`} aria-current={chapter === i ? 'step' : undefined}><span />{String(i + 1).padStart(2, '0')}</button>)}</nav>
        <div className="arrival-story-actions"><button type="button" className="arrival-secondary" onClick={() => chapter ? setChapter(chapter - 1) : setStage('cover')}><ArrowLeft size={16} /> Quay lại</button><button type="button" className="arrival-primary" onClick={next}>{chapter === 2 ? 'Khám phá lớp học' : 'Tiếp câu chuyện'}<ArrowRight size={17} /></button></div>
      </main>}

      {stage === 'features' && <main className="arrival-features">
        <div className="arrival-feature-heading"><p className="arrival-eyebrow">LỚP HỌC NÀY CÓ GÌ?</p><h1 ref={headingRef} tabIndex={-1}>Một chỗ ngồi.<br /><em>Thật nhiều điều để gửi trao.</em></h1><p>Ghé cùng nhau, hoặc để lại một lời nhắn cho người đến sau.</p></div>
        <div className="arrival-feature-grid">{features.map(({ icon: Icon, number, name, text, hint }) => <article key={number} className="arrival-feature" style={{ animationDelay: `${Number(number) * 70}ms` }}><div className="arrival-feature-top"><span><Icon /></span><small>{number}</small></div><h2>{name}</h2><p>{text}</p><div className="arrival-feature-hint">{hint}</div></article>)}</div>
        <div className="arrival-feature-bottom"><button type="button" className="arrival-secondary" onClick={() => { setStage('story'); setChapter(2); }}><ArrowLeft size={16} /> Câu chuyện</button><button type="button" className="arrival-primary" onClick={onFinish}>{returning ? 'Bước vào lớp học' : 'Chọn nhân vật & vào lớp'}<ArrowRight size={17} /></button><button type="button" className="arrival-celebrate" disabled={!effects} onClick={() => celebrate()}><Sparkles size={16} /> Thêm một chút pháo hoa</button></div>
        <p className="arrival-feature-tip"><Move size={14} /> Dùng điện thoại? Chọn góc rộng 0.5× và bấm Xoay ngang khi vào lớp.</p>
      </main>}
      <footer className="arrival-footer"><span>KHÔNG KHOẢNG CÁCH NÀO NGĂN MỘT LỜI CẢM ƠN.</span><span>Ngày Nhà giáo Việt Nam <b>20.11</b></span></footer>
    </div>
  );
}
