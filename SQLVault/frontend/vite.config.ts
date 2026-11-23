import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && typeof (res as any).writeHead === 'function' && !(res as any).headersSent) {
              ;(res as any).writeHead(503, { 'Content-Type': 'application/json' })
              ;(res as any).end(JSON.stringify({ offline: true, message: 'Backend on port 5000 is not running.' }))
            }
          })
        },
      },
    },
  },
})
