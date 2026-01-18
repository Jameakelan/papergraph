import { Dialog, DialogContent } from "../ui/Dialog";
import type { PaperRow } from "../../hooks/usePaperData";
import { PaperYearChart } from "./PaperYearChart";
import { useMemo } from "react";

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  papers: PaperRow[];
}

const isPlausibleYear = (year?: number | null) => {
  if (!Number.isFinite(year)) return false;
  const y = Number(year);
  const current = new Date().getFullYear();
  return y >= 1900 && y <= current + 1;
};

export function DashboardModal({
  isOpen,
  onClose,
  projectId,
  papers,
}: DashboardModalProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalPapers = papers.length;

    // Count papers with tags (as a proxy for connections/relationships)
    const papersWithTags = papers.filter(
      (p) => p.tags && p.tags.trim().length > 0,
    ).length;

    const papersWithValidYear = papers.filter((p) => isPlausibleYear(p.year));

    // Get most recent paper by finding latest plausible year
    const recentPapers = papersWithValidYear
      .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
      .slice(0, 5);

    const latestYear = recentPapers.length > 0 ? recentPapers[0].year : null;

    return {
      totalPapers,
      papersWithTags,
      latestYear,
      recentPapers,
    };
  }, [papers]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden">
        <div className="h-full flex flex-col bg-[var(--color-bg-app)]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Dashboard
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Project: {projectId}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Statistics Cards */}
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Total Papers
                  </h3>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-main)]">
                  {stats.totalPapers}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Papers in database
                </p>
              </div>

              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Connections
                  </h3>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M18 9a9 9 0 0 1-9 9" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-main)]">
                  {stats.papersWithTags}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Papers with tags
                </p>
              </div>

              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                    Recent Activity
                  </h3>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--color-text-main)]">
                  {stats.latestYear || "N/A"}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Latest publication year
                </p>
              </div>

              {/* Papers by Year Chart - Spans all 3 columns */}
              <div className="col-span-3">
                <PaperYearChart papers={papers} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
