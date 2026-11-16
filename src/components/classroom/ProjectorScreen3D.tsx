import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { liveProjection } from '../../lib/projectorMedia';
import { ProjectorState, MemoryMark } from '../../types';

interface ProjectorScreen3DProps {
  projector: ProjectorState | null;
  marks?: MemoryMark[];
  onOpenOverlay: () => void;
  liveMedia?: React.ReactNode;
}

const SYMBOL_EMOJIS: Record<string, string> = {
  heart: '❤️',
  sunflower: '🌻',
  rose: '🌹',
  star: '⭐',
  book: '📖',
  grad_cap: '🎓',
};

export const ProjectorScreen3D: React.FC<ProjectorScreen3DProps> = ({
  projector,
  marks = [],
  onOpenOverlay,
  liveMedia,
}) => {
  const isRetrospective = projector?.mode === 'retrospective';
  const selectedIndex = projector?.retrospective_mark_id ? marks.findIndex((mark) => mark.id === projector.retrospective_mark_id) : -1;
  const currentIndex = selectedIndex >= 0 ? selectedIndex : projector?.retrospective_index || 0;
  const currentMark = projector?.retrospective_mark_id ? marks.find((mark) => mark.id === projector.retrospective_mark_id) || null : marks.length > 0 ? marks[currentIndex % marks.length] : null;

  const currentMediaUrl = projector?.media?.payload?.url || '/media/slide1_ngay_tro_ve.svg';
  const title = isRetrospective
    ? 'Nhìn Lại Hành Trình — Bức Tường Dấu Ấn'
    : (projector?.media?.title || 'Lớp học Ký Ức — Đại học Tây Nguyên');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [screenTexture, setScreenTexture] = useState<THREE.CanvasTexture | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize offscreen canvas once
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 640;
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    setScreenTexture(tex);

    return () => {
      tex.dispose();
    };
  }, []);

  // Redraw canvas whenever slide media or retrospective mark changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !screenTexture) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let cancelled = false;

    const width = canvas.width;
    const height = canvas.height;

    // Helper: draw fallback or retrospective content
    const drawContent = () => {
      ctx.clearRect(0, 0, width, height);
      if (liveProjection(projector)) {
        ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fcd34d'; ctx.textAlign = 'center'; ctx.font = 'bold 40px sans-serif';
        ctx.fillText(title, width / 2, height / 2 - 35, width - 100);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '26px sans-serif';
        ctx.fillText('Video đang phát trên màn chiếu chung', width / 2, height / 2 + 25);
        screenTexture.needsUpdate = true;
        return;
      }
      if (isRetrospective) {
        // -------------------------------------------------------------
        // 🌟 RETROSPECTIVE COMMEMORATIVE CARD VIEW
        // -------------------------------------------------------------
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#2D1808');
        bgGrad.addColorStop(0.5, '#1C1005');
        bgGrad.addColorStop(1, '#3D200A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Gold border
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(32, 32, width - 64, height - 64);

        // Top Header
        ctx.fillStyle = '#FEF08A';
        ctx.font = 'bold 32px serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ NHÌN LẠI HÀNH TRÌNH TRI THỨC — 20/11 ✨', width / 2, 85);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '20px sans-serif';
        ctx.fillText(`Dấu ấn ${currentIndex + 1} / ${marks.length || 1}`, width / 2, 120);

        // Center Commemorative Card
        const cardW = 900;
        const cardH = 340;
        const cardX = (width - cardW) / 2;
        const cardY = 160;

        ctx.fillStyle = currentMark?.card_color || '#FEF3C7';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 20);
        ctx.fill();

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.stroke();

        if (currentMark) {
          // Author & Symbol
          ctx.fillStyle = '#1C1917';
          ctx.font = 'bold 36px serif';
          ctx.textAlign = 'left';
          const symbolEmoji = SYMBOL_EMOJIS[currentMark.symbol] || '❤️';
          ctx.fillText(`${symbolEmoji}  ${currentMark.display_name}`, cardX + 45, cardY + 70);

          ctx.fillStyle = '#78716C';
          ctx.font = '20px sans-serif';
          ctx.fillText('Đại học Tây Nguyên • "Chúng ta đã từng ở đây"', cardX + 45, cardY + 105);

          // Divider
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cardX + 45, cardY + 125);
          ctx.lineTo(cardX + cardW - 45, cardY + 125);
          ctx.stroke();

          // Message
          ctx.fillStyle = '#292524';
          ctx.font = 'italic 28px serif';
          const msg = `"${currentMark.message}"`;

          // Simple multi-line text wrapping
          const words = msg.split(' ');
          let line = '';
          let lineY = cardY + 175;
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > cardW - 90 && n > 0) {
              ctx.fillText(line, cardX + 45, lineY);
              line = words[n] + ' ';
              lineY += 40;
              if (lineY > cardY + cardH - 30) break;
            } else {
              line = testLine;
            }
          }
          if (lineY <= cardY + cardH - 30) {
            ctx.fillText(line, cardX + 45, lineY);
          }
        } else {
          ctx.fillStyle = '#1C1917';
          ctx.font = 'bold 32px serif';
          ctx.textAlign = 'center';
          ctx.fillText('"Dù mai này đi muôn nơi..."', width / 2, cardY + 150);
          ctx.font = '24px sans-serif';
          ctx.fillText('Chúng ta vẫn có một lớp học để trở về.', width / 2, cardY + 200);
        }

        // Footer helper
        ctx.fillStyle = '#CBD5E1';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔍 Nhấn chuột vào màn chiếu để xem phóng to toàn màn hình', width / 2, height - 55);

        screenTexture.needsUpdate = true;
      } else {
        // -------------------------------------------------------------
        // 🖥️ STANDARD SLIDE VIEW (Load SVG/Image onto canvas)
        // -------------------------------------------------------------
        // Keep a visible loading state while the image is being decoded.
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#FEF08A';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Đang tải slide…', width / 2, height / 2);
        screenTexture.needsUpdate = true;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Top Live Badge
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.roundRect(30, 30, 260, 46, 12);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔴 MÀN CHIẾU TRỰC TIẾP', 160, 60);

          // Bottom Prompt
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 280, height - 70, 560, 46, 12);
          ctx.fill();

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔍 Nhấp chuột để xem phóng to (Phím E)', width / 2, height - 40);

          screenTexture.needsUpdate = true;
        };

        img.onerror = () => {
          if (cancelled) return;
          // Fallback slide if image loading fails
          const bgGrad = ctx.createLinearGradient(0, 0, width, height);
          bgGrad.addColorStop(0, '#1B4332');
          bgGrad.addColorStop(1, '#081C15');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 4;
          ctx.strokeRect(30, 30, width - 60, height - 60);

          ctx.fillStyle = '#F59E0B';
          ctx.font = 'bold 36px serif';
          ctx.textAlign = 'center';
          ctx.fillText('KHÔNG TẢI ĐƯỢC SLIDE', width / 2, 160);

          ctx.fillStyle = '#FEF08A';
          ctx.font = 'bold 36px serif';
          ctx.fillText(title, width / 2, 300, width - 100);

          ctx.fillStyle = '#E2E8F0';
          ctx.font = '28px sans-serif';
          ctx.fillText('Nhấp vào màn chiếu để xem phóng to và thử lại.', width / 2, 380);

          ctx.fillStyle = '#94A3B8';
          ctx.font = '20px sans-serif';
          ctx.fillText('567 Lê Duẩn — TP. Buôn Ma Thuột • 20/11/2026', width / 2, 460);

          screenTexture.needsUpdate = true;
        };

        img.src = currentMediaUrl;
      }
    };

    drawContent();
    return () => { cancelled = true; };
  }, [currentMediaUrl, isRetrospective, currentIndex, currentMark, screenTexture, projector?.media?.kind, title]);

  return (
    <group position={[0, 2.2, -4.85]}>
      {liveMedia && <Html transform position={[0, 0, 0.07]} distanceFactor={2} zIndexRange={[8, 1]}>
        <div style={{ width: 840, height: 420 }} onPointerDown={(e) => e.stopPropagation()}>{liveMedia}</div>
      </Html>}
      {/* 1. Outer wooden frame of blackboard (5.4m x 2.6m) mounted on front wall */}
      <mesh position={[0, 0, -0.05]} receiveShadow>
        <boxGeometry args={[5.4, 2.6, 0.08]} />
        <meshStandardMaterial color="#3D2314" roughness={0.7} />
      </mesh>

      {/* 2. Chalkboard background (Dark forest green) */}
      <mesh position={[0, 0, -0.02]} receiveShadow>
        <boxGeometry args={[5.1, 2.3, 0.05]} />
        <meshStandardMaterial color="#1E3A2F" roughness={0.9} />
      </mesh>

      {/* 3. Celebratory Maroon Banner above board */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[4.8, 0.35, 0.04]} />
        <meshStandardMaterial color="#800020" roughness={0.6} />
      </mesh>

      {/* 4. SOLID 3D WEBGL PROJECTOR SCREEN MESH (Fixed permanently inside board frame) */}
      <mesh
        position={[0, 0, 0.02]}
        onClick={onOpenOverlay}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[4.2, 2.1]} />
        {/* A new material must compile with USE_MAP when the async canvas
            texture first becomes available. Updating only texture.needsUpdate
            uploads pixels but leaves the original untextured shader intact. */}
        <meshBasicMaterial
          key={screenTexture?.uuid || 'projector-loading'}
          map={screenTexture}
          color={screenTexture ? '#FFFFFF' : '#0F172A'}
          toneMapped={false}
        />
      </mesh>

      {/* 5. Glowing Golden Frame around the projector screen */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[4.24, 2.14]} />
        <meshBasicMaterial color={isHovered ? '#FDE68A' : '#D4AF37'} toneMapped={false} />
      </mesh>

      {/* Subtle warm ambient projector glow on board */}
      <pointLight position={[0, 0, 0.5]} intensity={0.4} color="#FEF3C7" distance={4} decay={2} />
    </group>
  );
};
