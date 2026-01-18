import { useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { Button } from "../ui/Button";
import { PaperDetailsModal } from "./PaperDetailsModal";
import type { Node, Link } from "../../hooks/useGraphData";

interface NodeDetailsProps {
  selectedNodeId: string | number | null;
  nodes: Node[];
  links: Link[];
  onSelectNode: (id: string | number) => void;
}

export function NodeDetails({
  selectedNodeId,
  nodes,
  links,
  onSelectNode,
}: NodeDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const { neighbors, recommendations } = useMemo(() => {
    if (!selectedNodeId || !selectedNode)
      return { neighbors: [], recommendations: [] };

    const neighborIds = new Set<string | number>();
    links.forEach((link) => {
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      if (s === selectedNodeId) neighborIds.add(t);
      if (t === selectedNodeId) neighborIds.add(s);
    });

    const foundNeighbors = nodes.filter((n) => neighborIds.has(n.id));

    // Simple recommendation logic (based on shared tags)
    const nodeTags = new Set(selectedNode.tags || []);
    const recs = nodes
      .filter((n) => n.id !== selectedNodeId && !neighborIds.has(n.id))
      .map((n) => {
        const overlap = (n.tags || []).filter((t) => nodeTags.has(t)).length;
        return { node: n, score: overlap };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => r.node);

    return { neighbors: foundNeighbors, recommendations: recs };
  }, [selectedNodeId, selectedNode, nodes, links]);

  if (!selectedNode) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center text-[var(--color-text-muted)]">
          <p>Select a node to view details</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-y-auto shrink-0">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start gap-4 mb-2">
              <h2 className="text-xl font-bold">
                {selectedNode.title || "Untitled"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                title="Expand details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" x2="14" y1="3" y2="10" />
                  <line x1="3" x2="10" y1="21" y2="14" />
                </svg>
              </Button>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {selectedNode.authors}
            </p>
            <div className="flex gap-2 flex-wrap mt-3">
              {(selectedNode.tags || []).map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase text-[var(--color-text-subtle)] mb-3">
              Abstract
            </h4>
            <p className="text-sm leading-relaxed text-[var(--color-text-main)] opacity-90">
              {selectedNode.abstract || "No abstract available."}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase text-[var(--color-text-subtle)] mb-3">
              Neighbors ({neighbors.length})
            </h4>
            <div className="space-y-2">
              {neighbors.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onSelectNode(n.id)}
                  className="p-2 rounded hover:bg-[var(--color-bg-surface-hover)] cursor-pointer transition-colors border border-transparent hover:border-[var(--color-border)]"
                >
                  <div className="font-medium text-sm">{n.title}</div>
                </div>
              ))}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase text-[var(--color-text-subtle)] mb-3">
                Related Work
              </h4>
              <div className="space-y-2">
                {recommendations.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className="p-2 rounded bg-[var(--color-bg-surface-hover)] bg-opacity-30 hover:bg-opacity-100 cursor-pointer transition-colors border border-transparent hover:border-[var(--color-border)]"
                  >
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Based on shared tags
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <PaperDetailsModal
        paper={selectedNode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
