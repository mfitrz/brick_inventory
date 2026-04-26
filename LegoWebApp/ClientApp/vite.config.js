import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5241',
        changeOrigin: true,
      }
    }
  },
  // VITE_API_BASE_URL is set on Vercel to point to the Railway backend.
  // In dev the proxy above handles /api, so this env var is not needed locally.
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_BASE_URL ?? ''),
  },
})
