import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function serveLibraryDb(): Plugin {
  const sourcePath = path.resolve(__dirname, '../library/db/papers.db')
  const publicName = 'papers.db'
  return {
    name: 'serve-library-db',
// ... (rest is same, but I'll be safe)
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
  const sourcePath = path.resolve(__dirname, '../library/graph/graph.json')
  const publicName = 'graph.json'
//...
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

import Database from 'better-sqlite3'
import { exec } from 'child_process'

function serveProjectsApi(): Plugin {
  const dbPath = path.resolve(__dirname, '../library/db/papers.db')
  const buildScript = path.resolve(__dirname, '../tools/build_graph.py')
  
  return {
    name: 'serve-projects-api',
    configureServer(server) {
      server.middlewares.use('/api/projects', async (req: any, res: any, next: any) => {
        if (!fs.existsSync(dbPath)) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Database not found' }))
          return
        }

        try {
          const db = new Database(dbPath)

          // GET /api/projects
          if (req.method === 'GET') {
            const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC')
            const projects = stmt.all()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(projects))
            db.close()
            return
          }

          // POST /api/projects
          if (req.method === 'POST') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', () => {
               try {
                 const { id, name, description, created_at } = JSON.parse(body)
                 if (!id || !name) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing id or name' }))
                   return
                 }
                 const stmt = db.prepare('INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)')
                 stmt.run(id, name, description || '', created_at || new Date().toISOString())
                 
                 // Trigger graph build
                 console.log(`Building graph for project: ${id}`)
                 exec(`python3 "${buildScript}" --project-id "${id}"`, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error building graph: ${error.message}`)
                     return
                   }
                   if (stderr) {
                     console.error(`Graph build stderr: ${stderr}`)
                   }
                   console.log(`Graph build stdout: ${stdout}`)
                 })

                 res.statusCode = 201
                 res.end(JSON.stringify({ success: true }))
               } catch (e: any) {
                 res.statusCode = 500
                 res.end(JSON.stringify({ error: e.message }))
               } finally {
                 db.close()
               }
             })
             return
          }

          // DELETE /api/projects?id=... (Using query param for simplicity in middleware)
          if (req.method === 'DELETE') {
             const url = new URL(req.url!, `http://${req.headers.host}`)
             const id = url.searchParams.get('id')
             if (!id) {
               res.statusCode = 400
               res.end(JSON.stringify({ error: 'Missing id param' }))
               db.close()
               return
             }
             const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
             stmt.run(id)

             // Delete graph files
             try {
               const graphDir = path.resolve(__dirname, '../library/graph')
               const jsonPath = path.join(graphDir, `${id}.json`)
               const dotPath = path.join(graphDir, `${id}.dot`)
               
               if (fs.existsSync(jsonPath)) {
                 fs.unlinkSync(jsonPath)
                 console.log(`Deleted graph file: ${jsonPath}`)
               }
               if (fs.existsSync(dotPath)) {
                 fs.unlinkSync(dotPath)
                 console.log(`Deleted dot file: ${dotPath}`)
               }
             } catch (err: any) {
               console.error(`Error deleting graph files: ${err.message}`)
             }

             res.statusCode = 200
             res.end(JSON.stringify({ success: true }))
             db.close()
             return
          }

          db.close()
          next()
        } catch (error: any) {
          console.error('API Error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveLibraryDb(), serveLibraryGraph(), serveProjectsApi()],
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
