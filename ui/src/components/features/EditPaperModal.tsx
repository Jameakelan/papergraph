import { useState, useEffect } from "react";
import { X } from "lucide-react";
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

interface TagInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const tags = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed].join(", "));
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-transparent focus-within:ring-1 focus-within:ring-ring focus-within:border-primary min-h-[40px]">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="flex items-center gap-1 px-2 py-0.5 bg-[var(--color-bg-surface-active)] text-xs rounded border border-[var(--color-border)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 bg-transparent border-0 outline-none text-sm min-w-[120px]"
        placeholder={tags.length === 0 ? placeholder : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputValue)}
      />
    </div>
  );
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

  const parseBibtex = (bibtex: string) => {
    const newData: Partial<PaperRow> = {};

    // Helper to get value between braces or quotes
    const extract = (key: string) => {
      // Matches key = {value} or key = "value" or key = value, case insensitive key
      // Supports multi-line values
      const regex = new RegExp(
        `${key}\\s*=\\s*[{"']?((?:.|\\n)*?)[}"']?\\s*(?:,|\\n|$)`,
        "i",
      );
      const match = bibtex.match(regex);
      if (match && match[1]) {
        // Clean up excessive whitespace/newlines
        return match[1].replace(/\\s+/g, " ").trim();
      }
      return null;
    };

    const title = extract("title");
    if (title) newData.title = title;

    const abstract = extract("abstract");
    if (abstract) newData.abstract = abstract;

    const author = extract("author");
    if (author) newData.authors = author;

    const year = extract("year");
    if (year) newData.year = parseInt(year) || undefined;

    const keywords = extract("keywords");
    if (keywords) newData.keywords = keywords;

    const doi = extract("doi");
    if (doi) newData.doi = doi;

    const journal = extract("journal");
    const booktitle = extract("booktitle");
    const venue = journal || booktitle;
    if (venue) newData.venue = venue;

    const url = extract("url");
    if (url) newData.url = url;

    return newData;
  };

  const handleBibtexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBibtex(val);

    if (val.trim()) {
      const parsed = parseBibtex(val);
      if (Object.keys(parsed).length > 0) {
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          // Don't overwrite if not found in BibTeX, or maybe we should?
          // For now, let's just merge what we found.
        }));
      }
    }
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Source Database
                    </label>
                    <Input
                      value={formData.database || ""}
                      onChange={(e) => handleChange("database", e.target.value)}
                      placeholder="e.g. Scopus, Google Scholar"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Duplicate?</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={formData.is_duplicated ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "is_duplicated",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    >
                      <option value="">Unknown</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Duplicate Reason
                    </label>
                    <Input
                      value={formData.duplicate_reason || ""}
                      onChange={(e) =>
                        handleChange("duplicate_reason", e.target.value)
                      }
                      placeholder="e.g. same DOI"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Excluded?</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={formData.is_excluded ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "is_excluded",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    >
                      <option value="">Unknown</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">
                      Excluded Reason
                    </label>
                    <Input
                      value={formData.excluded_reason || ""}
                      onChange={(e) =>
                        handleChange("excluded_reason", e.target.value)
                      }
                      placeholder="e.g. out of scope"
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
                    <TagInput
                      value={formData.tags || ""}
                      onChange={(val) => handleChange("tags", val)}
                      placeholder="Add tag..."
                    />
                  </div>
                  <div className="col-span-3 lg:col-span-1 space-y-1">
                    <label className="text-xs font-medium">Keywords</label>
                    <TagInput
                      value={formData.keywords || ""}
                      onChange={(val) => handleChange("keywords", val)}
                      placeholder="Add keyword..."
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Methods</label>
                    <TagInput
                      value={formData.methods || ""}
                      onChange={(val) => handleChange("methods", val)}
                      placeholder="Add method..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Datasets Used</label>
                    <TagInput
                      value={formData.dataset_used || ""}
                      onChange={(val) => handleChange("dataset_used", val)}
                      placeholder="Add dataset..."
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium">Research Gap</label>
                    <textarea
                      className="w-full h-16 p-2 text-xs border rounded-md bg-transparent"
                      value={formData.gap || ""}
                      onChange={(e) => handleChange("gap", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium">Future Work</label>
                    <textarea
                      className="w-full h-16 p-2 text-xs border rounded-md bg-transparent"
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
