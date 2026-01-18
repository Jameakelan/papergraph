import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import initSqlJs from 'sql.js'
import type { SqlJsStatic } from 'sql.js'
import './App.css'

type PaperNode = {
  id: string | number
  paper_id?: string | null
  title?: string | null
  abstract?: string | null
  keywords?: string[] | null
  year?: number | string | null
  venue?: string | null
  authors?: string | null
  doi?: string | null
  url?: string | null
  tags?: string[] | null
  relevance?: string | null
  dataset_used?: string | null
  methods?: string | null
  metrics?: string | null
  limitations?: string | null
  future_work?: string | null
  summary?: string | null
  extra?: string | null
  file_path?: string | null
  x?: number
  y?: number
  vx?: number
  vy?: number
}

type PaperLink = {
  source: string | number | PaperNode
  target: string | number | PaperNode
  type?: string | null
  note?: string | null
}

type GraphPayload = {
  nodes: PaperNode[]
  links: PaperLink[]
}

type Dimensions = {
  width: number
  height: number
}

type GraphHandle = {
  zoomToFit: (duration?: number, padding?: number) => void
  centerAt: (x?: number, y?: number, durationMs?: number) => void
}

type PaperRow = {
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

const DEFAULT_GRAPH_URL = '/graph.json'
const DEFAULT_DB_PATH = '/papers.db'
const relevanceColors: Record<string, string> = {
  high: '#2563eb',
  medium: '#0ea5e9',
  low: '#6b7280',
}

function normalizeId(value: string | number | PaperNode) {
  if (typeof value === 'object') {
    return value.id
  }
  return value
}

function parseTags(value: string | null | undefined) {
  if (!value) return []
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function App() {
  const [dataUrl, setDataUrl] = useState(DEFAULT_GRAPH_URL)
  const [urlInput, setUrlInput] = useState(DEFAULT_GRAPH_URL)
  const [graph, setGraph] = useState<GraphPayload>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [relationFilter, setRelationFilter] = useState('')
  const [relevanceFilter, setRelevanceFilter] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [hideIsolated, setHideIsolated] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [status, setStatus] = useState('')
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 1200, height: 700 })
  const [highlightKeyNodes, setHighlightKeyNodes] = useState(true)
  const [highlightRecommendations, setHighlightRecommendations] = useState(true)

  const [paperPath, setPaperPath] = useState(DEFAULT_DB_PATH)
  const [paperPathInput, setPaperPathInput] = useState(DEFAULT_DB_PATH)
  const [paperLoading, setPaperLoading] = useState(true)
  const [paperError, setPaperError] = useState<string | null>(null)
  const [paperStatus, setPaperStatus] = useState('')
  const [paperSearch, setPaperSearch] = useState('')
  const [papers, setPapers] = useState<PaperRow[]>([])

  const graphRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sqlRef = useRef<SqlJsStatic | null>(null)

  const ensureSqlInstance = useCallback(async () => {
    if (!sqlRef.current) {
      sqlRef.current = await initSqlJs({
        locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
      })
    }
    return sqlRef.current
  }, [])

  const loadGraph = useCallback(
    async (url: string) => {
      setLoading(true)
      setError(null)
      setStatus('Loading graph data...')
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load ${url} (${response.status})`)
        }
        const payload = (await response.json()) as GraphPayload
        const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
        const links = Array.isArray(payload?.links) ? payload.links : []
        setGraph({ nodes, links })
        setSelectedId(nodes.length ? nodes[0].id : null)
        setStatus(`Loaded ${nodes.length} nodes and ${links.length} links`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load graph data')
        setStatus('')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const loadPapers = useCallback(
    async (path: string) => {
      setPaperLoading(true)
      setPaperError(null)
      setPaperStatus('Loading papers...')
      try {
        const SQL = await ensureSqlInstance()
        const response = await fetch(path)
        if (!response.ok) {
          throw new Error(`Failed to load ${path} (${response.status})`)
        }
        const buffer = await response.arrayBuffer()
        const db = new SQL.Database(new Uint8Array(buffer))
        const stmt = db.prepare(
          `SELECT id, paper_id, title, authors, year, venue, doi, tags, relevance, dataset_used, methods
           FROM papers
           ORDER BY added_at DESC, id DESC`
            .replace(/\s+/g, ' ')
            .trim(),
        )
        const rows: PaperRow[] = []
        while (stmt.step()) {
          const row = stmt.getAsObject()
          rows.push({
            id: Number(row.id),
            paper_id: (row.paper_id as string) ?? null,
            title: (row.title as string) ?? 'Untitled',
            authors: (row.authors as string | null) ?? null,
            year: (row.year as number | null) ?? null,
            venue: (row.venue as string | null) ?? null,
            doi: (row.doi as string | null) ?? null,
            tags: (row.tags as string | null) ?? null,
            relevance: (row.relevance as string | null) ?? null,
            dataset_used: (row.dataset_used as string | null) ?? null,
            methods: (row.methods as string | null) ?? null,
          })
        }
        stmt.free()
        db.close()
        setPapers(rows)
        setPaperStatus(`Loaded ${rows.length} papers`)
        setSelectedId((prev) => prev ?? (rows[0]?.id ?? null))
      } catch (err) {
        setPaperError(err instanceof Error ? err.message : 'Unable to load papers')
        setPaperStatus('')
        setPapers([])
      } finally {
        setPaperLoading(false)
      }
    },
    [ensureSqlInstance],
  )

  useEffect(() => {
    loadGraph(dataUrl)
  }, [dataUrl, loadGraph])

  useEffect(() => {
    loadPapers(paperPath)
  }, [paperPath, loadPapers])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      const { width, height } = entry.contentRect
      setDimensions({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const tagOptions = useMemo(() => {
    const tags = new Set<string>()
    graph.nodes.forEach((node) => node.tags?.forEach((tag) => tags.add(tag)))
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [graph.nodes])

  const relationOptions = useMemo(() => {
    const relations = new Set<string>()
    graph.links.forEach((link) => {
      if (link.type) {
        relations.add(link.type)
      }
    })
    return Array.from(relations).sort((a, b) => a.localeCompare(b))
  }, [graph.links])

  const relevanceOptions = useMemo(() => {
    const values = new Set<string>()
    graph.nodes.forEach((node) => {
      if (node.relevance) {
        values.add(node.relevance)
      }
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [graph.nodes])

  const filteredGraph = useMemo(() => {
    const text = query.trim().toLowerCase()
    const min = minYear ? parseInt(minYear, 10) : undefined
    const max = maxYear ? parseInt(maxYear, 10) : undefined
    const tag = tagFilter.toLowerCase()
    const rel = relationFilter.toLowerCase()
    const relevance = relevanceFilter.toLowerCase()

    const nodes = graph.nodes.filter((node) => {
      const textFields = [
        node.title,
        node.authors,
        node.abstract,
        node.venue,
        node.dataset_used,
        node.methods,
        node.metrics,
        node.tags?.join(' '),
        node.keywords?.join(' '),
      ]
      const matchesQuery = !text || textFields.some((field) => field?.toLowerCase().includes(text))
      const matchesTag =
        !tag || (node.tags ?? []).some((nodeTag) => nodeTag.toLowerCase() === tag)
      const matchesRelevance =
        !relevance || (node.relevance ?? '').toLowerCase() === relevance
      const yearValue =
        typeof node.year === 'string' ? parseInt(node.year, 10) : node.year
      const matchesMin = !min || (yearValue ?? min) >= min
      const matchesMax = !max || (yearValue ?? max) <= max
      return matchesQuery && matchesTag && matchesRelevance && matchesMin && matchesMax
    })

    const nodeIds = new Set(nodes.map((node) => node.id))
    const links = graph.links.filter((link) => {
      const typeMatch = !rel || (link.type ?? '').toLowerCase() === rel
      const sourceId = normalizeId(link.source)
      const targetId = normalizeId(link.target)
      const inFiltered = nodeIds.has(sourceId) && nodeIds.has(targetId)
      return inFiltered && typeMatch
    })

    const connected = new Set<PaperNode['id']>()
    links.forEach((link) => {
      connected.add(normalizeId(link.source) as PaperNode['id'])
      connected.add(normalizeId(link.target) as PaperNode['id'])
    })

    const finalNodes = hideIsolated ? nodes.filter((node) => connected.has(node.id)) : nodes

    return { nodes: finalNodes, links }
  }, [
    graph.nodes,
    graph.links,
    query,
    tagFilter,
    relationFilter,
    relevanceFilter,
    minYear,
    maxYear,
    hideIsolated,
  ])

  const degreeMap = useMemo(() => {
    const map = new Map<PaperNode['id'], number>()
    graph.links.forEach((link) => {
      const sourceId = normalizeId(link.source) as PaperNode['id']
      const targetId = normalizeId(link.target) as PaperNode['id']
      map.set(sourceId, (map.get(sourceId) ?? 0) + 1)
      map.set(targetId, (map.get(targetId) ?? 0) + 1)
    })
    return map
  }, [graph.links])

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    graph.nodes.forEach((node) => {
      node.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [graph.nodes])

  const tagDiversity = useMemo(() => {
    const set = new Set<string>()
    graph.nodes.forEach((node) => node.tags?.forEach((tag) => set.add(tag)))
    return set.size
  }, [graph.nodes])

  const relationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    graph.links.forEach((link) => {
      if (link.type) counts.set(link.type, (counts.get(link.type) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [graph.links])

  const relationDiversity = useMemo(() => {
    const set = new Set<string>()
    graph.links.forEach((link) => link.type && set.add(link.type))
    return set.size
  }, [graph.links])

  const yearCounts = useMemo(() => {
    const counts = new Map<string, number>()
    graph.nodes.forEach((node) => {
      if (node.year) {
        const key = String(node.year)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    })
    return Array.from(counts.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .slice(0, 6)
  }, [graph.nodes])

  const keyNodes = useMemo(() => {
    return [...graph.nodes]
      .map((node) => ({ ...node, degree: degreeMap.get(node.id) ?? 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5)
  }, [graph.nodes, degreeMap])

  const keyNodeIds = useMemo(() => new Set(keyNodes.map((node) => node.id)), [keyNodes])

  const averageDegree = useMemo(() => {
    if (!graph.nodes.length) return 0
    return Number(((graph.links.length * 2) / graph.nodes.length).toFixed(1))
  }, [graph.links.length, graph.nodes.length])

  const filteredPapers = useMemo(() => {
    const text = paperSearch.trim().toLowerCase()
    if (!text) return papers
    return papers.filter((paper) => {
      const fields = [
        paper.title,
        paper.paper_id ?? '',
        paper.authors ?? '',
        paper.venue ?? '',
        paper.methods ?? '',
        paper.dataset_used ?? '',
        paper.tags ?? '',
        paper.relevance ?? '',
        paper.doi ?? '',
      ]
      return fields.some((field) => field.toLowerCase().includes(text))
    })
  }, [paperSearch, papers])

  useEffect(() => {
    if (!selectedId) {
      return
    }
    const stillVisible = filteredGraph.nodes.some((node) => node.id === selectedId)
    if (!stillVisible) {
      setSelectedId(null)
    }
  }, [filteredGraph.nodes, selectedId])

  useEffect(() => {
    const handle = graphRef.current as GraphHandle | null
    if (!handle || !filteredGraph.nodes.length) {
      return
    }
    const timeout = setTimeout(() => {
      handle.zoomToFit(400, 50)
    }, 150)
    return () => clearTimeout(timeout)
  }, [filteredGraph.nodes.length, filteredGraph.links.length])

  const selectedNode = useMemo(
    () => filteredGraph.nodes.find((node) => node.id === selectedId) ?? null,
    [filteredGraph.nodes, selectedId],
  )

  const neighbors = useMemo(() => {
    if (!selectedId) {
      return []
    }
    const neighborIds = new Set<PaperNode['id']>()
    filteredGraph.links.forEach((link) => {
      const sourceId = normalizeId(link.source)
      const targetId = normalizeId(link.target)
      if (sourceId === selectedId) {
        neighborIds.add(targetId as PaperNode['id'])
      }
      if (targetId === selectedId) {
        neighborIds.add(sourceId as PaperNode['id'])
      }
    })
    return filteredGraph.nodes.filter((node) => neighborIds.has(node.id))
  }, [filteredGraph.links, filteredGraph.nodes, selectedId])

  const recommended = useMemo(() => {
    if (!selectedId || !selectedNode) {
      return []
    }
    const neighborIds = new Set<PaperNode['id']>()
    filteredGraph.links.forEach((link) => {
      neighborIds.add(normalizeId(link.source) as PaperNode['id'])
      neighborIds.add(normalizeId(link.target) as PaperNode['id'])
    })
    const selectedTags = new Set(selectedNode.tags ?? [])
    const selectedKeywords = new Set(selectedNode.keywords ?? [])

    const candidates = filteredGraph.nodes.filter((node) => node.id !== selectedId)
    const scored = candidates
      .map((node) => {
        const tags = node.tags ?? []
        const keywords = node.keywords ?? []
        const tagOverlap = tags.filter((tag) => selectedTags.has(tag)).length
        const keywordOverlap = keywords.filter((kw) => selectedKeywords.has(kw)).length
        const venueBoost = selectedNode.venue && node.venue && selectedNode.venue === node.venue ? 1 : 0
        const relevanceBoost =
          selectedNode.relevance && node.relevance && selectedNode.relevance === node.relevance ? 0.5 : 0
        const linkBoost = neighborIds.has(node.id) ? 1.5 : 0
        const score = tagOverlap * 2 + keywordOverlap + venueBoost + relevanceBoost + linkBoost
        if (score <= 0) return null
        const reasons = [] as string[]
        if (tagOverlap) reasons.push(`${tagOverlap} shared tag${tagOverlap > 1 ? 's' : ''}`)
        if (keywordOverlap) reasons.push(`${keywordOverlap} shared keyword${keywordOverlap > 1 ? 's' : ''}`)
        if (venueBoost) reasons.push('same venue')
        if (linkBoost) reasons.push('already linked')
        if (relevanceBoost) reasons.push('similar relevance')
        return { node, score, reasons }
      })
      .filter(Boolean) as { node: PaperNode; score: number; reasons: string[] }[]

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => ({ ...item, reason: item.reasons.join(' · ') }))
  }, [filteredGraph.links, filteredGraph.nodes, selectedId, selectedNode])

  const recommendedIds = useMemo(
    () => new Set(recommended.map((item) => item.node.id)),
    [recommended],
  )

  const relationColors = useMemo(() => {
    const map = new Map<string, string>()
    const palette = ['#8b5cf6', '#22c55e', '#f97316', '#0ea5e9', '#e11d48', '#14b8a6']
    let index = 0
    relationOptions.forEach((relation) => {
      const color = palette[index % palette.length]
      map.set(relation, color)
      index += 1
    })
    return map
  }, [relationOptions])

  const nodeColor = (node: PaperNode) => {
    if (selectedId === node.id) {
      return '#f97316'
    }
    const relevance = node.relevance ? node.relevance.toLowerCase() : ''
    return relevanceColors[relevance] ?? '#6366f1'
  }

  const linkColor = (link: PaperLink) => {
    if (!link.type) {
      return '#cbd5e1'
    }
    return relationColors.get(link.type) ?? '#cbd5e1'
  }

  const handleReload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDataUrl(urlInput)
  }

  const handlePaperReload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPaperPath(paperPathInput)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Paper relationship explorer</p>
          <h1>Paper Graph Viewer</h1>
          <p className="lede">
            Load the exported <code>graph.json</code> to explore relationships between works,
            filter by tags, year, or relevance, and inspect each node.
          </p>
          <form className="data-form" onSubmit={handleReload}>
            <label className="field">
              <span>Graph JSON path</span>
              <div className="field-row">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="/graph.json"
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Loading...' : 'Reload'}
                </button>
              </div>
            </label>
            {error && <p className="error-text">{error}</p>}
            {!error && status && <p className="status-text">{status}</p>}
          </form>
        </div>
        <div className="pill-stats">
          <div className="pill">
            <strong>{graph.nodes.length}</strong>
            <span>nodes</span>
          </div>
          <div className="pill">
            <strong>{graph.links.length}</strong>
            <span>links</span>
          </div>
          <div className="pill accent">
            <strong>{filteredGraph.nodes.length}</strong>
            <span>visible</span>
          </div>
        </div>
      </header>

      <section className="panel paper-panel">
        <div className="panel-header">
          <div>
            <h2>Papers from SQLite</h2>
            <p className="subtle">
              Reads directly from <code>papers.db</code> using sql.js. Copy your DB next to the build or
              adjust the path below.
            </p>
          </div>
          <div className="paper-actions">
            <form className="field" onSubmit={handlePaperReload}>
              <span>Database path</span>
              <div className="field-row">
                <input
                  type="text"
                  value={paperPathInput}
                  onChange={(event) => setPaperPathInput(event.target.value)}
                  placeholder="/papers.db"
                />
                <button type="submit" disabled={paperLoading}>
                  {paperLoading ? 'Loading...' : 'Reload'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="paper-top-row">
          <label className="field">
            <span>Search papers</span>
            <input
              type="search"
              placeholder="title, author, venue, tag, doi..."
              value={paperSearch}
              onChange={(event) => setPaperSearch(event.target.value)}
            />
          </label>
          <div className="pill-stats">
            <div className="pill">
              <strong>{papers.length}</strong>
              <span>total</span>
            </div>
            <div className="pill accent">
              <strong>{filteredPapers.length}</strong>
              <span>shown</span>
            </div>
          </div>
        </div>
        {paperError && <p className="error-text">{paperError}</p>}
        {!paperError && paperStatus && <p className="status-text">{paperStatus}</p>}
        <div className="table-wrap">
          {paperLoading ? (
            <div className="placeholder small">Loading papers...</div>
          ) : !filteredPapers.length ? (
            <div className="placeholder small">No papers matched your filters.</div>
          ) : (
            <table className="paper-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Year</th>
                  <th>Venue</th>
                  <th>Tags</th>
                  <th>Relevance</th>
                  <th>Methods</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr key={paper.id}>
                    <td>{paper.id}</td>
                    <td>
                      <div className="title-cell">{paper.title || 'Untitled paper'}</div>
                      <div className="muted small-text">
                        {[paper.paper_id, paper.doi].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>{paper.authors || '—'}</td>
                    <td>{paper.year || '—'}</td>
                    <td>{paper.venue || '—'}</td>
                    <td>
                      <div className="chip-row">
                        {parseTags(paper.tags).length ? (
                          parseTags(paper.tags).map((tag) => (
                            <span className="chip" key={`${paper.id}-${tag}`}>
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </div>
                    </td>
                    <td>{paper.relevance || '—'}</td>
                    <td>{paper.methods || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="panel insights-panel">
        <div className="panel-header">
          <h2>Smart insights</h2>
          <p className="subtle">
            Quick stats plus auto-highlighting of high-value and suggested nodes.
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <p className="muted small-text">Distinct tags</p>
            <strong>{tagDiversity}</strong>
          </div>
          <div className="stat-card">
            <p className="muted small-text">Relation types</p>
            <strong>{relationDiversity}</strong>
          </div>
          <div className="stat-card">
            <p className="muted small-text">Avg degree</p>
            <strong>{averageDegree}</strong>
          </div>
          <div className="stat-card">
            <p className="muted small-text">Latest year</p>
            <strong>{yearCounts[0]?.[0] ?? '—'}</strong>
            <span className="muted small-text">{yearCounts[0]?.[1] ?? 0} works</span>
          </div>
        </div>
        <div className="insight-grid">
          <div className="block tight">
            <h4>Top tags</h4>
            <div className="pill-list">
              {tagCounts.length ? (
                tagCounts.map(([tag, count]) => (
                  <span className="chip" key={`tag-${tag}`}>
                    {tag} <span className="muted">({count})</span>
                  </span>
                ))
              ) : (
                <p className="muted">No tags yet.</p>
              )}
            </div>
          </div>
          <div className="block tight">
            <h4>Top relations</h4>
            <div className="pill-list">
              {relationCounts.length ? (
                relationCounts.map(([relation, count]) => (
                  <span className="chip" key={`rel-${relation}`}>
                    {relation} <span className="muted">({count})</span>
                  </span>
                ))
              ) : (
                <p className="muted">No relations yet.</p>
              )}
            </div>
          </div>
          <div className="block tight">
            <h4>Recent years</h4>
            <div className="pill-list">
              {yearCounts.length ? (
                yearCounts.map(([year, count]) => (
                  <span className="chip" key={`year-${year}`}>
                    {year} <span className="muted">({count})</span>
                  </span>
                ))
              ) : (
                <p className="muted">No years recorded.</p>
              )}
            </div>
          </div>
          <div className="block tight">
            <h4>Key nodes (by degree)</h4>
            <ul className="insight-list">
              {keyNodes.length ? (
                keyNodes.map((node) => (
                  <li key={`key-${node.id}`}>
                    <button type="button" onClick={() => setSelectedId(node.id)}>
                      {node.title || 'Untitled'}
                    </button>
                    <span className="muted small-text">{degreeMap.get(node.id) ?? 0} links</span>
                  </li>
                ))
              ) : (
                <li className="muted">No nodes yet.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="insight-toggles">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={highlightKeyNodes}
              onChange={(event) => setHighlightKeyNodes(event.target.checked)}
            />
            <span>Highlight key nodes</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={highlightRecommendations}
              onChange={(event) => setHighlightRecommendations(event.target.checked)}
            />
            <span>Highlight recommendations</span>
          </label>
        </div>
      </section>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Filters</h2>
            <p className="subtle">
              Narrow the graph by search, tags, relation type, year, or relevance.
            </p>
          </div>
          <div className="filters">
            <label className="field">
              <span>Search</span>
              <input
                type="search"
                placeholder="title, author, abstract, dataset..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Tag</span>
              <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="">All tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Relation type</span>
              <select
                value={relationFilter}
                onChange={(event) => setRelationFilter(event.target.value)}
              >
                <option value="">All relations</option>
                {relationOptions.map((relation) => (
                  <option key={relation} value={relation}>
                    {relation}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Relevance</span>
              <select
                value={relevanceFilter}
                onChange={(event) => setRelevanceFilter(event.target.value)}
              >
                <option value="">Any relevance</option>
                {relevanceOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-row">
              <label className="field small">
                <span>Min year</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={minYear}
                  onChange={(event) => setMinYear(event.target.value)}
                />
              </label>
              <label className="field small">
                <span>Max year</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={maxYear}
                  onChange={(event) => setMaxYear(event.target.value)}
                />
              </label>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={hideIsolated}
                onChange={(event) => setHideIsolated(event.target.checked)}
              />
              <span>Hide isolated nodes</span>
            </label>
          </div>
          <div className="legend">
            <h3>Legend</h3>
            <div className="legend-row">
              {Object.entries(relevanceColors).map(([key, value]) => (
                <span className="chip" key={key}>
                  <span className="dot" style={{ backgroundColor: value }} />
                  {key}
                </span>
              ))}
            </div>
            {relationOptions.length > 0 && (
              <div className="legend-row wrap">
                {relationOptions.map((relation) => (
                  <span
                    className="chip"
                    style={{ backgroundColor: relationColors.get(relation) }}
                    key={relation}
                  >
                    {relation}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="graph-card">
          <div className="graph-header">
            <div>
              <h2>Graph</h2>
              <p className="subtle">
                Showing {filteredGraph.nodes.length} nodes and {filteredGraph.links.length} links.
              </p>
            </div>
            <div className="graph-actions">
              <button
                type="button"
                onClick={() => (graphRef.current as GraphHandle | null)?.zoomToFit(400, 50)}
              >
                Fit to view
              </button>
              <button
                type="button"
                onClick={() => (graphRef.current as GraphHandle | null)?.centerAt(0, 0, 500)}
              >
                Center
              </button>
            </div>
          </div>
          <div className="graph-container" ref={containerRef}>
            {loading ? (
              <div className="placeholder">Loading graph...</div>
            ) : !filteredGraph.nodes.length ? (
              <div className="placeholder">No nodes to display with the current filters.</div>
            ) : (
              <ForceGraph2D<PaperNode, PaperLink>
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={filteredGraph}
                nodeLabel={(node: PaperNode) =>
                  `${node.title ?? 'Untitled'}${node.year ? ` (${node.year})` : ''}`
                }
                nodeRelSize={6}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkWidth={(link: PaperLink) =>
                  selectedId &&
                  (normalizeId(link.source) === selectedId ||
                    normalizeId(link.target) === selectedId)
                    ? 2.5
                    : 1
                }
                cooldownTicks={120}
                linkColor={(link: PaperLink) => linkColor(link)}
                nodeCanvasObject={(
                  node: PaperNode,
                  ctx: CanvasRenderingContext2D,
                  scale: number,
                ) => {
                  const label = node.title ?? 'Untitled'
                  const fontSize = 10 / scale
                  const isRecommended = highlightRecommendations && recommendedIds.has(node.id)
                  const isKey = highlightKeyNodes && keyNodeIds.has(node.id)
                  const radius = 6 + (isKey ? 2 : 0) + (isRecommended ? 2 : 0)

                  let fill = nodeColor(node)
                  if (selectedId === node.id) {
                    fill = '#f97316'
                  } else if (isRecommended) {
                    fill = '#f59e0b'
                  } else if (isKey) {
                    fill = '#0ea5e9'
                  }

                  ctx.font = `500 ${fontSize}px "Inter", system-ui, -apple-system, sans-serif`
                  ctx.textAlign = 'left'
                  ctx.textBaseline = 'middle'

                  ctx.fillStyle = fill
                  ctx.beginPath()
                  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI)
                  ctx.fill()

                  ctx.fillStyle = '#0f172a'
                  ctx.fillText(label, (node.x ?? 0) + radius + 4, node.y ?? 0)
                }}
                onNodeClick={(node: PaperNode) => setSelectedId(node.id)}
                backgroundColor="#f8fafc"
              />
            )}
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-header">
            <h2>Details</h2>
            <p className="subtle">
              Select a node to see metadata and connected works.
            </p>
          </div>
          {selectedNode ? (
            <div className="details">
              <div className="detail-top">
                <div>
                  <p className="eyebrow">ID #{selectedNode.id}</p>
                  <h3>{selectedNode.title || 'Untitled paper'}</h3>
                  <p className="muted">
                    {[selectedNode.year, selectedNode.venue].filter(Boolean).join(' · ')}
                  </p>
                  {selectedNode.authors && <p className="muted">{selectedNode.authors}</p>}
                </div>
                {selectedNode.relevance && (
                  <span
                    className="chip"
                    style={{ backgroundColor: nodeColor(selectedNode) }}
                  >
                    {selectedNode.relevance}
                  </span>
                )}
              </div>
              {selectedNode.abstract && (
                <div className="block">
                  <h4>Abstract / notes</h4>
                  <p className="muted">{selectedNode.abstract}</p>
                </div>
              )}
              <div className="block grid">
                <div>
                  <h4>Tags</h4>
                  <div className="chip-row">
                    {(selectedNode.tags ?? []).length ? (
                      selectedNode.tags?.map((tag) => (
                        <span className="chip" key={tag}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="muted">No tags</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4>Keywords</h4>
                  <div className="chip-row">
                    {(selectedNode.keywords ?? []).length ? (
                      selectedNode.keywords?.map((keyword) => (
                        <span className="chip" key={keyword}>
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <p className="muted">No keywords</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="block grid">
                <div>
                  <h4>Dataset</h4>
                  <p className="muted">{selectedNode.dataset_used || '—'}</p>
                </div>
                <div>
                  <h4>Methods</h4>
                  <p className="muted">{selectedNode.methods || '—'}</p>
                </div>
              </div>
              <div className="block grid">
                <div>
                  <h4>Metrics</h4>
                  <p className="muted">{selectedNode.metrics || '—'}</p>
                </div>
                <div>
                  <h4>Relevance</h4>
                  <p className="muted">{selectedNode.relevance || '—'}</p>
                </div>
              </div>
              <div className="block grid">
                <div>
                  <h4>URL</h4>
                  {selectedNode.url ? (
                    <a href={selectedNode.url} target="_blank" rel="noreferrer">
                      {selectedNode.url}
                    </a>
                  ) : (
                    <p className="muted">None</p>
                  )}
                </div>
                <div>
                  <h4>DOI</h4>
                  {selectedNode.doi ? (
                    <a
                      href={`https://doi.org/${selectedNode.doi}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedNode.doi}
                    </a>
                  ) : (
                    <p className="muted">None</p>
                  )}
                </div>
              </div>
              <div className="block">
                <h4>Neighbors</h4>
                {neighbors.length ? (
                  <ul className="neighbor-list">
                    {neighbors.map((neighbor) => (
                      <li key={neighbor.id}>
                        <button type="button" onClick={() => setSelectedId(neighbor.id)}>
                          {neighbor.title || 'Untitled'}{' '}
                          {neighbor.year ? <span className="muted">({neighbor.year})</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No linked works for this node.</p>
                )}
              </div>
              <div className="block">
                <h4>Smart suggestions</h4>
                {recommended.length ? (
                  <ul className="neighbor-list">
                    {recommended.map((item) => (
                      <li key={item.node.id}>
                        <button type="button" onClick={() => setSelectedId(item.node.id)}>
                          {item.node.title || 'Untitled'}{' '}
                          {item.node.year ? <span className="muted">({item.node.year})</span> : null}
                        </button>
                        <div className="muted small-text">{item.reason || 'Shared metadata'}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No recommendations yet for this selection.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="placeholder">Select a node to view details.</div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
