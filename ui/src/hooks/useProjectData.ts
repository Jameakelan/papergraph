import { useState, useCallback, useEffect } from 'react'

export type Project = {
  id: string
  name: string
  description?: string
  created_at?: string
}

export function useProjectData() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      console.error("Error loading projects:", err)
      setError(err instanceof Error ? err.message : 'Error loading projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const addProject = useCallback(async (project: Project) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      if (!res.ok) throw new Error('Failed to create project')
      // Optimistic update
      setProjects((prev) => [project, ...prev])
    } catch (err) {
      console.error(err)
      alert("Failed to create project")
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete project')
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error(err)
      alert("Failed to delete project")
    }
  }, [])

  return { projects, loading, error, reload: loadProjects, addProject, deleteProject }
}
