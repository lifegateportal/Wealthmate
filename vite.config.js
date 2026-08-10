import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:8787',
      },
    },
    define: {
      'import.meta.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(
        env.VITE_DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY || ''
      ),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || ''
      ),
    },
  };
});