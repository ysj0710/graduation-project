import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    allowedHosts: ['.loca.lt', '.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'https://flu-admission-incidents-prizes.trycloudflare.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
