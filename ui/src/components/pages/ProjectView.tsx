import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useGraphData } from "../../hooks/useGraphData";
import type { PaperRow } from "../../hooks/usePaperData";
import { usePaperData } from "../../hooks/usePaperData";
import GraphViewer from "../features/GraphViewer";
import { ControlPanel } from "../features/ControlPanel";
import { InsightsPanel } from "../features/InsightsPanel";
import { PaperList } from "../features/PaperList";
import { NodeDetails } from "../features/NodeDetails";
import { Button } from "../ui/Button";
import { EditPaperModal } from "../features/EditPaperModal";
import { BibtexViewerModal } from "../features/BibtexViewerModal";
import { BuildLinkModal } from "../features/BuildLinkModal";
import { DashboardModal } from "../features/DashboardModal";
import { PreviewPaperModal } from "../features/PreviewPaperModal";
import { AutoDiscoverModal } from "../features/AutoDiscoverModal";

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

  const {
    papers,
    loading: papersLoading,
    deletePaper,
    addPaper,
    updatePaper,
  } = usePaperData(projectId);

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

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PaperRow | undefined>(
    undefined,
  );

  // BibTeX Modal State
  const [isBibtexModalOpen, setIsBibtexModalOpen] = useState(false);

  // Build Link Modal State
  const [isBuildLinkModalOpen, setIsBuildLinkModalOpen] = useState(false);

  // Auto Discover Modal State
  const [isAutoDiscoverModalOpen, setIsAutoDiscoverModalOpen] = useState(false);

  // Dashboard Modal State
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<PaperRow | undefined>(
    undefined,
  );

  // Resizable Panel State
  const [panelHeight, setPanelHeight] = useState(300); // Default height in pixels
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLElement>(null);

  // ... resize logic remains same ...
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      // Constrain between min and max heights
      const minHeight = 150;
      const maxHeight = window.innerHeight * 0.8; // Allow up to 80vh
      setPanelHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleAddPaper = useCallback(() => {
    setEditingPaper(undefined);
    setIsEditModalOpen(true);
  }, []);

  const handleEditPaper = useCallback((paper: PaperRow) => {
    setEditingPaper(paper);
    setIsEditModalOpen(true);
  }, []);

  const handlePreviewPaper = useCallback((paper: PaperRow) => {
    setPreviewPaper(paper);
    setIsPreviewModalOpen(true);
  }, []);

  const handleViewBibtex = useCallback(() => {
    setIsBibtexModalOpen(true);
  }, []);

  const handleViewDashboard = useCallback(() => {
    setIsDashboardModalOpen(true);
  }, []);

  const handleSavePaper = useCallback(
    async (data: Partial<PaperRow>) => {
      if (editingPaper) {
        await updatePaper(editingPaper.id, data);
      } else {
        if (!projectId) return; // Should not happen in project view
        await addPaper({
          title: data.title!,
          project_id: projectId,
          ...data,
        } as any);
      }
      setIsEditModalOpen(false);
    },
    [editingPaper, projectId, addPaper, updatePaper],
  );

  // Auto Discover Logic
  const handleAutoDiscover = async (
    strategies: string[],
    deleteExisting: boolean,
  ) => {
    if (!projectId) return;
    try {
      const res = await fetch("/api/projects/auto-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, strategies, deleteExisting }),
      });
      if (res.ok) {
        alert("Auto-discovery complete! Reloading graph...");
        reloadGraph();
      } else {
        const err = await res.json();
        alert(`Auto-discovery failed: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Auto-discovery error: ${e.message}`);
    }
  };

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
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                PaperGraph
              </h1>
            </div>
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
            onBuildLink={
              projectId ? () => setIsBuildLinkModalOpen(true) : undefined
            }
            onAutoDiscoverLinks={
              projectId ? () => setIsAutoDiscoverModalOpen(true) : undefined
            }
            onBuildGraph={
              projectId
                ? async () => {
                    if (
                      confirm(
                        "Are you sure you want to rebuild the graph and BibTeX?",
                      )
                    ) {
                      try {
                        const res = await fetch("/api/projects/build", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ projectId }),
                        });
                        if (res.ok) {
                          alert("Build triggered successfully!");
                          reloadGraph();
                        } else {
                          const err = await res.json();
                          alert(`Build failed: ${err.error}`);
                        }
                      } catch (e: any) {
                        alert(`Build error: ${e.message}`);
                      }
                    }
                  }
                : undefined
            }
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
      <main
        ref={containerRef}
        className="flex-1 flex flex-col h-full overflow-hidden relative"
      >
        <div className="flex-1 relative min-h-0">
          <GraphViewer
            nodes={filteredNodes}
            links={filteredLinks}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
          />
        </div>

        {/* Resizable Bottom Drawer / Split View for Papers Table */}
        <div
          style={{ height: `${panelHeight}px` }}
          className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] backdrop-blur-lg flex flex-col relative z-10 shadow-[-10px_-10px_30px_rgba(0,0,0,0.2)]"
        >
          {/* Drag Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute -top-3 left-0 right-0 h-6 cursor-ns-resize z-50 flex items-center justify-center group bg-transparent"
          >
            <div className="w-16 h-1 rounded-full bg-[var(--color-border)] group-hover:bg-[var(--color-primary)] transition-colors" />
          </div>
          <div className="pt-2 flex-1 overflow-hidden">
            <PaperList
              papers={papers}
              loading={papersLoading}
              onSelect={handleSelectPaper}
              onDelete={deletePaper}
              onAdd={handleAddPaper}
              onEdit={handleEditPaper}
              onPreview={handlePreviewPaper}
              onViewBibtex={projectId ? handleViewBibtex : undefined}
              onViewDashboard={projectId ? handleViewDashboard : undefined}
            />
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <EditPaperModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          paper={editingPaper}
          onSave={handleSavePaper}
        />
      )}

      {isBibtexModalOpen && projectId && (
        <BibtexViewerModal
          isOpen={isBibtexModalOpen}
          onClose={() => setIsBibtexModalOpen(false)}
          projectId={projectId}
        />
      )}

      {isBuildLinkModalOpen && projectId && (
        <BuildLinkModal
          isOpen={isBuildLinkModalOpen}
          onClose={() => setIsBuildLinkModalOpen(false)}
          projectId={projectId}
          nodes={graph.nodes}
          initialSourceId={selectedNodeId}
          onLinkCreated={() => {
            alert(
              "Link created! You may need to rebuild the graph to see changes.",
            );
            // Optional: trigger rebuild or just reload graph if it was auto-updated.
            // Since we didn't auto-rebuild in backend, we just close.
            // User can click Rebuild Graph manually.
          }}
        />
      )}

      {isAutoDiscoverModalOpen && projectId && (
        <AutoDiscoverModal
          isOpen={isAutoDiscoverModalOpen}
          onClose={() => setIsAutoDiscoverModalOpen(false)}
          onRun={handleAutoDiscover}
        />
      )}

      {isDashboardModalOpen && projectId && (
        <DashboardModal
          isOpen={isDashboardModalOpen}
          onClose={() => setIsDashboardModalOpen(false)}
          projectId={projectId}
          papers={papers}
        />
      )}

      {isPreviewModalOpen && previewPaper && (
        <PreviewPaperModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          paper={previewPaper}
        />
      )}
    </div>
  );
}
