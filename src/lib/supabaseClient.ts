// Kept at the existing import path for compatibility. All shared data and Auth
// use the Worker API; the browser never needs a Supabase service or public key.
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
