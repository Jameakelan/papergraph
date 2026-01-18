import type { PaperRow } from "../../hooks/usePaperData";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { useState, useMemo } from "react";
import { Input } from "../ui/Input";

interface PaperListProps {
  papers: PaperRow[];
  loading: boolean;
  onSelect: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function PaperList({
  papers,
  loading,
  onSelect,
  onDelete,
}: PaperListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return papers;
    const q = search.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors?.toLowerCase().includes(q) ||
        p.venue?.toLowerCase().includes(q),
    );
  }, [papers, search]);

  if (loading)
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        Loading papers...
      </div>
    );

  return (
    <Card title="Paper Database" className="h-full flex flex-col">
      <div className="mb-4">
        <Input
          placeholder="Search papers database..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-auto flex-1 min-h-[300px]">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-[var(--color-bg-surface-hover)] z-10 backdrop-blur-sm">
            <tr>
              <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                Title
              </th>
              <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                Year
              </th>
              <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                Venue
              </th>
              <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                Tags
              </th>
              {onDelete && (
                <th className="p-3 font-semibold text-[var(--color-text-subtle)] w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((paper) => (
              <tr
                key={paper.id}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-surface-hover)] transition-colors cursor-pointer"
                onClick={() => onSelect(paper.id)}
              >
                <td className="p-3 font-medium">
                  {paper.title}
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {paper.authors}
                  </div>
                </td>
                <td className="p-3 text-[var(--color-text-muted)]">
                  {paper.year}
                </td>
                <td className="p-3 text-[var(--color-text-muted)]">
                  {paper.venue}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    {(paper.tags?.split(",") || []).slice(0, 3).map((t) => (
                      <Chip
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 h-auto"
                      >
                        {t.trim()}
                      </Chip>
                    ))}
                  </div>
                </td>
                {onDelete && (
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this paper?",
                          )
                        ) {
                          onDelete(paper.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                      title="Delete paper"
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
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            No papers found.
          </div>
        )}
      </div>
    </Card>
  );
}
