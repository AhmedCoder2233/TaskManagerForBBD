import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    host: true,              // 🔥 MOST IMPORTANT
    allowedHosts: 'all',
    port: 5173,
    strictPort: true
  }
})
