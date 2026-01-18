import { useMemo } from "react";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
// type PaperRow removed
import type { Node, Link } from "../../hooks/useGraphData";

interface InsightsPanelProps {
  nodes: Node[];
  links: Link[];
  onSelectNode: (id: string | number) => void;
}

export function InsightsPanel({
  nodes,
  links,
  onSelectNode,
}: InsightsPanelProps) {
  const stats = useMemo(() => {
    const tagCounts = new Map<string, number>();
    const yearCounts = new Map<string, number>();
    const degrees = new Map<string | number, number>();

    nodes.forEach((node) => {
      node.tags?.forEach((tag) =>
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1),
      );
      if (node.year) {
        const y = String(node.year);
        yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
      }
    });

    links.forEach((link) => {
      const s = typeof link.source === "object" ? link.source.id : link.source;
      const t = typeof link.target === "object" ? link.target.id : link.target;
      degrees.set(s, (degrees.get(s) || 0) + 1);
      degrees.set(t, (degrees.get(t) || 0) + 1);
    });

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topYears = Array.from(yearCounts.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .slice(0, 6);

    const keyNodes = nodes
      .map((n) => ({ ...n, degree: degrees.get(n.id) || 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    return { topTags, topYears, keyNodes };
  }, [nodes, links]);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Top Tags">
        <div className="flex flex-wrap gap-2">
          {stats.topTags.map(([tag, count]) => (
            <Chip key={tag}>
              {tag} <span className="opacity-60 ml-1">({count})</span>
            </Chip>
          ))}
          {stats.topTags.length === 0 && (
            <span className="text-[var(--color-text-muted)]">
              No tags found
            </span>
          )}
        </div>
      </Card>

      <Card title="Key Papers">
        <div className="flex flex-col gap-2">
          {stats.keyNodes.map((node) => (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className="text-left text-sm hover:text-[var(--color-primary)] transition-colors py-1 truncate"
            >
              <div className="font-medium truncate">
                {node.title || "Untitled"}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {node.degree} connections
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
