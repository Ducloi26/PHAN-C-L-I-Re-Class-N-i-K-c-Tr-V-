import { AvatarCustomization, AvatarPreset, HairStyleId } from '../types';

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'student-male-1',
    name: 'Nam sinh viên 1 (Năng động)',
    description: 'Phong cách nam sinh viên Tây Nguyên trẻ trung, áo khoác xanh truyền thống, tóc ngắn thể thao.',
    gender: 'male',
    defaultConfig: {
      presetId: 'student-male-1',
      gender: 'male',
      hairStyle: 'short',
      hairColor: '#1E1B18',
      outfitColor: '#1E3A8A', // Xanh lam Đại học Tây Nguyên
      accessory: 'tie',
    },
  },
  {
    id: 'student-male-2',
    name: 'Nam sinh viên 2 (Thanh lịch)',
    description: 'Phong cách thanh lịch nhã nhặn, tóc rẽ ngôi 7/3, vest đỏ đô chủ đề 20/11 tri ân.',
    gender: 'male',
    defaultConfig: {
      presetId: 'student-male-2',
      gender: 'male',
      hairStyle: 'side-part',
      hairColor: '#4A3525', // Nâu hạt dẻ
      outfitColor: '#991B1B', // Đỏ đô 20/11
      accessory: 'tie',
    },
  },
  {
    id: 'student-female-1',
    name: 'Nữ sinh viên 1 (Duyên dáng)',
    description: 'Nữ sinh viên duyên dáng, mái tóc đen dài buông xõa mượt mà, trang phục xanh ngọc tươi sáng.',
    gender: 'female',
    defaultConfig: {
      presetId: 'student-female-1',
      gender: 'female',
      hairStyle: 'long',
      hairColor: '#1E1B18', // Đen tự nhiên
      outfitColor: '#047857', // Xanh ngọc lục bảo
      accessory: 'none',
    },
  },
  {
    id: 'student-female-2',
    name: 'Nữ sinh viên 2 (Trẻ trung)',
    description: 'Nữ sinh viên năng động, tóc cột đuôi ngựa cao cá tính, kính cận tri thức, trang phục màu đất bazan.',
    gender: 'female',
    defaultConfig: {
      presetId: 'student-female-2',
      gender: 'female',
      hairStyle: 'ponytail',
      hairColor: '#4A3525', // Nâu hạt dẻ
      outfitColor: '#D97706', // Vàng đất Tây Nguyên
      accessory: 'glasses',
    },
  },
];

export const HAIR_STYLES: { id: HairStyleId; name: string; forGender?: 'male' | 'female' | 'both'; icon: string }[] = [
  { id: 'short', name: 'Tóc ngắn thể thao', forGender: 'male', icon: '👦' },
  { id: 'side-part', name: 'Rẽ ngôi thanh lịch', forGender: 'male', icon: '🧑' },
  { id: 'long', name: 'Tóc dài suôn mượt', forGender: 'female', icon: '👧' },
  { id: 'ponytail', name: 'Cột đuôi ngựa', forGender: 'female', icon: '👱‍♀️' },
  { id: 'grad-cap', name: 'Mũ cử nhân tốt nghiệp', forGender: 'both', icon: '🎓' },
];

export const OUTFIT_COLORS: { name: string; hex: string }[] = [
  { name: 'Xanh TNU', hex: '#1E3A8A' },
  { name: 'Đỏ Đô 20/11', hex: '#991B1B' },
  { name: 'Xanh Ngọc', hex: '#047857' },
  { name: 'Vàng Đất Bazan', hex: '#D97706' },
  { name: 'Tím Hoàng Gia', hex: '#4C1D95' },
  { name: 'Trắng Tinh Khôi', hex: '#F8FAFC' },
  { name: 'Cam Nắng Rực', hex: '#C2410C' },
  { name: 'Xám Than Lịch Lãm', hex: '#334155' },
];

export const HAIR_COLORS: { name: string; hex: string }[] = [
  { name: 'Đen Tự Nhiên', hex: '#1E1B18' },
  { name: 'Nâu Hạt Dẻ', hex: '#4A3525' },
  { name: 'Nâu Trà Sữa', hex: '#854D0E' },
  { name: 'Vàng Đồng', hex: '#B45309' },
  { name: 'Đỏ Rượu Trầm', hex: '#7F1D1D' },
  { name: 'Bạch Kim', hex: '#CBD5E1' },
];

export const ACCESSORIES: { id: 'none' | 'glasses' | 'tie' | 'ribbon'; name: string; icon: string }[] = [
  { id: 'none', name: 'Không phụ kiện', icon: '⚪' },
  { id: 'tie', name: 'Cà vạt sinh viên', icon: '👔' },
  { id: 'glasses', name: 'Kính mắt tri thức', icon: '👓' },
  { id: 'ribbon', name: 'Nơ cổ duyên dáng', icon: '🎀' },
];

export function getDefaultAvatar(presetId?: string): AvatarCustomization {
  const preset = AVATAR_PRESETS.find((p) => p.id === presetId) || AVATAR_PRESETS[0];
  return { ...preset.defaultConfig };
}

export function getPresetById(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) || AVATAR_PRESETS[0];
}


export function normalizeAvatar(value: unknown): AvatarCustomization {
  const fallback = getDefaultAvatar();
  if (!value || typeof value !== 'object') return fallback;
  const input = value as AvatarCustomization;
  return {
    presetId: AVATAR_PRESETS.some((preset) => preset.id === input.presetId) ? input.presetId : fallback.presetId,
    gender: input.gender === 'female' ? 'female' : 'male',
    hairStyle: ['short', 'side-part', 'long', 'ponytail', 'grad-cap'].includes(input.hairStyle) ? input.hairStyle : fallback.hairStyle,
    hairColor: /^#[0-9a-f]{6}$/i.test(input.hairColor) ? input.hairColor : fallback.hairColor,
    outfitColor: /^#[0-9a-f]{6}$/i.test(input.outfitColor) ? input.outfitColor : fallback.outfitColor,
    accessory: ['none', 'glasses', 'tie', 'ribbon'].includes(input.accessory || '') ? input.accessory : 'none',
  };
}
