import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, QrCode, Sparkles } from 'lucide-react';
import { MEMORY_SCENES, MEMORY_DURATION_MS, journeyDuration, journeyFrame, portalDuration } from '../../lib/memoryJourney';
import { TimePortal } from './TimePortal';

export function MemoryJourney({ effects, onComplete, onReadStory, onReplay }: { effects: boolean; onComplete: () => void; onReadStory: () => void; onReplay: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timelineEffects = useRef(effects).current;
  const frame = journeyFrame(elapsed, timelineEffects);
  const title = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef(frame.phase);
  useEffect(() => {
    if (paused || frame.phase === 'end') return;
    let last = Date.now();
    const resetClock = () => { last = Date.now(); };
    const timer = setInterval(() => {
      const now = Date.now(), delta = now - last; last = now;
      if (!document.hidden) setElapsed((time) => Math.min(journeyDuration(timelineEffects), time + Math.min(delta, 500)));
    }, 100);
    document.addEventListener('visibilitychange', resetClock);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', resetClock); };
  }, [paused, timelineEffects, frame.phase]);
  useEffect(() => {
    if (previousPhase.current !== frame.phase) { window.scrollTo(0, 0); previousPhase.current = frame.phase; }
    title.current?.focus({ preventScroll: true });
  }, [frame.phase]);
  const go = (index: number) => { setElapsed(portalDuration(timelineEffects) + Math.max(0, Math.min(MEMORY_SCENES.length, index)) * MEMORY_DURATION_MS); };
  const scene = MEMORY_SCENES[frame.index];
  return (
    <main className={`memory-journey memory-journey-${frame.phase}`} data-motion={effects ? 'on' : 'off'} data-paused={paused ? 'true' : 'false'} aria-label="Hành trình qua cổng thời gian">
      <TimePortal effects={effects} paused={paused} travelling={frame.phase === 'portal'} />
      {frame.phase === 'portal' && <section className="time-portal-opening" role="status">
        <div className="time-portal-rim" aria-hidden="true"><i /><i /><i /></div>
        <div className="time-portal-postcards" aria-hidden="true">{MEMORY_SCENES.filter((item) => item.kind === 'memory').map((item, index) => <figure key={item.image} style={{ '--postcard-index': index } as CSSProperties}><img src={item.image} alt="" /><span>Những ngày cùng nhau</span></figure>)}</div>
        <div className="time-portal-invitation"><span>CHUYẾN TRỞ VỀ BẮT ĐẦU</span><h1 ref={title} tabIndex={-1}>Đi qua thời gian.<br /><em>Chạm lại ký ức.</em></h1><p>Những người bạn. Những bài học.<br />Và một lời cảm ơn vẫn còn nguyên vẹn.</p><button type="button" onClick={() => go(0)}>Đến những kỷ niệm <ArrowRight size={15} /></button></div>
      </section>}

      {frame.phase === 'memory' && <section key={frame.index} className="memory-scene" aria-label={`Kỷ niệm ${frame.index + 1} trên ${MEMORY_SCENES.length}`}>
        <div className="memory-scene-copy"><span className="memory-label">KÝ ỨC {String(frame.index + 1).padStart(2, '0')} / {String(MEMORY_SCENES.length).padStart(2, '0')}</span><div className="memory-title-line" /><p className="memory-kicker">{scene.label}</p><h1 ref={title} tabIndex={-1}>{scene.title}</h1><p className="memory-description">{scene.text}</p><span className="memory-dedication">Gửi những người đã gieo mầm · 20/11</span></div>
        <figure className={`memory-photo memory-photo-${scene.kind}`}><div className="memory-photo-mat"><img src={scene.image} alt={scene.alt} fetchPriority="high" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('memory-photo-unavailable'); }} /><span className="memory-photo-error">Ảnh này chưa tải được. Bạn vẫn có thể xem kỷ niệm tiếp theo.</span><span className="memory-photo-shine" aria-hidden="true" /></div><figcaption><span>{scene.credit}</span><span>✦</span></figcaption></figure>
      </section>}

      {frame.phase === 'end' && <section className="memory-ending">
        <div className="memory-ending-copy"><span className="memory-label">CHÚNG TA ĐÃ TỪNG Ở ĐÂY</span><h1 ref={title} tabIndex={-1}>Cảm ơn vì đã<br /><em>cùng nhau trưởng thành.</em></h1><p>Gửi một lời tri ân. Giữ một tấm ảnh.<br />Và hẹn nhau trong lớp học, dù bạn đang ở đâu.</p><div className="memory-ending-collage">{MEMORY_SCENES.filter((item) => item.kind === 'memory').map((item) => <img key={item.image} src={item.image} alt={item.alt} />)}</div></div>
        <div className="memory-qr"><span className="memory-qr-label"><QrCode size={17} /> CHIA SẺ CHUYẾN TRỞ VỀ</span><img src="/media/memories/connect-qr.png" alt="Mã QR mở trang trianttn.ducloiphan.cyou" width={256} height={256} /><h2>Lớp mình vẫn ở đây nhé.</h2><p>Quét mã để mở Lớp Học Ký Ức<br />và mời một người bạn cùng trở về.</p><span>trianttn.ducloiphan.cyou</span></div>
        <div className="memory-ending-actions"><button className="arrival-secondary" type="button" onClick={onReadStory}>Đọc câu chuyện</button><button className="arrival-primary" type="button" onClick={onComplete}>Khám phá lớp học <ArrowRight size={17} /></button><button className="memory-replay" data-audio-control type="button" onClick={() => { onReplay(); setElapsed(0); setPaused(false); }}>Xem lại hành trình</button></div>
        <p className="memory-credits">Ảnh kỷ niệm: chủ dự án cung cấp. Ảnh lập trình minh họa: <a href={MEMORY_SCENES[1].source} target="_blank" rel="noreferrer">luis gomes</a> & <a href={MEMORY_SCENES[3].source} target="_blank" rel="noreferrer">Nemuel Sereti / Pexels</a>.</p>
      </section>}

      {frame.phase !== 'end' && <div className="memory-transport"><div className="memory-chapters" role="group" aria-label="Chọn kỷ niệm">{MEMORY_SCENES.map((item, i) => <button key={item.image} type="button" onClick={() => go(i)} aria-label={`Xem kỷ niệm ${i + 1}: ${item.title}`} aria-current={frame.phase === 'memory' && frame.index === i ? 'step' : undefined}><span style={{ transform: `scaleX(${frame.phase === 'memory' && frame.index === i ? frame.progress : frame.phase === 'memory' && i < frame.index ? 1 : 0})` }} /></button>)}</div><div className="memory-transport-buttons"><button type="button" onClick={() => go(frame.index - 1)} disabled={frame.phase === 'portal' || frame.index === 0} aria-label="Kỷ niệm trước"><ArrowLeft size={17} /></button><button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Tiếp tục hành trình' : 'Tạm dừng hành trình'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button><button type="button" onClick={() => go(frame.phase === 'portal' ? 0 : frame.index + 1)} aria-label="Kỷ niệm tiếp theo"><ArrowRight size={17} /></button><button type="button" className="memory-to-end" onClick={() => go(MEMORY_SCENES.length)}><Sparkles size={14} /> Lời hẹn cuối</button></div></div>}
    </main>
  );
}
