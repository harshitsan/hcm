import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // allowedHosts: true → demoable through tunnels (ngrok etc.)
  server: { port: 5174, allowedHosts: true },
})
