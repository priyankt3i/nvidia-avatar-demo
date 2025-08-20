import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const serverUrl = process.env.VITE_SERVER_URL || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/ws': {
        target: serverUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});