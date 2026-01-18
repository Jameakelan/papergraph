
import { useState, useCallback, useEffect } from 'react'

export type PaperRow = {
  id: number
  paper_id?: string | null
  project_id?: string | null
  title: string
  abstract?: string | null
  keywords?: string | null
  year?: number | null
  venue?: string | null
  authors?: string | null
  doi?: string | null
  url?: string | null
  tags?: string | null
  relevance?: string | null
  dataset_used?: string | null
  methods?: string | null
  metrics?: string | null
  gap?: string | null
  limitations?: string | null
  future_work?: string | null
  summary?: string | null
  notes?: string | null
  extra?: string | null
  bibtex?: string | null
  file_path?: string | null
  added_at?: string
}


export function usePaperData(projectId?: string) {
  const [papers, setPapers] = useState<PaperRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPapers = useCallback(async (pid?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = pid ? `/api/papers?projectId=${pid}` : '/api/papers'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch papers')
      const data = await response.json()
      setPapers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading papers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPapers(projectId)
  }, [projectId, loadPapers])

  const addPaper = useCallback(async (paper: Omit<PaperRow, 'id'>) => {
    try {
      const res = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paper),
      })
      if (!res.ok) throw new Error('Failed to add paper')
      await loadPapers(projectId)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }, [projectId, loadPapers])

  const updatePaper = useCallback(async (id: number, updates: Partial<PaperRow>) => {
    try {
      const res = await fetch('/api/papers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) throw new Error('Failed to update paper')
      await loadPapers(projectId)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }, [projectId, loadPapers])

  const deletePaper = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this paper?')) return
    try {
      const res = await fetch(`/api/papers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete paper')
      setPapers((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
       console.error(e)
       alert('Failed to delete paper')
    }
  }, [])

  return { papers, loading, error, reload: () => loadPapers(projectId), addPaper, updatePaper, deletePaper }
}
