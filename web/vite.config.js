// web/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api requests to your Django backend
      '/api': {
        target: 'http://localhost:8000', // Django backend runs on 8000 by default
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false, // Backend is not HTTPS in dev
        // rewrite: (path) => path.replace(/^\/api/, ''), // Use if your backend doesn't expect /api prefix
      },
    },
  },
});