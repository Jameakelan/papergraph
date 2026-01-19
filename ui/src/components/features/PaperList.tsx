import type { PaperRow } from "../../hooks/usePaperData";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { useState, useMemo } from "react";
import { Input } from "../ui/Input";
import { LayoutDashboard } from "lucide-react";

interface PaperListProps {
  papers: PaperRow[];
  loading: boolean;
  onSelect: (id: number) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  onEdit?: (paper: PaperRow) => void;
  onPreview?: (paper: PaperRow) => void;
  onViewBibtex?: () => void;
  onViewDashboard?: () => void;
}

export function PaperList({
  papers,
  loading,
  onSelect,
  onDelete,
  onAdd,
  onEdit,
  onPreview,
  onViewBibtex,
  onViewDashboard,
}: PaperListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return papers;
    const q = search.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authors?.toLowerCase().includes(q) ||
        p.venue?.toLowerCase().includes(q) ||
        p.database?.toLowerCase().includes(q) ||
        p.duplicate_reason?.toLowerCase().includes(q) ||
        p.excluded_reason?.toLowerCase().includes(q),
    );
  }, [papers, search]);

  if (loading)
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        Loading papers...
      </div>
    );

  return (
    <Card
      title="Paper Database"
      className="h-full flex flex-col"
      actions={
        <div className="flex gap-2">
          {onViewDashboard && (
            <button
              onClick={onViewDashboard}
              className="text-xs bg-[var(--color-bg-surface-active)] border border-[var(--color-border)] text-[var(--color-text-main)] px-2 py-1 rounded hover:opacity-90 transition-opacity flex items-center gap-1"
              title="View Dashboard"
            >
              <LayoutDashboard className="w-3 h-3" />
              Dashboard
            </button>
          )}
          {onViewBibtex && (
            <button
              onClick={onViewBibtex}
              className="text-xs bg-[var(--color-bg-surface-active)] border border-[var(--color-border)] text-[var(--color-text-main)] px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              BibTeX
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              Add Paper
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="mb-4 flex-shrink-0">
          <Input
            placeholder="Search papers database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-1">
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
                  Database
                </th>
                <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                  Duplicate
                </th>
                <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                  Excluded
                </th>
                <th className="p-3 font-semibold text-[var(--color-text-subtle)]">
                  Tags
                </th>
                {(onDelete || onEdit || onPreview) && (
                  <th className="p-3 font-semibold text-[var(--color-text-subtle)] w-16 text-right">
                    Actions
                  </th>
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
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {paper.database || ""}
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {paper.is_duplicated === 1
                      ? "Yes"
                      : paper.is_duplicated === 0
                        ? "No"
                        : ""}
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {paper.is_excluded === 1
                      ? "Yes"
                      : paper.is_excluded === 0
                        ? "No"
                        : ""}
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
                  {(onDelete || onEdit || onPreview) && (
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {onPreview && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(paper);
                            }}
                            className="p-1.5 hover:bg-[var(--color-bg-surface-active)] text-[var(--color-text-muted)] rounded transition-colors"
                            title="Preview paper"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(paper);
                            }}
                            className="p-1.5 hover:bg-[var(--color-bg-surface-active)] text-[var(--color-text-muted)] rounded transition-colors"
                            title="Edit paper"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
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
                              width="14"
                              height="14"
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
                        )}
                      </div>
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
      </div>
    </Card>
  );
}
