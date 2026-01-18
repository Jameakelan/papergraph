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
  const graphDir = path.resolve(__dirname, '../library/graph')
  
  return {
    name: 'serve-library-graph',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        if (!url.pathname.endsWith('.json')) return next()
        
        const fileName = path.basename(url.pathname)
        const filePath = path.join(graphDir, fileName)
        
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/json')
          fs.createReadStream(filePath).pipe(res)
          return
        }
        next()
      })
    },
    generateBundle(this) {
      if (fs.existsSync(graphDir)) {
        const files = fs.readdirSync(graphDir).filter(f => f.endsWith('.json'))
        files.forEach(file => {
           const filePath = path.join(graphDir, file)
           this.emitFile({ type: 'asset', fileName: file, source: fs.readFileSync(filePath) })
        })
      }
    },
  }
}

import Database from 'better-sqlite3'
import { exec } from 'child_process'

function serveProjectsApi(): Plugin {
  const dbPath = path.resolve(__dirname, '../library/db/papers.db')
  const buildScript = path.resolve(__dirname, '../tools/build_graph.py')
  const bibScript = path.resolve(__dirname, '../tools/build_bib.py')
  
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

          // GET /api/projects/bibtex?projectId=...
          if (req.method === 'GET' && req.url.startsWith('/bibtex')) {
            const url = new URL(req.url!, `http://${req.headers.host}`)
            const projectId = url.searchParams.get('projectId')
            if (!projectId) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing projectId' }))
              db.close()
              return
            }
            
            // Try to look up bib_text_path from projects table first
            let bibPath = '';
            try {
              const row = db.prepare('SELECT bib_text_path FROM projects WHERE id = ?').get(projectId) as any;
              if (row && row.bib_text_path) {
                bibPath = row.bib_text_path;
              }
            } catch (e) {
              console.error("Error looking up project:", e);
            }

            if (!bibPath) {
               const bibDir = path.resolve(__dirname, '../library/bibtex')
               bibPath = path.join(bibDir, `${projectId}.bib`)
            }
            
            if (fs.existsSync(bibPath)) {
               const content = fs.readFileSync(bibPath, 'utf-8')
               res.setHeader('Content-Type', 'text/plain')
               res.end(content)
            } else {
               res.statusCode = 404
               res.end(JSON.stringify({ error: `BibTeX file not found at ${bibPath}` }))
            }
            db.close()
            return
          }

          // GET /api/projects (List) - Strict exact match for root or query params only
          if (req.method === 'GET' && (req.url === '/' || req.url === '' || req.url.startsWith('/?'))) {
            const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC')
            const projects = stmt.all()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(projects))
            db.close()
            return
          }

          // POST /api/projects/build
          if (req.method === 'POST' && req.url === '/build') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', () => {
               try {
                 const { projectId } = JSON.parse(body)
                 if (!projectId) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing projectId' }))
                   db.close()
                   return
                 }
                 
                 // Trigger graph build
                 console.log(`Manual build triggered for project: ${projectId}`)
                 exec(`python3 "${buildScript}" --project-id "${projectId}"`, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error building graph: ${error.message}`)
                   } else {
                     if (stderr) console.error(`Graph build stderr: ${stderr}`)
                     console.log(`Graph build stdout: ${stdout}`)
                   }
                 })

                 // Trigger bibtex build
                 exec(`python3 "${bibScript}" --project-id "${projectId}"`, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error building bibtex: ${error.message}`)
                   } else {
                     if (stderr) console.error(`Bibtex build stderr: ${stderr}`)
                     console.log(`Bibtex build stdout: ${stdout}`)
                   }
                 })
                 
                 res.statusCode = 200
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

          // POST /api/projects (Create)
          if (req.method === 'POST' && (req.url === '/' || req.url === '' || req.url === '/?')) {
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
                   } else {
                     if (stderr) console.error(`Graph build stderr: ${stderr}`)
                     console.log(`Graph build stdout: ${stdout}`)
                   }
                 })

                 // Trigger bibtex build
                 console.log(`Building bibtex for project: ${id}`)
                 exec(`python3 "${bibScript}" --project-id "${id}"`, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error building bibtex: ${error.message}`)
                   } else {
                     if (stderr) console.error(`Bibtex build stderr: ${stderr}`)
                     console.log(`Bibtex build stdout: ${stdout}`)
                   }
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
               const bibDir = path.resolve(__dirname, '../library/bibtex')
               const jsonPath = path.join(graphDir, `${id}.json`)
               const dotPath = path.join(graphDir, `${id}.dot`)
               const bibPath = path.join(bibDir, `${id}.bib`)
               
               if (fs.existsSync(jsonPath)) {
                 fs.unlinkSync(jsonPath)
                 console.log(`Deleted graph file: ${jsonPath}`)
               }
               if (fs.existsSync(dotPath)) {
                 fs.unlinkSync(dotPath)
                 console.log(`Deleted dot file: ${dotPath}`)
               }
               if (fs.existsSync(bibPath)) {
                 fs.unlinkSync(bibPath)
                 console.log(`Deleted bib file: ${bibPath}`)
               }
             } catch (err: any) {
               console.error(`Error deleting files: ${err.message}`)
             }

             res.statusCode = 200
             res.end(JSON.stringify({ success: true }))
             db.close()
             return
          }
          



          // POST /api/links (Create Link)
          if (req.method === 'POST' && req.url === '/links') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', () => {
               try {
                 const { source, target, type, note, projectId } = JSON.parse(body)
                 if (!source || !target || !projectId) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing source, target, or projectId' }))
                   return
                 }

                 const linkScript = path.resolve(__dirname, '../tools/build_link.py')
                 // Construct arguments
                 let cmd = `python3 "${linkScript}" --source "${source}" --target "${target}" --type "${type || 'related'}"`
                 if (note) cmd += ` --note "${note.replace(/"/g, '\\"')}"`
                 // We don't strictly need --db if we assume default, but might be good if project differs. 
                 // actually paper_db.py handles the DB path default. 
                 
                 console.log(`Creating link for project ${projectId}: ${cmd}`)
                 
                 exec(cmd, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error building link: ${error.message}`)
                     res.statusCode = 500
                     res.end(JSON.stringify({ error: error.message }))
                   } else {
                     if (stderr) console.error(`Link build stderr: ${stderr}`)
                     console.log(`Link build stdout: ${stdout}`)

                      // Auto-rebuild graph
                      console.log(`Auto-triggering graph build for project: ${projectId}`)
                      exec(`python3 "${buildScript}" --project-id "${projectId}"`, (err, sout, serr) => {
                          if (err) console.error(`Auto-graph build error: ${err.message}`)
                          if (serr) console.error(`Auto-graph build stderr: ${serr}`)
                          console.log(`Auto-graph build stdout: ${sout}`)
                      })

                      // Auto-rebuild BibTeX
                      console.log(`Auto-triggering bibtex build for project: ${projectId}`)
                      exec(`python3 "${bibScript}" --project-id "${projectId}"`, (err, sout, serr) => {
                          if (err) console.error(`Auto-bibtex build error: ${err.message}`)
                          if (serr) console.error(`Auto-bibtex build stderr: ${serr}`)
                          console.log(`Auto-bibtex build stdout: ${sout}`)
                      })

                      res.statusCode = 201
                     res.end(JSON.stringify({ success: true }))
                   }
                 })
               } catch (e: any) {
                 res.statusCode = 500
                 res.end(JSON.stringify({ error: e.message }))
               } finally {
                 // db.close() // database is not actually used in this block, but if we opened it above we should close.
                 // In this function structure, db IS opened above. Check indentation level.
                 // This block is inside 'try { const db = ...' so we SHOULD close db.
                 db.close()
               }
             })
             return
          }


          // POST /api/projects/auto-links (Auto-discover Links)
          if (req.method === 'POST' && req.url === '/auto-links') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', () => {
               try {
                 const { projectId } = JSON.parse(body)
                 if (!projectId) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing projectId' }))
                   db.close()
                   return
                 }

                 const autoLinkScript = path.resolve(__dirname, '../tools/auto_build_links.py')
                 const cmd = `python3 "${autoLinkScript}" --project-id "${projectId}"`
                 
                 console.log(`Auto-discovering links for project: ${projectId}`)
                 
                 exec(cmd, (error, stdout, stderr) => {
                   if (error) {
                     console.error(`Error auto-discovering links: ${error.message}`)
                     res.statusCode = 500
                     res.end(JSON.stringify({ error: error.message }))
                   } else {
                     if (stderr) console.error(`Auto-link stderr: ${stderr}`)
                     console.log(`Auto-link stdout: ${stdout}`)

                     // Auto-rebuild graph
                     console.log(`Auto-triggering graph build for project: ${projectId}`)
                     exec(`python3 "${buildScript}" --project-id "${projectId}"`, (err, sout, serr) => {
                         if (err) console.error(`Auto-graph build error: ${err.message}`)
                         if (serr) console.error(`Auto-graph build stderr: ${serr}`)
                         console.log(`Auto-graph build stdout: ${sout}`)
                     })

                     // Auto-rebuild BibTeX
                     console.log(`Auto-triggering bibtex build for project: ${projectId}`)
                     exec(`python3 "${bibScript}" --project-id "${projectId}"`, (err, sout, serr) => {
                         if (err) console.error(`Auto-bibtex build error: ${err.message}`)
                         if (serr) console.error(`Auto-bibtex build stderr: ${serr}`)
                         console.log(`Auto-bibtex build stdout: ${sout}`)
                     })

                     res.statusCode = 200
                     res.end(JSON.stringify({ success: true }))
                   }
                 })
               } catch (e: any) {
                 res.statusCode = 500
                 res.end(JSON.stringify({ error: e.message }))
               } finally {
                 db.close()
               }
             })
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
// ... projects api code ...
    }
  }
}

function servePapersApi(): Plugin {
  const dbPath = path.resolve(__dirname, '../library/db/papers.db')

  return {
    name: 'serve-papers-api',
    configureServer(server) {
      server.middlewares.use('/api/papers', async (req: any, res: any, next: any) => {
        if (!fs.existsSync(dbPath)) {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Database not found' }))
          return
        }

        try {
          const db = new Database(dbPath)

          // GET /api/papers?projectId=...
          if (req.method === 'GET') {
            const url = new URL(req.url!, `http://${req.headers.host}`)
            const projectId = url.searchParams.get('projectId')
            
            let query = 'SELECT * FROM papers'
            const params: any[] = []
            
            if (projectId) {
              query += ' WHERE project_id = ?'
              params.push(projectId)
            }
            
            query += ' ORDER BY added_at DESC'
            
            const stmt = db.prepare(query)
            const papers = stmt.all(...params)
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(papers))
            db.close()
            return
          }


          // POST /api/papers (Create)
          if (req.method === 'POST') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', async () => {
               try {
                 const data = JSON.parse(body)
                 let { title, project_id, bibtex } = data
                 
                 // If bibtex is provided, try to parse it to fill missing fields
                 if (bibtex && bibtex.trim()) {
                   try {
                     // Simple regex extraction for core fields if missing
                     // Using [\s\S] to match across newlines
                     if (!data.title) {
                        const titleMatch = bibtex.match(/title\s*=\s*[{"]([\s\S]+?)[}"]/i);
                        if (titleMatch) data.title = titleMatch[1].replace(/\s+/g, ' ').trim();
                     }
                     
                     if (!data.year) {
                        const yearMatch = bibtex.match(/year\s*=\s*[{"](\d+)[}"]/i);
                        if (yearMatch) data.year = parseInt(yearMatch[1]);
                     }
                     
                     if (!data.authors) {
                        const authorMatch = bibtex.match(/author\s*=\s*[{"]([\s\S]+?)[}"]/i);
                        if (authorMatch) data.authors = authorMatch[1].replace(/\s+/g, ' ').trim();
                     }
                     
                     if (!data.venue) {
                        const venueMatch = bibtex.match(/(?:journal|booktitle)\s*=\s*[{"]([\s\S]+?)[}"]/i);
                        if (venueMatch) data.venue = venueMatch[1].replace(/\s+/g, ' ').trim();
                     }

                     if (!data.doi) {
                        const doiMatch = bibtex.match(/doi\s*=\s*[{"]([\s\S]+?)[}"]/i);
                        if (doiMatch) data.doi = doiMatch[1].trim();
                     }
                     
                     // Append to bibtex file
                     if (project_id) {
                        const bibDir = path.resolve(__dirname, '../library/bibtex')
                        if (!fs.existsSync(bibDir)) fs.mkdirSync(bibDir, { recursive: true });
                        const bibPath = path.join(bibDir, `${project_id}.bib`)
                        // Append with newline
                        fs.appendFileSync(bibPath, `\n${bibtex.trim()}\n`)
                     }
                   } catch (err) {
                     console.error("Error parsing/saving bibtex:", err)
                   }
                 }
                                  // Normalize fields to lowercase as requested
                  if (data.authors && typeof data.authors === 'string') data.authors = data.authors.toLowerCase();
                  if (data.tags) {
                     if (typeof data.tags === 'string') data.tags = data.tags.toLowerCase();
                     else if (Array.isArray(data.tags)) data.tags = data.tags.map((t: any) => String(t).toLowerCase());
                  }
                  if (data.keywords) {
                     if (typeof data.keywords === 'string') data.keywords = data.keywords.toLowerCase();
                     else if (Array.isArray(data.keywords)) data.keywords = data.keywords.map((k: any) => String(k).toLowerCase());
                  }

                  // Update local title variable from data object (which might have been updated above)
                  title = data.title;

                 if (!title) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing title (could not extract from BibTeX)' }))
                   return
                 }

                 const keys = [
                   'paper_id', 'project_id', 'title', 'abstract', 'keywords', 'year', 'venue', 'authors', 
                   'doi', 'url', 'tags', 'relevance', 'dataset_used', 'methods', 'metrics', 'gap', 
                   'limitations', 'future_work', 'summary', 'notes', 'extra', 'bibtex', 'file_path', 'added_at'
                 ]
                 
                 const validData: any = {}
                 keys.forEach(k => {
                    if (data[k] !== undefined) validData[k] = data[k]
                 })
                 
                 if (!validData.added_at) validData.added_at = new Date().toISOString()
                 if (!validData.project_id && project_id) validData.project_id = project_id;

                 const cols = Object.keys(validData).join(', ')
                 const placeholders = Object.keys(validData).map(() => '?').join(', ')
                 const values = Object.values(validData)

                 const stmt = db.prepare(`INSERT INTO papers (${cols}) VALUES (${placeholders})`)
                 const info = stmt.run(...values)
                 
                 res.statusCode = 201
                 res.end(JSON.stringify({ success: true, id: info.lastInsertRowid }))
               } catch (e: any) {
                 console.error(e);
                 res.statusCode = 500
                 res.end(JSON.stringify({ error: e.message }))
               } finally {
                 db.close()
               }
             })
             return
          }
          
          // PUT /api/papers (Update)
          if (req.method === 'PUT') {
             let body = ''
             req.on('data', (chunk: any) => { body += chunk })
             req.on('end', () => {
               try {
                 const data = JSON.parse(body)
                 const { id, ...updates } = data
                 if (!id) {
                   res.statusCode = 400
                   res.end(JSON.stringify({ error: 'Missing id' }))
                   return
                 }

                 if (Object.keys(updates).length === 0) {
                    res.statusCode = 200
                    res.end(JSON.stringify({ success: true }))
                    return
                 }
                                  // Normalize fields to lowercase as requested
                  if (updates.authors && typeof updates.authors === 'string') updates.authors = updates.authors.toLowerCase();
                  if (updates.tags) {
                     if (typeof updates.tags === 'string') updates.tags = updates.tags.toLowerCase();
                     else if (Array.isArray(updates.tags)) updates.tags = updates.tags.map((t: any) => String(t).toLowerCase());
                  }
                  if (updates.keywords) {
                     if (typeof updates.keywords === 'string') updates.keywords = updates.keywords.toLowerCase();
                     else if (Array.isArray(updates.keywords)) updates.keywords = updates.keywords.map((k: any) => String(k).toLowerCase());
                  }

                  // Filter updates to allowed columns only to avoid errors
                 const allowed = [
                   'paper_id', 'project_id', 'title', 'abstract', 'keywords', 'year', 'venue', 'authors', 
                   'doi', 'url', 'tags', 'relevance', 'dataset_used', 'methods', 'metrics', 'gap', 
                   'limitations', 'future_work', 'summary', 'notes', 'extra', 'bibtex', 'file_path'
                 ];
                 const validUpdates: any = {};
                 Object.keys(updates).forEach(k => {
                   if (allowed.includes(k)) validUpdates[k] = updates[k];
                 });
                 
                 if (Object.keys(validUpdates).length === 0) {
                    res.statusCode = 200
                    res.end(JSON.stringify({ success: true }))
                    return
                 }

                 const cols = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ')
                 const values = Object.values(validUpdates)

                 const stmt = db.prepare(`UPDATE papers SET ${cols} WHERE id = ?`)
                 stmt.run(...values, id)
                 
                 res.statusCode = 200
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

          // DELETE /api/papers?id=...
          if (req.method === 'DELETE') {
             const url = new URL(req.url!, `http://${req.headers.host}`)
             const id = url.searchParams.get('id')
             if (!id) {
               res.statusCode = 400
               res.end(JSON.stringify({ error: 'Missing id param' }))
               db.close()
               return
             }
             const stmt = db.prepare('DELETE FROM papers WHERE id = ?')
             stmt.run(id)

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
  plugins: [react(), serveLibraryDb(), serveLibraryGraph(), serveProjectsApi(), servePapersApi()],
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
