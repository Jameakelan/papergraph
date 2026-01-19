import { useState } from "react";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Sparkles } from "lucide-react";

interface AutoDiscoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (strategies: string[], deleteExisting: boolean) => Promise<void>;
}

export function AutoDiscoverModal({
  isOpen,
  onClose,
  onRun,
}: AutoDiscoverModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteExisting, setDeleteExisting] = useState(false);
  const [strategies, setStrategies] = useState({
    tags: true,
    keywords: true,
    authors: true,
    year: false,
  });

  const handleToggle = (key: keyof typeof strategies) => {
    setStrategies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeStrategies = Object.entries(strategies)
    .filter(([_, active]) => active)
    .map(([key]) => key);

  const handleRun = async () => {
    if (deleteExisting) {
      if (
        !confirm(
          "Are you sure you want to delete ALL existing links in this project? This action cannot be undone.",
        )
      ) {
        return;
      }
    }

    setLoading(true);
    try {
      await onRun(activeStrategies, deleteExisting);
      onClose();
    } catch (e) {
      console.error(e);
      // Ensure loading turned off if error handling isn't done upstream completely
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
            Auto-Discover Links
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Select criteria to automatically find and create relationships
            between papers.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-hover)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="checkbox"
                checked={strategies.tags}
                onChange={() => handleToggle("tags")}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Matching Tags</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Link papers sharing the same tags
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-hover)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="checkbox"
                checked={strategies.keywords}
                onChange={() => handleToggle("keywords")}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Matching Keywords</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Link papers sharing keywords
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-hover)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="checkbox"
                checked={strategies.authors}
                onChange={() => handleToggle("authors")}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Matching Authors</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Link papers by same authors
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-hover)] cursor-pointer hover:border-[var(--color-primary)] transition-colors">
              <input
                type="checkbox"
                checked={strategies.year}
                onChange={() => handleToggle("year")}
                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Same Year</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Link papers published in the same year
                </div>
              </div>
            </label>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)]">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-red-200/20 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors">
              <input
                type="checkbox"
                checked={deleteExisting}
                onChange={(e) => setDeleteExisting(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-red-500 focus:ring-red-500 border-red-500/50"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-400">
                  Delete existing links first
                </div>
                <div className="text-xs text-red-400/70">
                  Warning: This will remove ALL links in this project before
                  creating new ones. This cannot be undone.
                </div>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRun}
            disabled={loading || activeStrategies.length === 0}
            className="gap-2"
            variant={deleteExisting ? "secondary" : "primary"}
          >
            {loading ? (
              "Running..."
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {deleteExisting ? "Delete & Discover" : "Start Discovery"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
