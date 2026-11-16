import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Pause, Play, QrCode, Sparkles } from 'lucide-react';
import { MEMORY_SCENES, journeyDuration, journeyFrame, vortexCardPose } from '../../lib/memoryJourney';
import { TimePortal } from './TimePortal';

type JourneyProps = { effects: boolean; onEnter: () => void; onComplete: () => void; onReadStory: () => void; onReplay: () => void };

export function MemoryJourney({ effects, onEnter, onComplete, onReadStory, onReplay }: JourneyProps) {
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
      if (!document.hidden) setElapsed((time) => Math.min(journeyDuration(timelineEffects), time + Math.min(delta, 250)));
    }, 50);
    document.addEventListener('visibilitychange', resetClock);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', resetClock); };
  }, [paused, timelineEffects, frame.phase]);
  useEffect(() => {
    if (previousPhase.current !== frame.phase) { window.scrollTo(0, 0); previousPhase.current = frame.phase; }
    if (frame.phase === 'end') title.current?.focus({ preventScroll: true });
  }, [frame.phase]);
  return (
    <main className={`memory-journey memory-journey-${frame.phase}`} data-motion={effects ? 'on' : 'off'} data-paused={paused ? 'true' : 'false'} aria-label="Hành trình qua cổng thời gian">
      <TimePortal effects={effects} paused={paused} travelling={frame.phase !== 'end'} />
      {frame.phase !== 'end' && <section className="vortex-stage" aria-label="Ảnh kỷ niệm tự bay qua vòng xoáy">
        <div className="vortex-intro"><span>CHUYẾN TRỞ VỀ BẮT ĐẦU</span><h1>{frame.phase === 'portal' ? <>Đi qua thời gian.<br /><em>Chạm lại ký ức.</em></> : <em>Những ngày cùng nhau.</em>}</h1></div>
        <div className="vortex-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="vortex-cards">
          {MEMORY_SCENES.map((scene, index) => {
            const current = frame.phase === 'memory' && index === frame.index;
            const pose = vortexCardPose(elapsed, index, timelineEffects);
            const transform = effects && !paused
              ? `translate3d(calc(-50% + ${pose.x.toFixed(2)}vw), calc(-50% + ${pose.y.toFixed(2)}vh), 0) scale(${pose.scale.toFixed(3)}) rotate(${pose.rotation.toFixed(2)}deg)`
              : 'translate3d(-50%, -50%, 0) scale(1)';
            const style: CSSProperties = { transform, opacity: effects && !paused ? pose.opacity : current ? 1 : 0, zIndex: 10 + index, visibility: effects && !paused ? pose.visible ? 'visible' : 'hidden' : current ? 'visible' : 'hidden' };
            return <button key={scene.image} type="button" className={`vortex-card vortex-card-${scene.kind}${current ? ' is-current' : ''}`} style={style} tabIndex={current ? 0 : -1} aria-hidden={!current} aria-label={paused ? `Tiếp tục vòng xoáy: ${scene.title}` : `Giữ ảnh kỷ niệm: ${scene.title}`} onClick={() => setPaused(!paused)}>
              <span className="vortex-photo"><img src={scene.image} alt={scene.alt} fetchPriority="high" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('vortex-photo-unavailable'); }} /><span className="vortex-photo-error">Một kỷ niệm vẫn còn ở đây.</span></span>
              <span className="vortex-card-caption"><strong>{scene.title}</strong><small>{scene.kind === 'coding' ? scene.credit : 'Những ngày cùng nhau · 20/11'}</small>{paused && current && <span className="vortex-card-note">{scene.text}</span>}</span>
            </button>;
          })}
        </div>
        <div className="vortex-transport">
          <p>{paused ? 'Đã giữ kỷ niệm · Chạm ảnh để đi tiếp' : 'Ảnh tự chuyển · Chạm ảnh để giữ lại'}</p>
          <div className="vortex-progress" aria-hidden="true">{MEMORY_SCENES.map((scene, index) => <span key={scene.image}><i style={{ transform: `scaleX(${frame.phase === 'memory' ? index < frame.index ? 1 : index === frame.index ? frame.progress : 0 : 0})` }} /></span>)}</div>
          <div className="vortex-actions"><button type="button" className="vortex-pause" aria-label={paused ? 'Tiếp tục hành trình' : 'Tạm dừng hành trình'} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Đi tiếp' : 'Giữ lại'}</button><button type="button" className="arrival-primary" onClick={onEnter}>Vào lớp ngay <ArrowRight size={17} /></button><button type="button" className="vortex-end-shortcut" onClick={() => setElapsed(journeyDuration(timelineEffects))}>Đến QR</button></div>
        </div>
      </section>}
      {frame.phase === 'end' && <section className="memory-ending">
        <div className="memory-ending-copy"><span className="memory-label">CHÚNG TA ĐÃ TỪNG Ở ĐÂY</span><h1 ref={title} tabIndex={-1}>Cảm ơn vì đã<br /><em>cùng nhau trưởng thành.</em></h1><p>Gửi một lời tri ân. Giữ một tấm ảnh.<br />Và hẹn nhau trong lớp học, dù bạn đang ở đâu.</p><div className="memory-ending-collage">{MEMORY_SCENES.filter((scene) => scene.kind === 'memory').map((scene) => <img key={scene.image} src={scene.image} alt={scene.alt} />)}</div></div>
        <div className="memory-qr"><span className="memory-qr-label"><QrCode size={17} /> CHIA SẺ CHUYẾN TRỞ VỀ</span><img src="/media/memories/connect-qr.png" alt="Mã QR mở trang trianttn.ducloiphan.cyou" width={256} height={256} /><h2>Lớp mình vẫn ở đây nhé.</h2><p>Quét mã để mở Lớp Học Ký Ức<br />và mời một người bạn cùng trở về.</p><span>trianttn.ducloiphan.cyou</span></div>
        <div className="memory-ending-actions"><button className="arrival-primary" type="button" onClick={onEnter}>Vào lớp ngay <ArrowRight size={17} /></button><button className="arrival-secondary" type="button" onClick={onComplete}>Lớp học có gì? <Sparkles size={15} /></button><button className="memory-replay" type="button" onClick={onReadStory}>Đọc câu chuyện</button><button className="memory-replay" data-audio-control type="button" onClick={() => { onReplay(); setElapsed(0); setPaused(false); }}>Xem lại vòng xoáy</button></div>
        <p className="memory-credits">Ảnh kỷ niệm: chủ dự án cung cấp. Ảnh lập trình minh họa: <a href={MEMORY_SCENES[1].source} target="_blank" rel="noreferrer">luis gomes</a> &amp; <a href={MEMORY_SCENES[3].source} target="_blank" rel="noreferrer">Nemuel Sereti / Pexels</a>.</p>
      </section>}
    </main>
  );
}
