type OrientationLock = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

export async function enterLandscape(): Promise<string> {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch { /* Some mobile browsers disallow fullscreen; still try orientation. */ }
  const orientation = screen.orientation as OrientationLock | undefined;
  try {
    if (orientation?.lock) {
      await orientation.lock('landscape');
      return 'Đã bật chế độ ngang. Thoát toàn màn hình để trở về chế độ tự xoay.';
    }
  } catch { /* Safari and desktop browsers may not support orientation locking. */ }
  return 'Hãy bật tự xoay màn hình rồi xoay ngang điện thoại. Nếu máy đang khóa xoay, hãy tắt khóa trong bảng điều khiển của điện thoại.';
}

export function unlockOrientation() {
  try { screen.orientation?.unlock?.(); } catch { /* Unsupported browser. */ }
}
