import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_PAGES === 'true' && repoName ? `/${repoName}/` : '/'
const cesiumSource = resolve('node_modules/cesium/Build/Cesium')
const cesiumBaseUrl = `${base}cesium/`

export default defineConfig({
  base,
  plugins: [vue(), cesiumStaticAssets()],
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl)
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  }
})

function cesiumStaticAssets() {
  let outDir = 'dist'

  return {
    name: 'copy-cesium-static-assets',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = decodeURIComponent(request.url?.split('?')[0] ?? '')
        const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
        const cesiumPrefix = `${normalizedBase}/cesium/`

        if (!requestUrl.startsWith(cesiumPrefix)) {
          next()
          return
        }

        const relativePath = requestUrl.slice(cesiumPrefix.length)
        const filePath = join(cesiumSource, relativePath)

        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          next()
          return
        }

        response.setHeader('Content-Type', contentType(filePath))
        response.end(readFileSync(filePath))
      })
    },
    writeBundle() {
      const target = join(outDir, 'cesium')
      mkdirSync(dirname(target), { recursive: true })

      if (existsSync(target)) {
        cpSync(cesiumSource, target, { recursive: true, force: true })
      } else {
        mkdirSync(target, { recursive: true })
        cpSync(cesiumSource, target, { recursive: true, force: true })
      }
    }
  }
}

function contentType(filePath) {
  const types = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.html': 'text/html',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  }

  return types[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}
