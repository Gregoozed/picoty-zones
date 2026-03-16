import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Autoriser l'import de gros fichiers JSON (GeoJSON)
  json: {
    stringify: false,
  },
})
