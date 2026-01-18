import type { PaperRow } from "../../hooks/usePaperData";
import { useMemo } from "react";

interface PaperYearChartProps {
  papers: PaperRow[];
}

const isPlausibleYear = (year?: number | null) => {
  if (!Number.isFinite(year)) return false;
  const y = Number(year);
  const current = new Date().getFullYear();
  return y >= 1900 && y <= current + 1;
};

export function PaperYearChart({ papers }: PaperYearChartProps) {
  // Group papers by year and count
  const yearData = useMemo(() => {
    const yearCounts = new Map<number, number>();

    papers.forEach((paper) => {
      if (isPlausibleYear(paper.year)) {
        const y = Number(paper.year);
        const count = yearCounts.get(y) || 0;
        yearCounts.set(y, count + 1);
      }
    });

    // Convert to array and sort by year
    return Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
  }, [papers]);

  const maxCount = useMemo(
    () => Math.max(...yearData.map((d) => d.count), 1),
    [yearData],
  );

  if (yearData.length === 0) {
    return (
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">
          Papers by Year
        </h3>
        <p className="text-[var(--color-text-muted)]">
          No papers with year data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">
        Papers by Year
      </h3>

      {/* Chart */}
      <div className="mt-4">
        <div className="flex items-end justify-between gap-2 h-[120px]">
          {yearData.map(({ year, count }) => {
            const height = (count / maxCount) * 100;
            return (
              <div
                key={year}
                className="flex-1 flex flex-col items-center gap-2 group"
              >
                {/* Bar */}
                <div
                  className="relative w-full flex flex-col justify-end"
                  style={{ height: "80px" }}
                >
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all hover:from-indigo-600 hover:to-purple-600 relative group-hover:shadow-lg"
                    style={{ height: `${height}%` }}
                  >
                    {/* Count label on hover */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-semibold text-[var(--color-text-main)] bg-[var(--color-bg-surface)] px-2 py-1 rounded shadow-md border border-[var(--color-border)]">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year label */}
                <span className="text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">
                  {year}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">
              Total Years: {yearData.length}
            </span>
            <span className="text-[var(--color-text-muted)]">
              Max Papers: {maxCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
