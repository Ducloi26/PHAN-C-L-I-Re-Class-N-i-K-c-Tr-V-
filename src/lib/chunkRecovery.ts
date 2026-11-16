/** A tab opened before a deployment may request chunks the new build replaced. */
export function installChunkRecovery() {
  const recover = (event: Event) => {
    if (!navigator.onLine) return;
    try {
      const key = 'lop_hoc_chunk_reload_at';
      const previous = Number(sessionStorage.getItem(key) || 0);
      const now = Date.now();
      // A real network failure must never trap the user in a reload loop.
      if (previous && now - previous < 30_000) return;
      sessionStorage.setItem(key, String(now));
    } catch { return; }
    event.preventDefault();
    window.location.reload();
  };
  window.addEventListener('vite:preloadError', recover);
  return () => window.removeEventListener('vite:preloadError', recover);
}
