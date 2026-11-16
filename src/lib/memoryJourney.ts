export const MEMORY_SCENES = [
  { image: '/media/memories/club-gathering.webp', alt: 'Ảnh tập thể trong lớp học do chủ dự án cung cấp', label: 'MỘT NƠI ĐỂ BẮT ĐẦU', title: 'Ngày chúng ta gặp nhau.', text: 'Một lớp học, những gương mặt thân quen. Có những khoảnh khắc rất bình thường, nhưng đi xa rồi mới thấy quý.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
  { image: '/media/memories/coding-screen.webp', alt: 'Màn hình với những dòng mã lập trình nhiều màu', label: 'TỪ NHỮNG ĐIỀU ĐẦU TIÊN', title: 'Từng dòng code. Từng bài học.', text: 'Cảm ơn những người đã kiên nhẫn chỉ đường, để điều từng khó hiểu dần trở thành điều chúng ta có thể làm.', credit: 'Ảnh minh họa · luis gomes / Pexels', source: 'https://www.pexels.com/photo/close-up-photo-of-programming-of-codes-546819/', kind: 'coding' },
  { image: '/media/memories/classroom-friends.webp', alt: 'Bạn bè chụp ảnh cùng nhau giữa những bàn học và máy tính', label: 'NHỮNG NGÀY CÙNG NHAU', title: 'Cùng học. Cùng lớn lên.', text: 'Có bài tập, có những lần sửa sai, có bạn bè và những người thầy. Những năm tháng ấy vẫn ở lại trong từng ký ức.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
  { image: '/media/memories/coding-laptop.webp', alt: 'Máy tính hiển thị mã lập trình trong ánh sáng xanh', label: 'MANG BÀI HỌC ĐI XA', title: 'Điều học được vẫn ở lại.', text: 'Mang theo kiến thức, lòng kiên trì và những câu hỏi mới. Từng dòng code hôm nay cũng có một phần từ bài học năm ấy.', credit: 'Ảnh minh họa · Nemuel Sereti / Pexels', source: 'https://www.pexels.com/photo/programming-code-on-laptop-screen-6424590/', kind: 'coding' },
  { image: '/media/memories/together.webp', alt: 'Nhóm bạn đứng cùng nhau trong lớp với những lá cờ Việt Nam', label: 'MỘT LỜI HẸN TRỞ VỀ', title: 'Dù ở đâu, vẫn có nhau.', text: 'Ngày 20/11, gửi một lời cảm ơn tới những người đã gieo mầm. Cảm ơn vì đã đồng hành, đã tin tưởng, đã thắp sáng những ngày còn bỡ ngỡ.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
] as const;

export const MEMORY_DURATION_MS = 1000;
export const portalDuration = (effects: boolean) => effects ? 800 : 100;
export const journeyDuration = (effects: boolean) => portalDuration(effects) + MEMORY_SCENES.length * MEMORY_DURATION_MS + (effects ? 700 : 0);
export function journeyFrame(elapsed: number, effects = true) {
  const portal = portalDuration(effects);
  const time = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  if (time < portal) return { phase: 'portal' as const, index: 0, progress: time / portal };
  if (time >= journeyDuration(effects)) return { phase: 'end' as const, index: MEMORY_SCENES.length - 1, progress: 1 };
  const index = Math.min(MEMORY_SCENES.length - 1, Math.floor((time - portal) / MEMORY_DURATION_MS));
  return { phase: 'memory' as const, index, progress: Math.min(1, (time - portal - index * MEMORY_DURATION_MS) / MEMORY_DURATION_MS) };
}

/** A deterministic spiral path keeps cards and the clock together when paused. */
export function vortexCardPose(elapsed: number, index: number, timelineEffects = true) {
  const progress = (elapsed - portalDuration(timelineEffects) - index * MEMORY_DURATION_MS) / (MEMORY_DURATION_MS * 1.8);
  if (!Number.isFinite(progress) || progress < 0 || progress >= 1) return { visible: false, x: 0, y: 0, scale: .1, rotation: 0, opacity: 0 };
  const lane = index % 2 ? 1 : -1;
  const near = Math.min(1, progress / .62);
  const departure = Math.max(0, (progress - .62) / .38);
  return {
    visible: true,
    x: lane * (Math.sin(near * Math.PI / 2) * 6 + departure * departure * 62),
    y: Math.sin(progress * Math.PI * 1.3) * (index % 3 - 1) * 7 - departure * 10,
    scale: .12 + near * .88 + departure * .45,
    rotation: lane * (-28 * (1 - near) + 5 + departure * 20),
    opacity: Math.max(0, Math.min(1, progress / .16, (1 - progress) / .24)),
  };
}
