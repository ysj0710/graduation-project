import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    allowedHosts: ['.loca.lt'],
    proxy: {
      '/api': {
        target: 'https://curvy-games-kneel.loca.lt',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
