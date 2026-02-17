import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    allowedHosts: ['.loca.lt', '.trycloudflare.com', 'ysj0710.xyz', 'api.ysj0710.xyz'],
    proxy: {
      '/api': {
        target: 'https://api.ysj0710.xyz',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
