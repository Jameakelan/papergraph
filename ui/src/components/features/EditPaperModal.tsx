import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import type { PaperRow } from "../../hooks/usePaperData";

interface EditPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper?: PaperRow;
  onSave: (paper: Partial<PaperRow>) => Promise<void>;
}

export function EditPaperModal({
  isOpen,
  onClose,
  paper,
  onSave,
}: EditPaperModalProps) {
  const [formData, setFormData] = useState<Partial<PaperRow>>({});
  const [bibtex, setBibtex] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paper) {
      setFormData(paper);
      setBibtex(paper.bibtex || "");
      setActiveTab("manual"); // Default to manual when editing
    } else {
      setFormData({});
      setBibtex("");
      setActiveTab("bibtex"); // Default to bibtex when adding
    }
  }, [paper, isOpen]);

  const handleChange = (key: keyof PaperRow, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleBibtexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBibtex(e.target.value);
    // TODO: Client-side parsing if we wanted immediate feedback,
    // but we'll rely on backend parsing or user switching tabs.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === "bibtex" && bibtex.trim()) {
        // Send bibtex to be parsed by backend
        await onSave({ ...formData, bibtex });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save paper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{paper ? "Edit Paper" : "Add New Paper"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bibtex">BibTeX Paste</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="bibtex" className="mt-4">
              <div className="grid gap-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Paste your BibTeX entry here. We will parse it and create the
                  paper record. The original BibTeX will be saved to your
                  project's bibliography file.
                </p>
                <textarea
                  className="min-h-[300px] w-full p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface-active)] font-mono text-xs"
                  placeholder="@article{key, ...}"
                  value={bibtex}
                  onChange={handleBibtexChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4 grid gap-4">
              {/* Core Info */}
              <div className="grid gap-2">
                <h3 className="text-sm font-semibold border-b pb-1">
                  Core Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Title</label>
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => handleChange("title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Paper ID (Optional)
                    </label>
                    <Input
                      value={formData.paper_id || ""}
                      onChange={(e) => handleChange("paper_id", e.target.value)}
                      placeholder="e.g. arxiv.1234"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium">Authors</label>
                    <Input
                      value={formData.authors || ""}
                      onChange={(e) => handleChange("authors", e.target.value)}
                      placeholder="Author One, Author Two"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Year</label>
                    <Input
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) =>
                        handleChange("year", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Venue</label>
                    <Input
                      value={formData.venue || ""}
                      onChange={(e) => handleChange("venue", e.target.value)}
                      placeholder="Conf. or Journal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">DOI</label>
                    <Input
                      value={formData.doi || ""}
                      onChange={(e) => handleChange("doi", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">URL</label>
                    <Input
                      value={formData.url || ""}
                      onChange={(e) => handleChange("url", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="grid gap-2">
                <h3 className="text-sm font-semibold border-b pb-1">
                  Classification
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 lg:col-span-1 space-y-1">
                    <label className="text-xs font-medium">Relevance</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={formData.relevance || ""}
                      onChange={(e) =>
                        handleChange("relevance", e.target.value)
                      }
                    >
                      <option value="">Select...</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-span-3 lg:col-span-1 space-y-1">
                    <label className="text-xs font-medium">Tags</label>
                    <Input
                      value={formData.tags || ""}
                      onChange={(e) => handleChange("tags", e.target.value)}
                      placeholder="comma, separated"
                    />
                  </div>
                  <div className="col-span-3 lg:col-span-1 space-y-1">
                    <label className="text-xs font-medium">Keywords</label>
                    <Input
                      value={formData.keywords || ""}
                      onChange={(e) => handleChange("keywords", e.target.value)}
                      placeholder="comma, separated"
                    />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-2">
                <h3 className="text-sm font-semibold border-b pb-1">
                  Research Details
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Abstract</label>
                  <textarea
                    className="w-full h-20 p-2 text-xs border rounded-md bg-transparent"
                    value={formData.abstract || ""}
                    onChange={(e) => handleChange("abstract", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Summary</label>
                  <textarea
                    className="w-full h-16 p-2 text-xs border rounded-md bg-transparent"
                    value={formData.summary || ""}
                    onChange={(e) => handleChange("summary", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Notes</label>
                  <textarea
                    className="w-full h-16 p-2 text-xs border rounded-md bg-transparent"
                    value={formData.notes || ""}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Methods</label>
                    <Input
                      value={formData.methods || ""}
                      onChange={(e) => handleChange("methods", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Datasets Used</label>
                    <Input
                      value={formData.dataset_used || ""}
                      onChange={(e) =>
                        handleChange("dataset_used", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Gap</label>
                    <Input
                      value={formData.gap || ""}
                      onChange={(e) => handleChange("gap", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Future Work</label>
                    <Input
                      value={formData.future_work || ""}
                      onChange={(e) =>
                        handleChange("future_work", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
