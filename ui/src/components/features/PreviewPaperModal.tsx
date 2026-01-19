import { Dialog, DialogContent } from "../ui/Dialog";
import type { PaperRow } from "../../hooks/usePaperData";
import { Save, Trash2, FileText, StickyNote, Pencil, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Note {
  id: number;
  paper_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface PreviewPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper?: PaperRow;
}

export function PreviewPaperModal({
  isOpen,
  onClose,
  paper,
}: PreviewPaperModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!paper?.id) return;
    setIsLoadingNotes(true);
    try {
      const res = await fetch(`/api/notes?paperId=${paper.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [paper?.id]);

  useEffect(() => {
    if (isOpen && activeTab === "notes" && paper) {
      fetchNotes();
      setNoteContent("");
      setEditingNoteId(null);
    }
  }, [isOpen, activeTab, paper, fetchNotes]);

  if (!paper) return null;

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setIsSaving(true);
    try {
      if (editingNoteId) {
        // Update existing
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingNoteId, content: noteContent }),
        });
        if (!res.ok) throw new Error("Failed to update note");
      } else {
        // Create new
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId: paper.id, content: noteContent }),
        });
        if (!res.ok) throw new Error("Failed to create note");
      }
      await fetchNotes();
      setNoteContent("");
      setEditingNoteId(null);
    } catch (error) {
      console.error("Failed to save note", error);
      alert("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteContent("");
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      await fetchNotes();
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setNoteContent("");
      }
    } catch (error) {
      console.error("Failed to delete note", error);
    }
  };

  const handleDeleteAllNotes = async () => {
    if (!confirm("Permanently delete ALL notes for this paper?")) return;
    try {
      const res = await fetch(`/api/notes?paperId=${paper.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete all notes");
      await fetchNotes();
      setEditingNoteId(null);
      setNoteContent("");
    } catch (error) {
      console.error("Failed to delete all notes", error);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold border-b border-[var(--color-border)] pb-2 mb-3 mt-1 text-[var(--color-text-main)]">
      {children}
    </h3>
  );

  const InfoField = ({
    label,
    value,
    isCapitalize = false,
  }: {
    label: string;
    value: string | number | null | undefined;
    isCapitalize?: boolean;
  }) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
          {label}
        </span>
        <div
          className={`text-sm text-[var(--color-text-main)] ${isCapitalize ? "capitalize" : ""} break-words`}
        >
          {value}
        </div>
      </div>
    );
  };

  const ChipField = ({
    label,
    value,
  }: {
    label: string;
    value: string | null | undefined;
  }) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
          {label}
        </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {value.split(",").map((item) => (
            <span
              key={item}
              className="px-2 py-0.5 bg-[var(--color-bg-surface-active)] text-[var(--color-text-main)] border border-[var(--color-border)] rounded text-xs"
            >
              {item.trim()}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[var(--color-bg-app)] border border-[var(--color-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] shrink-0">
          <div className="flex flex-col gap-1 overflow-hidden pr-8">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 truncate">
              {paper.title}
            </h2>
            <div className="flex gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{paper.year || "N/A"}</span>
              <span>•</span>
              <span>{paper.venue || "N/A"}</span>
              {paper.doi && (
                <>
                  <span>•</span>
                  <a
                    href={paper.url || `https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline truncate max-w-[300px]"
                  >
                    {paper.doi}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "details" ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"}`}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === "notes" ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"}`}
          >
            <StickyNote className="w-4 h-4" />
            Notes{" "}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-bg-surface-active)] text-xs">
              {notes.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[var(--color-bg-app)]">
          {activeTab === "details" ? (
            <div className="p-6 space-y-8">
              {/* Core Information */}
              <div>
                <SectionTitle>Core Information</SectionTitle>
                <div className="grid grid-cols-2 gap-6">
                  <InfoField
                    label="Authors"
                    value={paper.authors}
                    isCapitalize
                  />
                  <InfoField label="Venue" value={paper.venue} />
                  <InfoField label="Year" value={paper.year} />
                  <InfoField
                    label="Source Database"
                    value={paper.database}
                    isCapitalize
                  />
                  <InfoField
                    label="Added At"
                    value={
                      paper.added_at
                        ? new Date(paper.added_at).toLocaleDateString()
                        : null
                    }
                  />
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-6">
                      <InfoField
                        label="Duplicated?"
                        value={
                          paper.is_duplicated
                            ? `Yes - ${paper.duplicate_reason || "No reason"}`
                            : "No"
                        }
                      />
                      <InfoField
                        label="Excluded?"
                        value={
                          paper.is_excluded
                            ? `Yes - ${paper.excluded_reason || "No reason"}`
                            : "No"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div>
                <SectionTitle>Classification</SectionTitle>
                <div className="grid grid-cols-3 gap-6">
                  <InfoField
                    label="Relevance"
                    value={paper.relevance}
                    isCapitalize
                  />

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {paper.tags ? (
                        paper.tags.split(",").map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs"
                          >
                            {t.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          None
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
                      Keywords
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {paper.keywords ? (
                        paper.keywords.split(",").map((k) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs"
                          >
                            {k.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          None
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Details */}
              <div>
                <SectionTitle>Research Details</SectionTitle>
                <div className="space-y-4">
                  {paper.abstract && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
                        Abstract
                      </span>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap bg-[var(--color-bg-surface)] p-3 rounded-lg border border-[var(--color-border)]">
                        {paper.abstract}
                      </p>
                    </div>
                  )}
                  {paper.summary && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-[var(--color-text-subtle)] uppercase tracking-wide">
                        Summary
                      </span>
                      <p className="text-sm text-[var(--color-text-main)] leading-relaxed">
                        {paper.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <ChipField label="Methods" value={paper.methods} />
                    <ChipField
                      label="Datasets Used"
                      value={paper.dataset_used}
                    />
                    <InfoField label="Research Gap" value={paper.gap} />
                    <InfoField label="Future Work" value={paper.future_work} />
                    <InfoField label="Limitations" value={paper.limitations} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-bg-surface-active)]">
                <h3 className="text-sm font-semibold mb-3">
                  {editingNoteId ? "Edit Note" : "New Note"}
                </h3>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write a new note..."
                  className="w-full h-24 p-3 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-bg-app)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                  spellCheck={false}
                />
                <div className="flex justify-end gap-2 mt-3">
                  {editingNoteId && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-hover)] rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteContent.trim() || isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white hover:brightness-110 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving
                      ? "Saving..."
                      : editingNoteId
                        ? "Update Note"
                        : "Add Note"}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-app)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">
                    All Notes
                  </h3>
                  {notes.length > 0 && (
                    <button
                      onClick={handleDeleteAllNotes}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete All
                    </button>
                  )}
                </div>

                {isLoadingNotes ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    Loading notes...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] group ${editingNoteId === note.id ? "ring-2 ring-[var(--color-primary)]" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {new Date(note.created_at).toLocaleString()}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-surface-hover)] rounded"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--color-bg-surface-hover)] rounded"
                              title="Delete"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--color-text-main)] whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-bg-surface-active)] text-[var(--color-text-main)] rounded-lg hover:bg-[var(--color-bg-surface-hover)] border border-[var(--color-border)] transition-all text-sm font-medium"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
