import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/icons/itshover': path.resolve(__dirname, 'src/icons/itshover/index.jsx'),
      'lucide-react': path.resolve(__dirname, 'src/icons/itshover/index.jsx'),
    },
  },
})
