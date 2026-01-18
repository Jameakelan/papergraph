import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useGraphData } from "../../hooks/useGraphData";
import { usePaperData } from "../../hooks/usePaperData";
import GraphViewer from "../features/GraphViewer";
import { ControlPanel } from "../features/ControlPanel";
import { InsightsPanel } from "../features/InsightsPanel";
import { PaperList } from "../features/PaperList";
import { NodeDetails } from "../features/NodeDetails";
import { Button } from "../ui/Button";

const DEFAULT_DB_PATH = "/papers.db";

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  // Use project-specific graph URL if projectId exists, otherwise default
  const graphUrl = projectId ? `/${projectId}.json` : "/graph.json";

  // Data Hooks
  const {
    graph,
    loading: graphLoading,
    reload: reloadGraph,
  } = useGraphData(graphUrl);

  // We'll update usePaperData to accept projectId later
  const {
    papers,
    loading: papersLoading,
    deletePaper,
  } = usePaperData(DEFAULT_DB_PATH, projectId);

  // State
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(
    null,
  );
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>(
    [],
  );

  // Extract unique values for filters
  const { allKeywords, allTags, allRelationTypes } = useMemo(() => {
    const keywords = new Set<string>();
    const tags = new Set<string>();
    const types = new Set<string>();

    graph.nodes.forEach((node) => {
      if (Array.isArray(node.tags)) {
        node.tags.forEach((t) => tags.add(t));
      }
      if (Array.isArray(node.keywords)) {
        node.keywords.forEach((k) => keywords.add(k));
      }
    });

    graph.links.forEach((link) => {
      if (link.type) types.add(link.type);
    });

    return {
      allKeywords: Array.from(keywords).sort(),
      allTags: Array.from(tags).sort(),
      allRelationTypes: Array.from(types).sort(),
    };
  }, [graph]);

  // Filtered Data
  const { nodes: filteredNodes, links: filteredLinks } = useMemo(() => {
    let matchingNodes = graph.nodes;
    let matchingLinks = graph.links;

    // 1. Filter Nodes by Search Query
    if (filterQuery) {
      const lower = filterQuery.toLowerCase();
      matchingNodes = matchingNodes.filter(
        (node) =>
          (node.title || "").toLowerCase().includes(lower) ||
          (node.authors || "").toLowerCase().includes(lower) ||
          (node.tags || []).some((t) => t.toLowerCase().includes(lower)),
      );
    }

    // 2. Filter Nodes by Tags
    if (selectedTags.length > 0) {
      matchingNodes = matchingNodes.filter((node) => {
        const nodeTags = new Set(node.tags || []);
        return selectedTags.some((t) => nodeTags.has(t));
      });
    }

    // 3. Filter Nodes by Keywords (Tags)
    if (selectedKeywords.length > 0) {
      matchingNodes = matchingNodes.filter((node) => {
        const nodeKeywords = new Set(node.keywords || []); // Only check keywords here
        return selectedKeywords.some((k) => nodeKeywords.has(k));
      });
    }

    // 4. Filter Links by Relation Type
    if (selectedRelationTypes.length > 0) {
      matchingLinks = matchingLinks.filter((link) =>
        link.type ? selectedRelationTypes.includes(link.type) : false,
      );
    }

    const nodeIds = new Set(matchingNodes.map((n) => n.id));

    // 5. Ensure links strictly connect visible nodes
    matchingLinks = matchingLinks.filter((link) => {
      const s =
        typeof link.source === "object" ? (link.source as any).id : link.source;
      const t =
        typeof link.target === "object" ? (link.target as any).id : link.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes: matchingNodes, links: matchingLinks };
  }, [
    graph,
    filterQuery,
    selectedKeywords,
    selectedTags,
    selectedRelationTypes,
  ]);

  // Derived Stats
  const stats = {
    nodes: graph.nodes.length,
    links: graph.links.length,
    visible: filteredNodes.length,
  };

  // Handlers
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleSelectPaper = useCallback((id: number) => {
    setSelectedNodeId(id);
  }, []);

  return (
    <div className="app-layout h-screen bg-[var(--color-bg-app)] text-[var(--color-text-main)] overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-[320px] lg:w-[360px] flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] backdrop-blur-md h-full overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex-shrink-0 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              PaperGraph
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Project: {projectId || "Default"}
            </p>
          </div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm" tabIndex={-1}>
              All Projects
            </Button>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin">
          <ControlPanel
            onSearch={setFilterQuery}
            onLoadData={reloadGraph}
            dataUrl={graphUrl}
            loading={graphLoading}
            stats={stats}
            allKeywords={allKeywords}
            selectedKeywords={selectedKeywords}
            onKeywordsChange={setSelectedKeywords}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            allRelationTypes={allRelationTypes}
            selectedRelationTypes={selectedRelationTypes}
            onRelationTypesChange={setSelectedRelationTypes}
          />

          <InsightsPanel
            nodes={filteredNodes}
            links={filteredLinks}
            onSelectNode={setSelectedNodeId}
          />

          <NodeDetails
            selectedNodeId={selectedNodeId}
            nodes={graph.nodes}
            links={graph.links}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 relative">
          <GraphViewer
            nodes={filteredNodes}
            links={filteredLinks}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />

          {/* Overlay Title */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-[var(--color-bg-surface)] backdrop-blur px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
              <span className="text-xs font-semibold text-[var(--color-text-subtle)]">
                Interactive Mode
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Drawer / Split View for Papers Table */}
        <div className="h-[35%] min-h-[200px] border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] backdrop-blur-lg flex flex-col relative z-10 shadow-[-10px_-10px_30px_rgba(0,0,0,0.2)]">
          <PaperList
            papers={papers}
            loading={papersLoading}
            onSelect={handleSelectPaper}
            onDelete={deletePaper}
          />
        </div>
      </main>
    </div>
  );
}
