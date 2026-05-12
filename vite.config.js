import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_PAGES === 'true' && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [vue()],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`${base}cesium`)
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  }
})
