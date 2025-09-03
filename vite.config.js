import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    host: '0.0.0.0', // Permet l'accès depuis d'autres appareils
    port: 5173, // Port par défaut
    strictPort: true, // Utilise strictement ce port
    open: false // N'ouvre pas automatiquement le navigateur
  }
})
