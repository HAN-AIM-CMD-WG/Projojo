// @ts-nocheck
/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import * as path from "path"

// Get port from environment variable, default to 5173 for local development without Docker
const port = parseInt(process.env.FRONTEND_PORT || '5173', 10)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: "../",
  server: {
    port: port,           // Use FRONTEND_PORT env variable (10101 in Docker)
    host: '0.0.0.0',      // Listen on all interfaces (required for Docker)
    watch: {
      usePolling: true,   // Required for file changes to be detected in Docker on Windows
    },
    hmr: {
      clientPort: port,   // HMR also uses the same port for correct WebSocket connection
      overlay: true       // Shows an overlay when errors occur
    }
  },
  preview: {
    port: port,           // Preview mode also uses the same port
    host: '0.0.0.0',
  }
})
