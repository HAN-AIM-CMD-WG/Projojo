import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    watch: {
      usePolling: true,  // Required for file changes to be detected in Docker on Windows
      interval: 250,     // Polling interval in ms - lower is more responsive but uses more CPU
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']  // Explicitly ignore directories that don't need watching
    },
    hmr: {
      clientPort: 5173  // Ensures HMR works through Docker port mapping
    }
    // Note: host is set via CLI in Dockerfile: --host 0.0.0.0
  }
})