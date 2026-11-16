const key = 'lop_hoc_room_id';
const search = typeof window === 'undefined' ? '' : window.location.search || '';
const selected = new URLSearchParams(search).get('roomId') || (typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem(key)) || 'classroom_1';
export const ROOM_ID = /^[\w-]{1,80}$/.test(selected) ? selected : 'classroom_1';
if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, ROOM_ID);
export const withRoom = (path: string) => `${path}${path.includes('?') ? '&' : '?'}roomId=${encodeURIComponent(ROOM_ID)}`;
