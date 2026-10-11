import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: 'private-family-tree/',
  // Note: base must start with repository name when hosting on github pages
  plugins: [react()],
  build: {
    // TODO: try changing basepath once Github seems to be behaving better
    //  likely a cache / sync issue preventing different folders?
    //  unclear, as I didn't even have a docs folder originally
    outDir: 'docs/'
  }
})
