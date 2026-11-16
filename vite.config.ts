import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const serverKey = (value: string) => {
    if (value.startsWith('sb_secret_')) return true;
    try { return JSON.parse(Buffer.from(value.split('.')[1] || '', 'base64url').toString()).role === 'service_role'; }
    catch { return false; }
  };
  if (Object.values(env).some(serverKey)) {
    throw new Error('Không được đặt khóa Supabase bí mật trong biến VITE_. Chỉ cấu hình khóa đó ở backend.');
  }
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8787',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Fresh namespace after the former SPA fallback cached HTML as CSS.
        assetFileNames: 'assets/[name]-[hash]-v2[extname]',
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  };
});
