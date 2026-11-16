import type { MediaItem } from '../types';

export const MEDIA_LIBRARY: MediaItem[] = [
  {
    id: 'media-slide-1',
    title: 'Slide 1: Ngày trở về — Lớp học Ký Ức',
    kind: 'image',
    payload: {
      url: '/media/slide1_ngay_tro_ve.svg',
      description: 'Chào mừng các thầy cô và bạn bè trở về lớp học',
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'media-slide-2',
    title: 'Slide 2: Hành trình tri thức — Hạt giống & Mùa hoa',
    kind: 'image',
    payload: {
      url: '/media/slide2_hanh_trinh_tri_thuc.svg',
      description: 'Lời tri ân sâu sắc gửi tới các thầy cô kính yêu',
    },
    created_at: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'media-slide-3',
    title: 'Slide 3: Tri ân bằng công nghệ 20/11',
    kind: 'image',
    payload: {
      url: '/media/slide3_loi_tri_an.svg',
      description: 'Thông điệp tri ân ứng dụng công nghệ 3D và thời gian thực',
    },
    created_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'media-slide-4',
    title: 'Slide 4: Sơ đồ khuôn viên Đại học Tây Nguyên',
    kind: 'image',
    payload: {
      url: '/media/so-do-dai-hoc-tay-nguyen.jpg',
      description: 'Bản đồ thực tế 567 Lê Duẩn - Phường Ea Kao, TP. Buôn Ma Thuột',
    },
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

