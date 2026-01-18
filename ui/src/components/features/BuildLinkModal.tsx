import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Link, ArrowRight } from "lucide-react";

interface BuildLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  nodes: { id: string | number; title?: string | null }[];
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

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSourceId(initialSourceId ? String(initialSourceId) : "");
      setTargetId("");
      setRelationType("related");
      setNote("");
      setError(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
                  {nodes.map((n) => (
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
                  {nodes.map((n) => (
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
