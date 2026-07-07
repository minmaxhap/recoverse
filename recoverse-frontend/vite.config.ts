import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 폰 LAN 테스트용 (같은 Wi-Fi에서 http://<PC-IP>:5173)
    host: true,
    proxy: {
      // 로컬 개발: /api → wrangler dev (recoverse-worker)
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
