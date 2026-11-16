export const MEMORY_SCENES = [
  { image: '/media/memories/club-gathering.png', alt: 'Ảnh tập thể trong lớp học do chủ dự án cung cấp', label: 'MỘT NƠI ĐỂ BẮT ĐẦU', title: 'Ngày chúng ta gặp nhau.', text: 'Một lớp học, những gương mặt thân quen. Có những khoảnh khắc rất bình thường, nhưng đi xa rồi mới thấy quý.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
  { image: '/media/memories/coding-screen.jpg', alt: 'Màn hình với những dòng mã lập trình nhiều màu', label: 'TỪ NHỮNG ĐIỀU ĐẦU TIÊN', title: 'Từng dòng code. Từng bài học.', text: 'Cảm ơn những người đã kiên nhẫn chỉ đường, để điều từng khó hiểu dần trở thành điều chúng ta có thể làm.', credit: 'Ảnh minh họa · luis gomes / Pexels', source: 'https://www.pexels.com/photo/close-up-photo-of-programming-of-codes-546819/', kind: 'coding' },
  { image: '/media/memories/classroom-friends.png', alt: 'Bạn bè chụp ảnh cùng nhau giữa những bàn học và máy tính', label: 'NHỮNG NGÀY CÙNG NHAU', title: 'Cùng học. Cùng lớn lên.', text: 'Có bài tập, có những lần sửa sai, có bạn bè và những người thầy. Những năm tháng ấy vẫn ở lại trong từng ký ức.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
  { image: '/media/memories/coding-laptop.jpg', alt: 'Máy tính hiển thị mã lập trình trong ánh sáng xanh', label: 'MANG BÀI HỌC ĐI XA', title: 'Điều học được vẫn ở lại.', text: 'Mang theo kiến thức, lòng kiên trì và những câu hỏi mới. Từng dòng code hôm nay cũng có một phần từ bài học năm ấy.', credit: 'Ảnh minh họa · Nemuel Sereti / Pexels', source: 'https://www.pexels.com/photo/programming-code-on-laptop-screen-6424590/', kind: 'coding' },
  { image: '/media/memories/together.png', alt: 'Nhóm bạn đứng cùng nhau trong lớp với những lá cờ Việt Nam', label: 'MỘT LỜI HẸN TRỞ VỀ', title: 'Dù ở đâu, vẫn có nhau.', text: 'Ngày 20/11, gửi một lời cảm ơn tới những người đã gieo mầm. Cảm ơn vì đã đồng hành, đã tin tưởng, đã thắp sáng những ngày còn bỡ ngỡ.', credit: 'Ảnh kỷ niệm của chúng ta', kind: 'memory' },
] as const;

export const MEMORY_DURATION_MS = 3000;
export const portalDuration = (effects: boolean) => effects ? 3000 : 400;
export const journeyDuration = (effects: boolean) => portalDuration(effects) + MEMORY_SCENES.length * MEMORY_DURATION_MS;
export function journeyFrame(elapsed: number, effects = true) {
  const portal = portalDuration(effects);
  const time = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  if (time < portal) return { phase: 'portal' as const, index: 0, progress: time / portal };
  if (time >= journeyDuration(effects)) return { phase: 'end' as const, index: MEMORY_SCENES.length - 1, progress: 1 };
  const index = Math.floor((time - portal) / MEMORY_DURATION_MS);
  return { phase: 'memory' as const, index, progress: ((time - portal) % MEMORY_DURATION_MS) / MEMORY_DURATION_MS };
}
