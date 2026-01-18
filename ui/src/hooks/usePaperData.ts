
import { useState, useCallback, useEffect } from 'react'
import initSqlJs from 'sql.js'
import type { SqlJsStatic } from 'sql.js'

export type PaperRow = {
  id: number
  paper_id?: string | null
  title: string
  authors?: string | null
  year?: number | null
  venue?: string | null
  doi?: string | null
  tags?: string | null
  relevance?: string | null
  dataset_used?: string | null
  methods?: string | null
}

let sqlInstance: SqlJsStatic | null = null

async function getSql() {
  if (!sqlInstance) {
    sqlInstance = await initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
    })
  }
  return sqlInstance
}

export function usePaperData(dbPath: string) {
  const [papers, setPapers] = useState<PaperRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPapers = useCallback(async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const SQL = await getSql()
      const response = await fetch(path)
      if (!response.ok) throw new Error(`Failed to fetch DB: ${path}`)
      const buffer = await response.arrayBuffer()
      const db = new SQL.Database(new Uint8Array(buffer))
      
      const result = db.exec(`
        SELECT id, paper_id, title, authors, year, venue, doi, tags, relevance, dataset_used, methods
        FROM papers
        ORDER BY added_at DESC, id DESC
      `)
      
      if (result.length > 0) {
        const columns = result[0].columns
        const values = result[0].values
        const rows = values.map((row) => {
          const obj: any = {}
          columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj as PaperRow
        })
        setPapers(rows)
      } else {
        setPapers([])
      }
      db.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading SQLite DB')
      setPapers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPapers(dbPath)
  }, [dbPath, loadPapers])

  const deletePaper = useCallback((id: number) => {
    setPapers((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { papers, loading, error, reload: () => loadPapers(dbPath), deletePaper }
}
