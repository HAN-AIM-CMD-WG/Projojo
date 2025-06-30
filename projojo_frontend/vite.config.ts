import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: "../", // Look for .env files in the project root directory
  server: {
    watch: {
      usePolling: true,  // Required for file changes to be detected in Docker on Windows
      interval: 250,     // Polling interval in ms - lower is more responsive but uses more CPU
    },
    hmr: {
      clientPort: 5173,  // Ensures HMR works through Docker port mapping
      overlay: true      // Shows an overlay when errors occur
    }
  }
})
