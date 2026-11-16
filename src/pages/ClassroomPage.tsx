import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraPreset, CameraViewMode, SeatInfo, AvatarCustomization, FlowerType, FLOWER_TYPES } from '../types';
import { CurrentUser } from '../services/api';
import { useProjector } from '../hooks/useProjector';
import { useScreenShare } from '../hooks/useScreenShare';
import { liveProjection } from '../lib/projectorMedia';
import { LiveProjector } from '../components/projector/LiveProjector';
import { useWishes } from '../hooks/useWishes';
import { useFlowers } from '../hooks/useFlowers';
import { useMultiplayer, WishAnnouncement } from '../hooks/useMultiplayer';
import { ClassroomScene } from '../components/classroom/ClassroomScene';
import { SceneBoundary } from '../components/SceneBoundary';
import { FallbackClassroom2D } from '../components/classroom/FallbackClassroom2D';
import { ProjectorOverlay } from '../components/projector/ProjectorOverlay';
import { ProjectorControls } from '../components/projector/ProjectorControls';
import { WishModal } from '../components/wishes/WishModal';
import { FlowerModal } from '../components/flowers/FlowerModal';
import { CampusMapModal } from '../components/map/CampusMapModal';
import { OnlineUsersPanel } from '../components/classroom/OnlineUsersPanel';
import { MobileJoystick } from '../components/classroom/MobileJoystick';
import { AvatarCustomizerModal } from '../components/avatar/AvatarCustomizerModal';
import { MobileActionCluster } from '../components/classroom/MobileActionCluster';
import { OnScreenMovementController } from '../components/classroom/OnScreenMovementController';
import { MobileMenuModal } from '../components/classroom/MobileMenuModal';
import { TeacherActionSheet } from '../components/classroom/TeacherActionSheet';
import { CameraToolbar } from '../components/classroom/CameraToolbar';
import { CameraZoom, initialCameraZoom } from '../lib/cameraZoom';
import { MemoryWallModal } from '../components/memoryWall/MemoryWallModal';
import { PhotoBoothModal } from '../components/classroom/PhotoBoothModal';
import { WishToastNotification } from '../components/classroom/WishToastNotification';
import { useMemoryMarks } from '../hooks/useMemoryMarks';
import { getSmartAction, SmartAction, SmartActionType } from '../lib/interactionTargets';
import { CLASSROOM_SEATS, SEAT_INTERACTION_DISTANCE, SEAT_DISTANCE_EPSILON } from '../lib/seatData';
import { getSafeStandPosition } from '../lib/collision';
import { soundManager } from '../lib/audioManager';
import { 
  Projector, 
  Heart, 
  MapPin, 
  Camera, 
  LogOut, 
  Shield, 
  Maximize2, 
  Layers, 
  Radio, 
  Users, 
  Eye, 
  UserCheck,
  Sparkles,
  Settings,
  Menu,
  Pin,
  Bell,
  Volume2,
  VolumeX,
  Music,
  Map,
  Armchair
} from 'lucide-react';

interface ClassroomPageProps {
  currentUser: CurrentUser | null;
  onLogout: () => Promise<void>;
  onUpdateAvatar?: (avatar: AvatarCustomization) => void;
}

