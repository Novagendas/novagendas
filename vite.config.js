import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Redirigir todas las rutas al index.html (SPA routing)
    historyApiFallback: true,
  },
})
