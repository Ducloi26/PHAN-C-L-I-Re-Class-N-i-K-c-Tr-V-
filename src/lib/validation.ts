/**
 * Input validation utilities
 */

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Vui lòng nhập tên của bạn' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Tên hiển thị phải có ít nhất 2 ký tự' };
  }
  if (trimmed.length > 32) {
    return { valid: false, error: 'Tên hiển thị tối đa 32 ký tự' };
  }
  return { valid: true };
}

export function validateWishContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, error: 'Nội dung lời chúc không được để trống' };
  }
  if (trimmed.length < 5) {
    return { valid: false, error: 'Lời chúc phải có ít nhất 5 ký tự' };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: 'Lời chúc không vượt quá 500 ký tự' };
  }
  return { valid: true };
}

export function validateYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (validateYouTubeId(trimmed)) return trimmed;
  
  // Try extracting from full YouTube URL
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function sanitizeText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

