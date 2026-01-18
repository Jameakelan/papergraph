import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";

interface BibtexViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function BibtexViewerModal({
  isOpen,
  onClose,
  projectId,
}: BibtexViewerModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setError(null);
      fetch(`/api/projects/bibtex?projectId=${projectId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to fetch BibTeX");
          }
          return res.text();
        })
        .then(setContent)
        .catch((err) => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setContent("");
    }
  }, [isOpen, projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Project BibTeX</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] flex flex-col gap-2 -mx-6 my-6 border-y border-[var(--color-border)]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
              Loading...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              Error: {error}
            </div>
          ) : (
            <pre className="w-full h-full p-10 overflow-auto bg-[var(--color-bg-surface-active)] font-mono text-xs focus:outline-none whitespace-pre select-text">
              {content}
            </pre>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} disabled={!content || loading}>
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