export const ClassroomPage: React.FC<ClassroomPageProps> = ({ 
  currentUser, 
  onLogout,
  onUpdateAvatar 
}) => {
  const navigate = useNavigate();

  // State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [cameraZoom, setCameraZoom] = useState<CameraZoom>(initialCameraZoom);
  const handleCameraZoom = (zoom: CameraZoom) => {
    setCameraZoom(zoom);
    try { localStorage.setItem('lop_hoc_camera_zoom', String(zoom)); } catch { /* Optional preference. */ }
  };
  const [viewMode, setViewMode] = useState<CameraViewMode>('third-person'); // Default to 3rd person as requested
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [mobileMove, setMobileMove] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nearestSeat, setNearestSeat] = useState<SeatInfo | null>(null);

  // Modals & Panels
  const [showProjectorOverlay, setShowProjectorOverlay] = useState<boolean>(false);
  const [showProjectorControls, setShowProjectorControls] = useState<boolean>(false);
  const [showWishModal, setShowWishModal] = useState<boolean>(false);
  const [showFlowerModal, setShowFlowerModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showUsersPanel, setShowUsersPanel] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [showTeacherActionSheet, setShowTeacherActionSheet] = useState<boolean>(false);
  const [showMemoryWallModal, setShowMemoryWallModal] = useState<boolean>(false);
  const [showPhotoBooth, setShowPhotoBooth] = useState<boolean>(false);
  const [photoBoothUrl, setPhotoBoothUrl] = useState<string | null>(null);

  // Mobile run/walk state (speed toggle)
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundManager.getMuted());
  const [projectorSound, setProjectorSound] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(soundManager.getIsBgmPlaying());
  useEffect(() => soundManager.subscribe(() => {
    setIsBgmPlaying(soundManager.getIsBgmPlaying());
    setIsAudioMuted(soundManager.getMuted());
  }), []);

  // Graphics Quality (Low / Medium / High)
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>(() => {
    try {
      const saved = localStorage.getItem('lop_hoc_graphics_quality');
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
      return 'medium';
    } catch {
      return 'medium';
    }
  });

  const handleGraphicsQualityChange = (q: 'low' | 'medium' | 'high') => {
    setGraphicsQuality(q);
    try {
      localStorage.setItem('lop_hoc_graphics_quality', q);
    } catch {}
  };

  // Wishes live notifications setting
  const [wishesNotificationEnabled, setWishesNotificationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lop_hoc_wishes_notification');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleWishesNotification = () => {
    const nextVal = !wishesNotificationEnabled;
    setWishesNotificationEnabled(nextVal);
    try {
      localStorage.setItem('lop_hoc_wishes_notification', nextVal ? 'true' : 'false');
    } catch {}
  };

  // Live incoming wish toast
  const [liveWish, setLiveWish] = useState<WishAnnouncement | null>(null);

  // Camera sensitivity with persistence
  const [cameraSensitivity, setCameraSensitivity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('lop_hoc_camera_sensitivity');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const handleSensitivityChange = (val: number) => {
    setCameraSensitivity(val);
    try {
      localStorage.setItem('lop_hoc_camera_sensitivity', val.toString());
    } catch {
      // Ignored
    }
  };

  // 3D Flower burst & compact toast notification states
  const [flowerBurstTime, setFlowerBurstTime] = useState<number>(0);
  const [flowerBurstType, setFlowerBurstType] = useState<FlowerType>('rose');
  const [flowerToast, setFlowerToast] = useState<{ senderName: string; teacherName: string; flowerName?: string } | null>(null);

  // Check if any modal is currently active (used to lock keyboard WASD movement)
  const isAnyModalOpen =
    showWishModal ||
    showFlowerModal ||
    showProjectorOverlay ||
    showProjectorControls ||
    showMapModal ||
    showUsersPanel ||
    showAvatarModal ||
    showMobileMenu ||
    showTeacherActionSheet ||
    showMemoryWallModal ||
    showPhotoBooth;

  // Trigger celebration effect & toast notification
  const triggerFlowerCelebration = (
    senderName: string, 
    teacherName: string, 
    flowerType: FlowerType = 'rose',
    flowerName = 'Hoa Hồng Đỏ'
  ) => {
    setFlowerBurstType(flowerType);
    setFlowerBurstTime(Date.now());
    setFlowerToast({ senderName, teacherName, flowerName });
    soundManager.playFlowerSound();
    setTimeout(() => {
      setFlowerToast(null);
    }, 4200);
  };

  // Hooks
  const { projector, mediaList, isChanging, changeSlide, setRetrospectiveMode, command: projectorCommand, clockOffset } = useProjector();
  const screenShare = useScreenShare(projector, currentUser?.id, projectorCommand);
  const isStaff = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const { wishes, error: wishesError, submitting: wishSubmitting, submitWish, toggleHide } = useWishes(isStaff);
  const { teachers, loading: teachersLoading, error: teachersError, submitting: flowerSubmitting, sendFlower, refetch: refreshTeachers } = useFlowers();
  useEffect(() => {
    if (showFlowerModal) refreshTeachers();
  }, [showFlowerModal, refreshTeachers]);
  const { 
    marks: memoryMarks, 
    allMarks: allMemoryMarks, 
    error: memoryError,
    submitMark, 
    moderate: moderateMark 
  } = useMemoryMarks(isStaff);

  const { 
    localPlayer, 
    remotePlayers, 
    occupiedSeats, 
    connectionStatus, 
    seatRequestPending,
    updateLocalPlayer, 
    broadcastFlowerGift, 
    broadcastWish,
    requestSeat, 
    releaseSeat 
  } = useMultiplayer(
    currentUser,
    (info) => {
      triggerFlowerCelebration(
        info.senderName, 
        info.teacherName,
        info.flowerType || 'rose',
        info.flowerName || 'Hoa Hồng Đỏ'
      );
    },
    (wishInfo) => {
      if (wishesNotificationEnabled) {
        setLiveWish(wishInfo);
        soundManager.playPinSound();
        setTimeout(() => {
          setLiveWish((prev) => (prev === wishInfo ? null : prev));
        }, 5500);
      }
    }
  );

  // Send flower with synchronized 3D celebration, sound and toast
  const handleSendFlower = async (
    senderId: string, 
    receiverId: string, 
    note?: string,
    flowerType: FlowerType = 'rose',
    flowerName = 'Hoa Hồng Đỏ'
  ) => {
    const res = await sendFlower(senderId, receiverId, note, flowerType, flowerName);
    if (res.success) {
      const teacher = teachers.find((t) => t.id === receiverId);
      const teacherName = teacher?.display_name || 'Quý Thầy Cô';
      const senderName = currentUser?.displayName || 'Bạn';
      triggerFlowerCelebration(senderName, teacherName, flowerType, flowerName);

      // Avatar performs a respectful flower gifting bow & presentation
      updateLocalPlayer((prev) => ({ ...prev, state: 'gifting' }));
      setTimeout(() => {
        updateLocalPlayer((prev) => (prev.state === 'gifting' ? { ...prev, state: 'standing' } : prev));
      }, 3200);
    }
    return res;
  };

  // Submit wish with realtime broadcast
  const handleWishSubmit = async (
    content: string, 
    teacherId?: string, 
    teacherName?: string
  ) => {
    const authorName = currentUser?.displayName || 'Khách tham quan';
    const res = await submitWish(
      currentUser?.id || 'guest',
      authorName,
      content,
      teacherId,
      teacherName
    );
    if (res) {
      soundManager.playPinSound();
    }
    return res;
  };

  // Keyboard shortcut 'V' to toggle View Mode (disabled when modal is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyV' && !isAnyModalOpen) {
        setViewMode((prev) => (prev === 'third-person' ? 'first-person' : 'third-person'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyModalOpen]);

  // Keep the shared track silent for live projection or an enlarged slide.
  const projectorHoldsMusic = liveProjection(projector) || showProjectorOverlay;
  useEffect(() => {
    soundManager.setProjectorActive(projectorHoldsMusic);
  }, [projectorHoldsMusic]);
  useEffect(() => () => soundManager.setProjectorActive(false), []);

  const handleLogout = async () => {
    await onLogout();
    navigate('/');
  };

  // Toggle Audio Mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsAudioMuted(muted);
  };

  // Toggle shared background track
  const handleToggleBgm = () => {
    const playing = soundManager.toggleBgm();
    setIsBgmPlaying(playing);
  };

  // Ring School Bell
  const handleRingBell = () => {
    soundManager.playBellSound();
  };

  // P5.8: Capture Commemorative Classroom Photo
  const handleTakePhoto = async () => {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;


      // Create an offscreen canvas for high-quality composite framing
      const width = 1280;
      const height = 720;
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Không tạo được ảnh.');

      // Capture the active display, including the 2D fallback.
      if (canvas && is3DMode) {
        ctx.drawImage(canvas, 0, 0, width, height);
      } else if (projector?.mode === 'retrospective') {
        const mark = memoryMarks.find((item) => item.id === projector.retrospective_mark_id);
        ctx.fillStyle = mark?.card_color || '#fef3c7'; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#422006'; ctx.textAlign = 'center'; ctx.font = 'bold 34px serif';
        ctx.fillText(mark?.display_name || 'Kỷ niệm lớp học', width / 2, 260, width - 100);
        ctx.font = '24px sans-serif';
        const words = (mark?.message || 'Chúng ta đã từng ở đây').split(/\s+/);
        let line = ''; let row = 330;
        for (const word of words) {
          if (ctx.measureText(line + word).width > width - 160) { ctx.fillText(line, width / 2, row); row += 36; line = ''; }
          line += word + ' ';
        }
        ctx.fillText(line, width / 2, row);
      } else {
        const image = new Image(); image.crossOrigin = 'anonymous';
        image.src = projector?.media?.payload?.url || '/media/slide1_ngay_tro_ve.svg';
        await image.decode(); ctx.drawImage(image, 0, 0, width, height);
      }

      // 2. Draw Top & Bottom Vignette / Contrast gradient
      const topGrad = ctx.createLinearGradient(0, 0, 0, 115);
      topGrad.addColorStop(0, 'rgba(28, 20, 14, 0.88)');
      topGrad.addColorStop(1, 'rgba(28, 20, 14, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 115);

      const bottomGrad = ctx.createLinearGradient(0, height - 120, 0, height);
      bottomGrad.addColorStop(0, 'rgba(28, 20, 14, 0)');
      bottomGrad.addColorStop(1, 'rgba(28, 20, 14, 0.90)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, height - 120, width, 120);

      // 3. Draw Commemorative Golden Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, width - 36, height - 36);

      // Corner golden square rosettes
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(14, 14, 10, 10);
      ctx.fillRect(width - 24, 14, 10, 10);
      ctx.fillRect(14, height - 24, 10, 10);
      ctx.fillRect(width - 24, height - 24, 10, 10);

      // 4. Header Plaque: "LỚP HỌC KÝ ỨC — 20/11/2026"
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('LỚP HỌC KÝ ỨC — TRI ÂN THẦY CÔ 20/11', width / 2, 50);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '16px sans-serif';
      ctx.fillText('TRƯỜNG ĐẠI HỌC TÂY NGUYÊN', width / 2, 78);

      // 5. Footer: Participant name & timestamp
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 20px serif';
      ctx.fillText(`Kỷ niệm: ${currentUser?.displayName || 'Cựu sinh viên'}`, 36, height - 48);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Ngày 20/11/2026 • "Chúng ta đã từng ở đây"`, 36, height - 24);

      // Seal / stamp on right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#F43F5E';
      ctx.font = 'bold 18px serif';
      ctx.fillText('💮 KỶ NIỆM MÁI TRƯỜNG', width - 36, height - 36);

      const dataUrl = offscreen.toDataURL('image/png');
      setPhotoBoothUrl(dataUrl);
      setShowPhotoBooth(true);
      soundManager.playPinSound();
    } catch (err) {
      console.error('Lỗi chụp ảnh:', err);
      alert('Không thể tạo ảnh kỷ niệm lúc này');
    }
  };

  // P2 & P3: Sit on seat (with reach check, atomic server check & mutual exclusion)
  const handleSit = async (seat: SeatInfo) => {
    if (seatRequestPending) return;
    // 1. Prevent teleporting to a chair that is too far away
    const dist = Math.hypot(localPlayer.x - seat.seatAnchor.x, localPlayer.z - seat.seatAnchor.z);
    if (dist > SEAT_INTERACTION_DISTANCE + SEAT_DISTANCE_EPSILON) {
      alert('Hãy đến gần ghế hơn để ngồi.');
      return;
    }
    if (seat.isTeacherSeat && !isStaff) { alert('Ghế này dành cho giáo viên. Bạn hãy chọn ghế sinh viên.'); return; }

    // 2. Prevent two people sitting on the same seat
    const isOccupiedByRemote = remotePlayers.some(
      (p) => p.seatId === seat.id && p.state === 'sitting'
    );
    const isOccupiedByServer = occupiedSeats.has(seat.id) && occupiedSeats.get(seat.id)?.sessionId !== localPlayer.id;
    if (isOccupiedByRemote || isOccupiedByServer) {
      alert('Ghế này đã có người ngồi!');
      return;
    }

    // 3. Request seat atomically from server
    const confirmed = await requestSeat(seat);
    if (!confirmed) return;

    // Turn off running when sitting
    setIsRunning(false);

    updateLocalPlayer((prev) => ({
      ...prev,
      x: seat.seatAnchor.x,
      y: seat.seatAnchor.y,
      z: seat.seatAnchor.z,
      rotY: seat.seatAnchor.rotY,
      state: 'sitting',
      seatId: seat.id,
    }));
  };

  // P2 & P3: Stand up: release seat on server and move to verified collision-free standAnchor
  const handleStand = () => {
    releaseSeat();
    const currentSeat = CLASSROOM_SEATS.find((s) => s.id === localPlayer.seatId);
    const safePos = currentSeat
      ? getSafeStandPosition(currentSeat)
      : { x: localPlayer.x, y: 0, z: localPlayer.z + 0.40 };

    updateLocalPlayer((prev) => ({
      ...prev,
      state: 'standing',
      seatId: null,
      x: safePos.x,
      y: 0,
      z: safePos.z,
    }));
  };

  // P2.5: Real-time Smart Context Action detection with hysteresis
  const prevSmartActionRef = React.useRef<SmartActionType>('none');
  const currentSmartAction = React.useMemo(() => {
    return getSmartAction(localPlayer, remotePlayers, prevSmartActionRef.current);
  }, [localPlayer, remotePlayers]);

  React.useEffect(() => {
    prevSmartActionRef.current = currentSmartAction?.type || 'none';
  }, [currentSmartAction]);

  // Execute smart action
  const handleExecuteSmartAction = (action: SmartAction) => {
    switch (action.type) {
      case 'sit':
        if (action.seatInfo) {
          handleSit(action.seatInfo);
        }
        break;
      case 'stand':
        handleStand();
        break;
      case 'projector':
        setShowProjectorOverlay(true);
        break;
      case 'teacher':
        setShowTeacherActionSheet(true);
        break;
      case 'memory_wall':
        setShowMemoryWallModal(true);
        break;
    }
  };

  const isLocalSitting = localPlayer.state === 'sitting';
  const totalOnline = 1 + remotePlayers.length;

  // Check if player is standing close to the front projector screen
  const isNearProjector =
    !isLocalSitting &&
    localPlayer.z <= -2.6 &&
    Math.abs(localPlayer.x) <= 3.2;

  const liveMedia = liveProjection(projector) && projector ? <LiveProjector
    projector={projector} clockOffset={clockOffset} canControl={isStaff} command={projectorCommand}
    stream={screenShare.stream} isPresenting={screenShare.isPresenting} status={screenShare.status} error={screenShare.error}
    audible={projectorSound && !isAudioMuted} onSound={(enabled) => { setProjectorSound(enabled); if (enabled && isAudioMuted) handleToggleMute(); }} onStop={screenShare.stop}
  /> : null;

  return (
    <div className="classroom-ui relative w-full h-dvh overflow-hidden bg-[#1C140E] flex flex-col select-none">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVIGATION BAR                                            */}
      {/* ------------------------------------------------------------- */}
      <header className="classroom-header shrink-0 z-30 h-14 w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-500/30 px-3 sm:px-4 flex items-center justify-between text-white shadow-lg">
        {/* Mobile View Header */}
        <div className="classroom-mobile-header flex 2xl:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-900 border border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xs shadow">
              20/11
            </div>
            <div>
              <span className="font-extrabold text-xs text-amber-100 block leading-tight">
                Lớp Học Ký Ức
              </span>
              <span className="text-[9px] text-amber-400 font-medium">ĐH Tây Nguyên</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Ring Bell on Mobile */}
            <button
              onClick={handleRingBell}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 shadow active:scale-95 transition-transform"
              title="Đánh chuông vào lớp"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Quick Photo on Mobile */}
            <button
              onClick={handleTakePhoto}
              className="p-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow active:scale-95 transition-transform"
              title="Chụp ảnh kỷ niệm"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Online Users Button */}
            <button
              onClick={() => setShowUsersPanel(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 text-xs font-bold shadow active:scale-95 transition-transform"
              title="Danh sách người trong lớp"
            >
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400' :
                connectionStatus === 'reconnecting' ? 'bg-amber-400 animate-ping' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
              }`} />
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{totalOnline}</span>
            </button>

            {/* Mobile Menu & Settings Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-white/20 text-gray-200 hover:text-white hover:border-amber-400 shadow active:scale-95 transition-all"
              title="Menu chức năng"
            >
              <Settings className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>

        {/* Desktop View Header: Full navigation bar */}
        <div className="hidden 2xl:flex items-center justify-between w-full">
          {/* Left: School Title & Project */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xs shadow">
              20/11
            </div>
            <div>
              <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                Đại học Tây Nguyên
              </div>
              <h1 className="text-xs sm:text-sm font-bold truncate max-w-[130px] sm:max-w-xs">
                Lớp Học Ký Ức
              </h1>
            </div>
          </div>

          {/* Center: Camera Presets & View Mode Switcher */}
          {is3DMode && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => setViewMode('third-person')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'third-person'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  title="Góc nhìn thứ 3 (phía sau nhân vật)"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Góc nhìn thứ 3</span>
                </button>
                <button
                  onClick={() => setViewMode('first-person')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'first-person'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                  title="Góc nhìn thứ 1 (nhìn qua mắt nhân vật)"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Góc nhìn thứ 1</span>
                </button>
              </div>

              {/* Camera Presets for Quick Navigation */}
              <div className="hidden xl:flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-xl p-1 text-[11px]">
                <button
                  onClick={() => {
                    setCameraPreset('overview');
                    setViewMode('orbit');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    cameraPreset === 'overview' && viewMode === 'orbit' ? 'bg-amber-500/25 text-amber-300 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Góc nhìn bao quát toàn lớp"
                >
                  Toàn lớp
                </button>
                <button
                  onClick={() => {
                    setCameraPreset('board');
                    setViewMode('orbit');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    cameraPreset === 'board' && viewMode === 'orbit' ? 'bg-amber-500/25 text-amber-300 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Góc nhìn bảng & màn chiếu"
                >
                  Bảng
                </button>
                <button
                  onClick={() => {
                    setCameraPreset('podium');
                    setViewMode('orbit');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    cameraPreset === 'podium' && viewMode === 'orbit' ? 'bg-amber-500/25 text-amber-300 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Góc nhìn bục giảng thầy cô"
                >
                  Bục giảng
                </button>
              </div>
            </div>
          )}

          {/* Right: Sound, Photo, Online Users, Modals & Profile */}
          <div className="flex items-center gap-2">
            {/* 🔔 Ring Bell Button */}
            <button
              onClick={handleRingBell}
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/30 transition-all shadow"
              title="Đánh chuông vào lớp (Classroom Bell)"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Chuông lớp</span>
            </button>

            {/* 🎵 Procedural BGM Button */}
            <button
              onClick={handleToggleBgm}
              data-audio-control
              disabled={projectorHoldsMusic}
              className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                isBgmPlaying 
                  ? 'bg-amber-900/50 text-amber-200 border-amber-400' 
                  : 'bg-slate-800 text-gray-300 hover:text-white border-white/10'
              }`}
              title={projectorHoldsMusic ? 'Nhạc nền tạm dừng khi đang trình chiếu' : 'Bật/Tắt nhạc nền tri ân'}
            >
              <Music className={`w-3.5 h-3.5 ${isBgmPlaying ? 'text-amber-400 animate-spin' : ''}`} />
              <span className="hidden xl:inline">{projectorHoldsMusic ? 'Nhạc: Tạm dừng' : isBgmPlaying ? 'Nhạc: Bật' : 'Nhạc'}</span>
            </button>

            {/* 🔊 Audio Mute Toggle */}
            <button
              onClick={handleToggleMute}
              data-audio-control
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isAudioMuted 
                  ? 'bg-red-900/40 text-red-300 border-red-500/30' 
                  : 'bg-slate-800 text-emerald-300 border-white/10'
              }`}
              title={isAudioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* 📸 Take Photo Booth Button */}
            <button
              onClick={handleTakePhoto}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all hover:scale-105"
              title="Chụp ảnh kỷ niệm lớp học"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp ảnh</span>
            </button>

            {/* 🗺️ Sơ đồ trường button */}
            <button
              onClick={() => setShowMapModal(true)}
              className="hidden lg:flex p-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold items-center gap-1.5 border border-sky-500/30 transition-all shadow"
              title="Sơ đồ khuôn viên Đại học Tây Nguyên"
            >
              <Map className="w-3.5 h-3.5 text-sky-400" />
              <span>Sơ đồ trường</span>
            </button>

            {/* Online Users Button */}
            <button
              onClick={() => setShowUsersPanel(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all shadow"
              title="Xem danh sách người đang trong lớp"
            >
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400' :
                connectionStatus === 'reconnecting' ? 'bg-amber-400 animate-ping' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
              }`} />
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalOnline} online</span>
            </button>

            {/* 3D / 2D Toggle */}
            <button
              onClick={() => setIs3DMode(!is3DMode)}
              className="hidden sm:flex p-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-medium items-center gap-1.5 border border-white/10"
              title={is3DMode ? 'Chuyển sang 2D' : 'Chuyển sang 3D'}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{is3DMode ? '3D' : '2D'}</span>
            </button>

            {/* Bức tường dấu ấn button */}
            <button
              onClick={() => setShowMemoryWallModal(true)}
              className="hidden lg:flex p-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold items-center gap-1.5 border border-amber-500/40 transition-all shadow"
              title="Bức tường dấu ấn - Chúng ta đã từng ở đây"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <span>Dấu ấn ({memoryMarks.length})</span>
            </button>

            {/* Avatar Customizer Button */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-400/30 transition-all shadow"
              title="Đổi kiểu tóc & màu áo Avatar"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Avatar</span>
            </button>

            {/* Teacher/Admin Control Button */}
            {isStaff && (
              <button
                onClick={() => setShowProjectorControls(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Projector className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Máy chiếu</span>
              </button>
            )}

            {/* Admin Dashboard */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            )}

            {/* User Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-amber-600 border border-amber-300/60 flex items-center justify-center font-bold text-xs text-white shadow">
                {currentUser?.displayName?.[0] || 'U'}
              </div>
              <span className="text-xs font-semibold text-gray-200 truncate max-w-[90px]">
                {currentUser?.displayName || 'Khách'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-gray-400 hover:text-red-300 transition-colors"
              title="Rời khỏi lớp học"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <CameraToolbar zoom={cameraZoom} onZoom={handleCameraZoom} is3D={is3DMode} />

      {/* ------------------------------------------------------------- */}
      {/* 3D CANVAS & WORKSPACE                                         */}
      {/* ------------------------------------------------------------- */}
      <main className="relative flex-1 min-h-0 w-full overflow-hidden">
        {is3DMode ? (
          <SceneBoundary onFailure={() => setIs3DMode(false)}><ClassroomScene
            cameraZoom={cameraZoom}
            liveMedia={!showProjectorOverlay ? liveMedia : null}
            preset={cameraPreset}
            viewMode={viewMode}
            projector={projector}
            localPlayer={localPlayer}
            remotePlayers={remotePlayers}
            nearestSeat={nearestSeat}
            mobileMove={mobileMove}
            isInputDisabled={isAnyModalOpen || seatRequestPending}
            flowerBurstTime={flowerBurstTime}
            flowerType={flowerBurstType}
            isRunning={isRunning}
            cameraSensitivity={cameraSensitivity}
            marks={memoryMarks}
            graphicsQuality={graphicsQuality}
            onOpenMemoryWall={() => setShowMemoryWallModal(true)}
            onUpdatePlayer={updateLocalPlayer}
            onNearestSeatChange={setNearestSeat}
            onSit={handleSit}
            onStand={handleStand}
            onOpenOverlay={() => setShowProjectorOverlay(true)}
            onTriggerSmartAction={() => {
              if (currentSmartAction) handleExecuteSmartAction(currentSmartAction);
            }}
            onViewModeChange={setViewMode}
          /></SceneBoundary>
        ) : (
          <FallbackClassroom2D
            liveMedia={!showProjectorOverlay ? liveMedia : null}
            marks={memoryMarks}
            projector={projector}
            onOpenOverlay={() => setShowProjectorOverlay(true)}
            onOpenWishes={() => setShowWishModal(true)}
            onOpenFlowers={() => setShowFlowerModal(true)}
          />
        )}

        {/* Floating prompt when player approaches projector screen in front of classroom */}
        {isNearProjector && !showProjectorOverlay && (
          <div className="classroom-projector-prompt absolute top-14 left-1/2 -translate-x-1/2 z-20 animate-fadeIn">
            <button
              onClick={() => setShowProjectorOverlay(true)}
              className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-300 text-xs font-semibold shadow-xl flex items-center gap-2 border border-amber-400/40 backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Đang đứng trước Màn Chiếu — Nhấn để xem phóng to</span>
            </button>
          </div>
        )}

        {/* Compact 3D Flower Gifting Toast Notification (Non-intrusive) */}
        {flowerToast && (
          <div className="fixed top-16 right-4 z-40 bg-slate-900/95 border-2 border-rose-400/80 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
            <span className="text-2xl p-1 bg-rose-500/20 rounded-xl">💐</span>
            <div>
              <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wide">Tri Ân 20/11</div>
              <div className="text-xs text-gray-200">
                {currentUser?.role === 'teacher' && 
                 (flowerToast.teacherName === currentUser.displayName || flowerToast.teacherName === 'Quý Thầy Cô') ? (
                  <>
                    Thầy/Cô vừa nhận được <span className="text-rose-300 font-semibold">{flowerToast.flowerName || 'đóa hoa'}</span> từ <strong className="text-amber-200">{flowerToast.senderName}</strong>!
                  </>
                ) : (
                  <>
                    <strong className="text-amber-200">{flowerToast.senderName}</strong> vừa tặng{' '}
                    <span className="text-rose-300 font-semibold">{flowerToast.flowerName || 'hoa'}</span> tới{' '}
                    <strong className="text-rose-200">{flowerToast.teacherName}</strong>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact Live Wishes Toast Notification (Non-intrusive) */}
        <WishToastNotification
          wish={liveWish}
          onClose={() => setLiveWish(null)}
          onOpenWishModal={() => setShowWishModal(true)}
        />

        {/* Realtime Live Status Pill (Top Left of scene) */}
        <div className="classroom-status absolute top-3 left-3 z-20 flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="bg-emerald-950/80 border border-emerald-400/50 backdrop-blur-md text-emerald-200 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Realtime: {totalOnline} người</span>
            </div>
          ) : (
            <div className="bg-amber-950/80 border border-amber-400/50 backdrop-blur-md text-amber-200 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{connectionStatus === 'disconnected' ? 'Mất kết nối lớp' : 'Đang kết nối lớp...'} · {totalOnline} người trên trình duyệt này</span>
            </div>
          )}
        </div>

        {/* Movement Controls Guide (Top center on desktop) */}
        <div className="hidden 2xl:flex absolute top-3 left-1/2 -translate-x-1/2 z-20 items-center gap-2 bg-slate-950/85 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs text-amber-100 backdrop-blur-md shadow-lg pointer-events-none">
          <span className="font-bold text-amber-300">🎮 Di chuyển:</span>
          <span>Phím WASD / Mũi tên HOẶC click nút điều hướng ở góc trái</span>
          <span className="text-white/30">•</span>
          <span><strong className="text-amber-300">E:</strong> Tương tác</span>
          <span className="text-white/30">•</span>
          <span><strong className="text-amber-300">V:</strong> Đổi góc nhìn</span>
          <span className="text-white/30">•</span>
          <span><strong className="text-amber-300">Shift:</strong> Chạy</span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ON-SCREEN MOVEMENT CONTROLS (Only movement buttons bottom-left) */}
        {/* ------------------------------------------------------------- */}
        <div className="classroom-movement absolute z-20">
          <OnScreenMovementController
            onMove={(vec) => setMobileMove(vec)}
            disabled={isAnyModalOpen || seatRequestPending}
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* QUICK & SMART ACTION CLUSTER (Bottom Right)                   */}
        {/* ------------------------------------------------------------- */}
        <div className="classroom-actions absolute z-20 flex flex-col items-end">
          {/* Smart Context Interaction Button (Highlights when near objects/teachers/seats) */}
          {currentSmartAction && (
            <button
              onClick={() => handleExecuteSmartAction(currentSmartAction)}
              disabled={seatRequestPending}
              className={`classroom-smart-action min-w-0 max-w-full px-3 sm:px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2.5 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-pulse ${
                currentSmartAction.colorTheme === 'amber'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300 shadow-amber-500/40'
                  : currentSmartAction.colorTheme === 'sky'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-300 shadow-sky-500/40'
                  : currentSmartAction.colorTheme === 'rose'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-300 shadow-rose-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/40'
              }`}
            >
              {currentSmartAction.iconName === 'seat' && <Armchair className="w-5 h-5 stroke-[2.2]" />}
              {currentSmartAction.iconName === 'stand' && <UserCheck className="w-5 h-5 stroke-[2.2]" />}
              {currentSmartAction.iconName === 'projector' && <Maximize2 className="w-5 h-5 stroke-[2.2]" />}
              {currentSmartAction.iconName === 'teacher' && <Heart className="w-5 h-5 stroke-[2.2] fill-current" />}
              {currentSmartAction.iconName === 'memory_wall' && <Pin className="w-5 h-5 stroke-[2.2]" />}
              {currentSmartAction.iconName !== 'seat' &&
                currentSmartAction.iconName !== 'stand' &&
                currentSmartAction.iconName !== 'projector' &&
                currentSmartAction.iconName !== 'teacher' &&
                currentSmartAction.iconName !== 'memory_wall' && (
                  <Sparkles className="w-5 h-5 stroke-[2.2]" />
                )}
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-extrabold leading-tight">
                  {seatRequestPending ? 'Đang xác nhận ghế…' : currentSmartAction.label}
                </span>
                {currentSmartAction.subLabel && (
                  <span className="text-[10px] font-medium opacity-90 leading-none mt-0.5">
                    {currentSmartAction.subLabel} (Phím E)
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Quick Floating Action Pills */}
          <div className="classroom-quick-actions flex items-center flex-wrap justify-end">
            {/* 💐 Tặng hoa */}
            <button
              onClick={() => setShowFlowerModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg border border-rose-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Tặng hoa Tri Ân Thầy Cô"
            >
              <span className="text-base">💐</span>
              <span>Tặng hoa</span>
            </button>

            {/* 📖 Sổ lưu bút */}
            <button
              onClick={() => setShowWishModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg border border-amber-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Sổ lưu bút & Lời chúc 20/11"
            >
              <span className="text-base">📖</span>
              <span>Sổ lưu bút</span>
            </button>

            {/* 📌 Dấu ấn */}
            <button
              onClick={() => setShowMemoryWallModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg border border-emerald-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Bức tường Dấu Ấn - Chúng ta đã từng ở đây"
            >
              <Pin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Dấu ấn ({memoryMarks.length})</span>
            </button>

            {/* 📸 Chụp ảnh */}
            <button
              onClick={handleTakePhoto}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg border border-indigo-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Chụp ảnh kỷ niệm lớp học (Photo Booth)"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Chụp ảnh</span>
            </button>

            {/* 🗺️ Sơ đồ trường (Mobile/Tablet quick pill) */}
            <button
              onClick={() => setShowMapModal(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-300 text-xs font-bold flex items-center gap-1.5 shadow-lg border border-sky-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Xem sơ đồ trường Đại học Tây Nguyên"
            >
              <Map className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Sơ đồ trường</span>
            </button>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODALS & PANELS                                               */}
      {/* ------------------------------------------------------------- */}
      
      {/* 1. Online Users Panel */}
      <OnlineUsersPanel
        isOpen={showUsersPanel}
        onClose={() => setShowUsersPanel(false)}
        localPlayer={localPlayer}
        remotePlayers={remotePlayers}
        connectionStatus={connectionStatus}
      />

      {/* 2. Projector Fullscreen Overlay with Retrospective Support */}
      <ProjectorOverlay
        liveMedia={showProjectorOverlay ? liveMedia : null}
        isOpen={showProjectorOverlay}
        onClose={() => setShowProjectorOverlay(false)}
        projector={projector}
        canControl={isStaff}
        mediaList={mediaList}
        marks={memoryMarks}
        onSelectMedia={changeSlide}
        onRetrospectiveNavigate={(idx) => setRetrospectiveMode(true, idx)}
      />

      {/* 3. Staff Projector Controls Panel with Retrospective Mode */}
      {isStaff && (
        <ProjectorControls
          onYouTube={async (url) => { await projectorCommand({ youtube_url: url, expected_revision: projector?.revision || 0 }); setShowProjectorControls(false); }}
          onStartScreen={async () => { await screenShare.start(); setShowProjectorControls(false); }}
          onStopScreen={screenShare.stop}
          sharingBusy={screenShare.busy}
          isOpen={showProjectorControls}
          onClose={() => setShowProjectorControls(false)}
          projector={projector}
          mediaList={mediaList}
          marks={memoryMarks}
          isChanging={isChanging}
          onChangeSlide={changeSlide}
          onToggleRetrospective={(enabled, idx) => setRetrospectiveMode(enabled, idx || 0)}
        />
      )}

      {/* 4. Wish Wall / Lưu Bút Modal */}
      <WishModal
        isOpen={showWishModal}
        onClose={() => setShowWishModal(false)}
        wishes={wishes}
        loadError={wishesError}
        teachers={teachers}
        currentUser={currentUser}
        submitting={wishSubmitting}
        onSubmitWish={(content, teacherId, teacherName) =>
          handleWishSubmit(content, teacherId, teacherName)
        }
        onToggleHide={toggleHide}
        canModerate={isStaff}
      />

      {/* 5. Flower Gifting Modal */}
      <FlowerModal
        isOpen={showFlowerModal}
        onClose={() => setShowFlowerModal(false)}
        teachers={teachers}
        currentUser={currentUser}
        submitting={flowerSubmitting}
        loadingTeachers={teachersLoading}
        teachersError={teachersError}
        onRetryTeachers={refreshTeachers}
        onSendFlower={handleSendFlower}
      />

      {/* 6. Campus Map Modal */}
      <CampusMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
      />

      {/* 7. Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={localPlayer.avatar}
        onSave={(newAvatar) => {
          updateLocalPlayer((prev) => ({ ...prev, avatar: newAvatar }));
          if (onUpdateAvatar) onUpdateAvatar(newAvatar);
        }}
      />

      {/* 8. Mobile Menu & Settings Drawer/Modal */}
      <MobileMenuModal
        bgmSuspended={projectorHoldsMusic}
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onlineCount={totalOnline}
        onOpenWishes={() => setShowWishModal(true)}
        onOpenFlowers={() => setShowFlowerModal(true)}
        onOpenProjector={() => setShowProjectorOverlay(true)}
        onOpenProjectorControls={() => setShowProjectorControls(true)}
        onOpenMap={() => setShowMapModal(true)}
        onOpenUsers={() => setShowUsersPanel(true)}
        onOpenAvatar={() => setShowAvatarModal(true)}
        onOpenMemoryWall={() => setShowMemoryWallModal(true)}
        onTakePhoto={handleTakePhoto}
        onLogout={handleLogout}
        sensitivity={cameraSensitivity}
        onSensitivityChange={handleSensitivityChange}
        graphicsQuality={graphicsQuality}
        onGraphicsQualityChange={handleGraphicsQualityChange}
        isStaff={isStaff}
        wishesNotificationEnabled={wishesNotificationEnabled}
        onToggleWishesNotification={handleToggleWishesNotification}
      />

      {/* 9. Teacher Podium Interactive Action Sheet */}
      <TeacherActionSheet
        isOpen={showTeacherActionSheet}
        onClose={() => setShowTeacherActionSheet(false)}
        onOpenFlowers={() => setShowFlowerModal(true)}
        onOpenWishes={() => setShowWishModal(true)}
      />

      {/* 10. Memory Wall Modal ("Chúng ta đã từng ở đây") */}
      <MemoryWallModal
        loadError={memoryError}
        isOpen={showMemoryWallModal}
        onClose={() => setShowMemoryWallModal(false)}
        marks={memoryMarks}
        allMarks={allMemoryMarks}
        isStaff={isStaff}
        currentUserName={currentUser?.displayName || 'Cựu sinh viên'}
        onSubmitMark={submitMark}
        onModerateMark={moderateMark}
      />

      {/* 11. Commemorative Photo Booth Modal */}
      <PhotoBoothModal
        isOpen={showPhotoBooth}
        onClose={() => setShowPhotoBooth(false)}
        photoUrl={photoBoothUrl}
        authorName={currentUser?.displayName || 'Cựu sinh viên'}
      />
    </div>
  );
};
