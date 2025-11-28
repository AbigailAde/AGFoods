import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    // Increase chunk size warning limit to avoid noisy warnings during build.
    // Default is 500 KB; this increases it to 2000 KB.
    chunkSizeWarningLimit: 2000
  }
})
