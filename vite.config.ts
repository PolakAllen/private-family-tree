import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // TODO: try changing this once Github seems to be behaving better
  base: 'docs/',
  plugins: [react()],
  build: {
    outDir: 'docs/'
  }
})
