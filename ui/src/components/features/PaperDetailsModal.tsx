import { Modal } from "../ui/Modal";
import { Chip } from "../ui/Chip";
import type { Node } from "../../hooks/useGraphData";

interface PaperDetailsModalProps {
  paper: Node | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaperDetailsModal({
  paper,
  isOpen,
  onClose,
}: PaperDetailsModalProps) {
  if (!paper) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={paper.title || "Untitled"}>
      <div className="flex flex-col gap-6 p-1">
        <div className="flex flex-wrap gap-2 text-sm text-[var(--color-text-muted)]">
          {paper.year && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {paper.year}
            </span>
          )}
          {paper.venue && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              {paper.venue}
            </span>
          )}
          {paper.database && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
                <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
              </svg>
              {paper.database}
            </span>
          )}
          {paper.is_duplicated !== undefined && paper.is_duplicated !== null && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Duplicate: {paper.is_duplicated ? "Yes" : "No"}
            </span>
          )}
          {paper.duplicate_reason && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <path d="M12 20h9" />
                <path d="M12 4h9" />
                <path d="M12 12h9" />
                <path d="M3 17h.01" />
                <path d="M3 7h.01" />
                <path d="M3 12h.01" />
              </svg>
              {paper.duplicate_reason}
            </span>
          )}
          {paper.is_excluded !== undefined && paper.is_excluded !== null && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
              Excluded: {paper.is_excluded ? "Yes" : "No"}
            </span>
          )}
          {paper.excluded_reason && (
            <span className="flex items-center gap-1.5 bg-[var(--color-bg-surface-hover)] px-2.5 py-1 rounded-full">
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
                <path d="M12 20h9" />
                <path d="M12 4h9" />
                <path d="M12 12h9" />
                <path d="M3 17h.01" />
                <path d="M3 7h.01" />
                <path d="M3 12h.01" />
              </svg>
              {paper.excluded_reason}
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2">
            Authors
          </h4>
          <p className="text-[var(--color-text-main)] text-lg">
            {paper.authors}
          </p>
        </div>

        {paper.abstract && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2">
              Abstract
            </h4>
            <p className="text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>
        )}

        {paper.tags && paper.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider mb-2">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {paper.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          </div>
        )}

        {paper.url && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              View Original Paper
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}
