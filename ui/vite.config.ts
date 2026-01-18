import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function serveLibraryDb(): Plugin {
  const sourcePath = path.resolve(__dirname, '../library/papers.db')
  const publicName = 'papers.db'
  return {
    name: 'serve-library-db',
    configureServer(server) {
      server.middlewares.use(`/${publicName}`, (_req: any, res: any, next: any) => {
        if (!fs.existsSync(sourcePath)) return next()
        res.setHeader('Content-Type', 'application/octet-stream')
        fs.createReadStream(sourcePath).pipe(res)
      })
    },
    generateBundle(this) {
      if (!fs.existsSync(sourcePath)) {
        this.warn(`papers.db not found at ${sourcePath}; skipping bundle copy.`)
        return
      }
      const buffer = fs.readFileSync(sourcePath)
      this.emitFile({ type: 'asset', fileName: publicName, source: buffer })
    },
  }
}

function serveLibraryGraph(): Plugin {
  const sourcePath = path.resolve(__dirname, '../library/graph.json')
  const publicName = 'graph.json'
  return {
    name: 'serve-library-graph',
    configureServer(server) {
      server.middlewares.use(`/${publicName}`, (_req: any, res: any, next: any) => {
        if (!fs.existsSync(sourcePath)) return next()
        res.setHeader('Content-Type', 'application/json')
        fs.createReadStream(sourcePath).pipe(res)
      })
    },
    generateBundle(this) {
      if (!fs.existsSync(sourcePath)) {
        this.warn(`graph.json not found at ${sourcePath}; skipping bundle copy.`)
        return
      }
      const buffer = fs.readFileSync(sourcePath)
      this.emitFile({ type: 'asset', fileName: publicName, source: buffer })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveLibraryDb(), serveLibraryGraph()],
  resolve: {
    alias: {
      aframe: path.resolve(__dirname, 'src/shims/aframe.ts'),
      'aframe-extras': path.resolve(__dirname, 'src/shims/aframe-extras.ts'),
      'aframe-extras/src/controls/checkpoint-controls': path.resolve(
        __dirname,
        'src/shims/aframe-extras.ts',
      ),
      'aframe-forcegraph-component': path.resolve(
        __dirname,
        'src/shims/aframe-forcegraph-component.ts',
      ),
    },
  },
})
