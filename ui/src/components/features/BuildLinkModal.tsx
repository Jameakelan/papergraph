import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Link, ArrowRight, Filter, X } from "lucide-react";
import { MultiSelect } from "../ui/MultiSelect";
import { Input } from "../ui/Input";

interface BuildLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  nodes: {
    id: string | number;
    title?: string | null;
    tags?: string[] | null;
    keywords?: string[] | null;
    authors?: string | null;
    year?: number | string | null;
  }[];
  onLinkCreated: () => void;
  initialSourceId?: string | number | null;
}

export function BuildLinkModal({
  isOpen,
  onClose,
  projectId,
  nodes,
  onLinkCreated,
  initialSourceId,
}: BuildLinkModalProps) {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState("related");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  // Extract unique values for filters
  const { allTags, allKeywords, allAuthors } = useMemo(() => {
    const tags = new Set<string>();
    const keywords = new Set<string>();
    const authors = new Set<string>();

    nodes.forEach((node) => {
      node.tags?.forEach((t) => tags.add(t));
      node.keywords?.forEach((k) => keywords.add(k));
      if (node.authors) {
        // Handle "Last, First and Last, First" format
        const authorList = node.authors.includes(" and ")
          ? node.authors.split(" and ")
          : node.authors.split(",");
        authorList.forEach((a) => authors.add(a.trim()));
      }
    });

    return {
      allTags: Array.from(tags).sort(),
      allKeywords: Array.from(keywords).sort(),
      allAuthors: Array.from(authors).sort(),
    };
  }, [nodes]);

  // Filter Nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Tags
      if (selectedTags.length > 0) {
        const nodeTags = new Set(node.tags || []);
        if (!selectedTags.some((t) => nodeTags.has(t))) return false;
      }

      // Keywords
      if (selectedKeywords.length > 0) {
        const nodeKeywords = new Set(node.keywords || []);
        if (!selectedKeywords.some((k) => nodeKeywords.has(k))) return false;
      }

      // Authors
      if (selectedAuthors.length > 0) {
        if (!node.authors) return false;
        if (
          !selectedAuthors.some((a) =>
            node.authors!.toLowerCase().includes(a.toLowerCase()),
          )
        )
          return false;
      }

      // Year
      if (yearFilter) {
        if (!node.year) return false;
        if (!String(node.year).includes(yearFilter)) return false;
      }

      return true;
    });
  }, [nodes, selectedTags, selectedKeywords, selectedAuthors, yearFilter]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSourceId(initialSourceId ? String(initialSourceId) : "");
      setTargetId("");
      setRelationType("related");
      setNote("");
      setError(null);
      // Don't auto-reset filters to allow persistence across multiple link creations?
      // Or reset? Let's reset for fresh start.
      setSelectedTags([]);
      setSelectedKeywords([]);
      setSelectedAuthors([]);
      setYearFilter("");
      setShowFilters(false);
    }
  }, [isOpen, initialSourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setError("Please select both source and target nodes.");
      return;
    }
    if (sourceId === targetId) {
      setError("Source and target cannot be the same.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          source: sourceId,
          target: targetId,
          type: relationType,
          note,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create link");
      }

      onLinkCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const commonTypes = [
    "related",
    "cites",
    "extends",
    "compares",
    "uses-dataset",
    "implements",
    "critiques",
    "supports",
  ];

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedKeywords([]);
    setSelectedAuthors([]);
    setYearFilter("");
  };

  const activeFilterCount =
    selectedTags.length +
    selectedKeywords.length +
    selectedAuthors.length +
    (yearFilter ? 1 : 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-[var(--color-primary)]" />
            Build Relationship Link
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-md">
              {error}
            </div>
          )}

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 text-xs h-8"
            >
              <Filter className="w-3.5 h-3.5" />
              {showFilters ? "Hide Filters" : "Filter Nodes"}
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-white text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && showFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-xs h-8 text-[var(--color-text-muted)] hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Area */}
          {showFilters && (
            <div className="p-3 bg-[var(--color-bg-surface-hover)]/50 rounded-lg border border-[var(--color-border)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MultiSelect
                  label="Tags"
                  options={allTags}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Filter by tags..."
                  className="bg-[var(--color-bg-surface)]"
                />
                <MultiSelect
                  label="Keywords"
                  options={allKeywords}
                  selected={selectedKeywords}
                  onChange={setSelectedKeywords}
                  placeholder="Filter by keywords..."
                  className="bg-[var(--color-bg-surface)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MultiSelect
                  label="Authors"
                  options={allAuthors}
                  selected={selectedAuthors}
                  onChange={setSelectedAuthors}
                  placeholder="Filter by authors..."
                  className="bg-[var(--color-bg-surface)]"
                />
                <Input
                  label="Year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="Filter by year..."
                  className="h-9 bg-[var(--color-bg-surface)]"
                />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] text-right">
                Found {filteredNodes.length} nodes
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">
                Source Node ID
              </label>
              <div className="relative">
                <input
                  list="source-nodes"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder-[var(--color-text-muted)]/50"
                  placeholder="Select source..."
                />
                <datalist id="source-nodes">
                  {filteredNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || n.id}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="pb-3 text-[var(--color-text-muted)]">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">
                Target Node ID
              </label>
              <div className="relative">
                <input
                  list="target-nodes"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder-[var(--color-text-muted)]/50"
                  placeholder="Select target..."
                />
                <datalist id="target-nodes">
                  {filteredNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || n.id}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">
              Relationship Type
            </label>
            <div className="relative">
              <input
                list="relation-types"
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <datalist id="relation-types">
                {commonTypes.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 rounded-md bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-main)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-y placeholder-[var(--color-text-muted)]/50"
              placeholder="Explain the relationship..."
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
