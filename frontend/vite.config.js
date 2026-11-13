import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// En desarrollo, /api se redirige al backend (puerto 3000 por defecto).
export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
})
