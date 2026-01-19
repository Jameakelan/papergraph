import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PaperRow } from "../../hooks/usePaperData";

// --- Colors ---
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

// --- Data Processing Helpers ---

const processCounts = (
  papers: PaperRow[],
  extractor: (p: PaperRow) => string[] | string | null,
  topN: number = 10,
) => {
  const counts: Record<string, number> = {};
  papers.forEach((p) => {
    const raw = extractor(p);
    if (!raw) return;
    const items = Array.isArray(raw) ? raw : [raw];
    items.forEach((item) => {
      if (!item) return;
      const normalized = item.trim(); // Case sensitivity should likely be handled upstream or here if needed
      if (normalized) {
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
};

const splitString = (
  str: string | null | undefined,
  separator: string = ",",
) => {
  if (!str) return [];
  return str
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
};

// --- Components ---

interface ChartProps {
  papers: PaperRow[];
}

export function KeywordAnalysisChart({ papers }: ChartProps) {
  const data = useMemo(
    () => processCounts(papers, (p) => splitString(p.keywords), 10),
    [papers],
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "var(--color-bg-surface-hover)" }}
          />
          <Bar
            dataKey="value"
            fill="#8884d8"
            radius={[0, 4, 4, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TagsAnalysisChart({ papers }: ChartProps) {
  const data = useMemo(
    () => processCounts(papers, (p) => splitString(p.tags), 10),
    [papers],
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "var(--color-bg-surface-hover)" }}
          />
          <Bar
            dataKey="value"
            fill="#82ca9d"
            radius={[0, 4, 4, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AuthorAnalysisChart({ papers }: ChartProps) {
  const data = useMemo(
    () =>
      processCounts(
        papers,
        (p) => splitString(p.authors?.replace(/ and /g, ",")),
        10,
      ),
    [papers],
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={120}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "var(--color-bg-surface-hover)" }}
          />
          <Bar
            dataKey="value"
            fill="#ffc658"
            radius={[0, 4, 4, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VenueAnalysisChart({ papers }: ChartProps) {
  const data = useMemo(
    () => processCounts(papers, (p) => p.venue || "Unknown", 10),
    [papers],
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={140}
            tick={{ fontSize: 10 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "var(--color-bg-surface-hover)" }}
          />
          <Bar
            dataKey="value"
            fill="#ff8042"
            radius={[0, 4, 4, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceAnalysisChart({ papers }: ChartProps) {
  const data = useMemo(
    () => processCounts(papers, (p) => p.database || "Manual/Other", 10),
    [papers],
  );

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDistributionChart({ papers }: ChartProps) {
  const data = useMemo(() => {
    const counts = {
      Included: 0,
      Excluded: 0,
      Duplicated: 0,
    };

    papers.forEach((p) => {
      // Priority: Duplicated > Excluded > Included (default/active)
      if (p.is_duplicated) counts.Duplicated++;
      else if (p.is_excluded) counts.Excluded++;
      else counts.Included++;
    });

    // Filter zero values if desired, or keep to show 0
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [papers]);

  const STATUS_COLORS: Record<string, string> = {
    Included: "#4ade80", // green-400
    Excluded: "#f87171", // red-400
    Duplicated: "#94a3b8", // slate-400
    Processing: "#fbbf24", // amber-400
  };

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ percent }) =>
              (percent ?? 0) > 0 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
            }
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={STATUS_COLORS[entry.name] || "#ccc"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DetailedStatusChart({ papers }: ChartProps) {
  // Specifically for Excluded vs Duplicated counts (user request: "venue duplicated, excluded")
  // Let's make a simple bar chart comparing these categories
  const data = useMemo(() => {
    const duplicated = papers.filter((p) => p.is_duplicated).length;
    const excluded = papers.filter((p) => p.is_excluded).length;
    // Maybe add reasons?
    // For now just the high level counts as requested alongside others
    return [
      { name: "Duplicated", value: duplicated },
      { name: "Excluded", value: excluded },
    ];
  }, [papers]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ fill: "var(--color-bg-surface-hover)" }}
          />
          <Bar
            dataKey="value"
            fill="#f87171"
            radius={[0, 4, 4, 0]}
            barSize={40}
            name="Count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === "Duplicated" ? "#94a3b8" : "#f87171"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
