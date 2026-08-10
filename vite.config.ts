import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET?.replace(/\/$/, '') ||
    env.API_BACKEND_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:8787';

  return {
    plugins: [react()],
    server: {
      port: 5177,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': { target: apiProxyTarget, changeOrigin: true },
        '/shared': { target: apiProxyTarget, changeOrigin: true },
      },
    },
  };
});
