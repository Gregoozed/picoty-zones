import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'preprod' ? '/zone-picoty/' : '/',
  json: {
    stringify: false,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))
