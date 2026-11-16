import { TeacherInfo, Wish, MediaItem, ProjectorState, MemoryMark } from '../types';

export const INITIAL_TEACHERS: TeacherInfo[] = [
  {
    id: 'teacher-all',
    display_name: 'Toàn thể Quý Thầy Cô',
    title: 'Trường Đại học Tây Nguyên',
    flower_count: 128,
  },
  {
    id: 'teacher-1',
    display_name: 'Thầy Nguyễn Văn Toàn',
    title: 'Khoa KHTN & Công nghệ',
    flower_count: 42,
  },
  {
    id: 'teacher-2',
    display_name: 'Cô Lê Thị Mai',
    title: 'Khoa Sư phạm',
    flower_count: 36,
  },
  {
    id: 'teacher-3',
    display_name: 'Thầy Trần Hữu Dũng',
    title: 'Khoa Ngoại ngữ',
    flower_count: 29,
  },
];

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
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

export const INITIAL_PROJECTOR_STATE: ProjectorState = {
  id: 1,
  media_id: 'media-slide-1',
  is_playing: true,
  position_sec: 0,
  slide_index: 0,
  updated_at: new Date().toISOString(),
  media: INITIAL_MEDIA_ITEMS[0],
};

export const INITIAL_WISHES: Wish[] = [
  {
    id: 'wish-1',
    author_id: 'guest-1',
    author_name: 'Cựu sinh viên K19',
    teacher_id: 'teacher-all',
    teacher_name: 'Toàn thể Quý Thầy Cô',
    content: 'Nhân ngày 20/11, chúng em kính chúc quý thầy cô Trường Đại học Tây Nguyên luôn mạnh khỏe, hạnh phúc và giữ mãi ngọn lửa nhiệt huyết với sự nghiệp trồng người!',
    is_hidden: false,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'wish-2',
    author_id: 'guest-2',
    author_name: 'Nguyễn Văn Hùng (K22)',
    teacher_id: 'teacher-1',
    teacher_name: 'Thầy Nguyễn Văn Toàn',
    content: 'Em cảm ơn Thầy vì những bài giảng lập trình đầy cảm hứng. Chúc Thầy ngày 20/11 thật nhiều niềm vui và luôn dồi dào sức khỏe!',
    is_hidden: false,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'wish-3',
    author_id: 'guest-3',
    author_name: 'Trần Thị Thu Thảo',
    teacher_id: 'teacher-2',
    teacher_name: 'Cô Lê Thị Mai',
    content: 'Cảm ơn Cô vì đã luôn kiên nhẫn và bao dung với chúng em trên từng chặng đường rèn luyện sư phạm.',
    is_hidden: false,
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
  },
];

export const INITIAL_MEMORY_MARKS: MemoryMark[] = [
  {
    id: 'mark-1',
    room_id: 'classroom_1',
    session_id: 'seed-1',
    display_name: 'Cựu sinh viên K18',
    symbol: 'heart',
    card_color: '#fef3c7', // Warm Pastel Yellow
    message: 'Kính chúc các Thầy Cô Khoa Sư Phạm luôn tràn đầy nhiệt huyết và sức khỏe! 20/11 nhớ lớp xưa nhiều lắm.',
    moderation_status: 'approved',
    pin_x: -1.4,
    pin_y: 0.4,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    approved_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'mark-2',
    room_id: 'classroom_1',
    session_id: 'seed-2',
    display_name: 'Lớp Trưởng K21 - CNTT',
    symbol: 'grad_cap',
    card_color: '#e0f2fe', // Soft Pastel Blue
    message: 'Đại học Tây Nguyên mãi là thanh xuân rực rỡ nhất của chúng em. Cảm ơn Thầy Cô đã chắp cánh ước mơ!',
    moderation_status: 'approved',
    pin_x: -0.5,
    pin_y: 0.35,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    approved_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: 'mark-3',
    room_id: 'classroom_1',
    session_id: 'seed-3',
    display_name: 'Nhóm Nghiên Cứu Trẻ',
    symbol: 'star',
    card_color: '#d1fae5', // Mint Pastel Green
    message: 'Mỗi hạt giống tri thức gieo trên mảnh đất Tây Nguyên hôm nay sẽ nở hoa vào ngày mai. Tri ân Thầy Cô!',
    moderation_status: 'approved',
    pin_x: 0.5,
    pin_y: 0.45,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    approved_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'mark-4',
    room_id: 'classroom_1',
    session_id: 'seed-4',
    display_name: 'Nguyễn Thị Mai',
    symbol: 'sunflower',
    card_color: '#ffedd5', // Peach Pastel Orange
    message: 'Dù mai này đi muôn nơi, chúng ta vẫn có một lớp học để trở về! Chúc cả lớp luôn gắn kết.',
    moderation_status: 'approved',
    pin_x: 1.4,
    pin_y: 0.38,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    approved_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];


