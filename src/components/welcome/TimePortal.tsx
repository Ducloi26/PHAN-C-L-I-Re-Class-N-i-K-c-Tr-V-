import { useEffect, useRef } from 'react';

// A single lightweight 2D canvas creates depth without opening another WebGL
// context before the classroom. No animation work runs in a hidden tab.
export function TimePortal({ effects, paused, travelling }: { effects: boolean; paused: boolean; travelling: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const age = useRef(0);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let width = 0, height = 0, frame = 0, last = 0, painted = 0, disposed = false;
    const compact = window.innerWidth < 768 || window.innerHeight < 500;
    const stars = Array.from({ length: compact ? 64 : 140 }, (_, i) => ({ angle: i * 2.399963, radius: 0.25 + (i * 37 % 90) / 100, depth: (i * 67 % 997) / 997 }));
    const draw = () => {
      const cx = width * 0.5, cy = height * (travelling ? 0.45 : 0.48);
      const scale = Math.min(width, height);
      context.fillStyle = '#050c17'; context.fillRect(0, 0, width, height);
      const halo = context.createRadialGradient(cx, cy, scale * 0.02, cx, cy, scale * 0.8);
      halo.addColorStop(0, '#040810'); halo.addColorStop(0.24, '#17303e'); halo.addColorStop(0.5, '#172235'); halo.addColorStop(1, '#050c17');
      context.fillStyle = halo; context.fillRect(0, 0, width, height);
      if (travelling) for (let arm = 0; arm < 4; arm++) {
        context.beginPath();
        for (let step = 0; step < 54; step++) {
          const radius = scale * (.025 + step * step * .00028);
          const angle = arm * Math.PI / 2 + step * .078 + age.current * .75;
          const x = cx + Math.cos(angle) * radius * 1.4, y = cy + Math.sin(angle) * radius * .7;
          if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.strokeStyle = arm % 2 ? 'rgba(109,210,214,.21)' : 'rgba(248,208,128,.23)';
        context.lineWidth = compact ? 1.2 : 1.8; context.stroke();
      }
      for (let i = 0; i < (compact ? 8 : 13); i++) {
        const depth = ((i / 13 + age.current * (travelling ? 0.15 : 0.018)) % 1);
        const radius = scale * 0.055 / Math.max(0.065, 1 - depth);
        context.beginPath(); context.ellipse(cx, cy, radius * 1.45, radius * 0.78, Math.sin(age.current * 0.13) * 0.25 + i * 0.07, 0, Math.PI * 2);
        context.strokeStyle = i % 3 === 0 ? `rgba(249,211,139,${0.1 + depth * 0.18})` : `rgba(99,187,206,${0.08 + depth * 0.14})`;
        context.lineWidth = Math.min(2.2, 0.5 + depth * 1.5); context.stroke();
      }
      for (const star of stars) {
        const depth = (star.depth + age.current * (travelling ? 0.25 : 0.025)) % 1;
        const distance = scale * star.radius * 0.1 / Math.max(0.08, 1 - depth);
        const angle = star.angle + age.current * 0.05;
        const x = cx + Math.cos(angle) * distance * 1.7, y = cy + Math.sin(angle) * distance;
        context.beginPath(); context.moveTo(x, y);
        const trail = travelling && effects ? 1.05 + depth * 0.1 : 1.012;
        context.lineTo(cx + (x - cx) * trail, cy + (y - cy) * trail);
        context.strokeStyle = `rgba(221,235,229,${0.15 + depth * 0.5})`; context.lineWidth = depth > 0.8 ? 1.5 : 0.75; context.stroke();
      }
      if (travelling) {
        const core = context.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.12);
        core.addColorStop(0, '#02050d'); core.addColorStop(0.7, '#02050ddd'); core.addColorStop(1, '#02050d00');
        context.fillStyle = core; context.beginPath(); context.arc(cx, cy, scale * 0.12, 0, Math.PI * 2); context.fill();
      }
    };
    const loop = (now: number) => {
      if (disposed || document.hidden || !effects || paused) return;
      if (!last) last = now;
      age.current += Math.min(0.06, (now - last) / 1000); last = now;
      if (now - painted >= 33) { draw(); painted = now; }
      frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      const rect = element.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5);
      width = rect.width; height = rect.height;
      element.width = Math.round(width * dpr); element.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    };
    const visibility = () => {
      cancelAnimationFrame(frame); last = 0;
      if (!document.hidden && effects && !paused) frame = requestAnimationFrame(loop);
    };
    const observer = new ResizeObserver(resize); observer.observe(element); resize(); visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, [effects, paused, travelling]);
  return <canvas ref={canvas} className="time-portal-canvas" aria-hidden="true" />;
}
