
import { useState, useEffect, useCallback } from 'react'

export type Node = {
  id: string | number
  title?: string | null
  authors?: string | null
  year?: number | string | null
  tags?: string[] | null
  relevance?: string | null
  [key: string]: any
}

export type Link = {
  source: string | number | Node
  target: string | number | Node
  type?: string | null
  [key: string]: any
}

type GraphPayload = {
  nodes: Node[]
  links: Link[]
}

export function useGraphData(dataUrl: string) {
  const [graph, setGraph] = useState<GraphPayload>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGraph = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to load ${url}`)
      const payload = (await response.json()) as GraphPayload
      setGraph({
        nodes: Array.isArray(payload?.nodes) ? payload.nodes : [],
        links: Array.isArray(payload?.links) ? payload.links : [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGraph(dataUrl)
  }, [dataUrl, loadGraph])

  return { graph, loading, error, reload: () => loadGraph(dataUrl) }
}
