import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { MultiSelect } from "../ui/MultiSelect";
import { useState } from "react";
import type { FormEvent } from "react";

interface ControlPanelProps {
  onSearch: (query: string) => void;
  onLoadData: (url: string) => void;
  dataUrl: string;
  loading: boolean;
  stats: {
    nodes: number;
    links: number;
    visible: number;
  };
  // Filter Props
  // Relation Types
  allRelationTypes: string[];
  selectedRelationTypes: string[];
  onRelationTypesChange: (types: string[]) => void;
  // Keywords
  allKeywords: string[];
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  // Tags
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function ControlPanel({
  onSearch,
  onLoadData,
  dataUrl,
  loading,
  stats,
  allRelationTypes,
  selectedRelationTypes,
  onRelationTypesChange,
  allKeywords,
  selectedKeywords,
  onKeywordsChange,
  allTags,
  selectedTags,
  onTagsChange,
}: ControlPanelProps) {
  const [localUrl, setLocalUrl] = useState(dataUrl);

  const handleLoad = (e: FormEvent) => {
    e.preventDefault();
    onLoadData(localUrl);
  };

  return (
    <Card className="mb-4 relative z-20">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleLoad} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Graph Data Source"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="/graph.json"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="text-center p-2 bg-[var(--color-bg-surface-hover)] rounded-[var(--radius-sm)]">
            <div className="text-lg font-bold text-[var(--color-text-main)]">
              {stats.nodes}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Nodes</div>
          </div>
          <div className="text-center p-2 bg-[var(--color-bg-surface-hover)] rounded-[var(--radius-sm)]">
            <div className="text-lg font-bold text-[var(--color-text-main)]">
              {stats.links}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Links</div>
          </div>
          <div className="text-center p-2 bg-[var(--color-primary)] rounded-[var(--radius-sm)]">
            <div className="text-lg font-bold text-white">{stats.visible}</div>
            <div className="text-xs text-white opacity-80">Visible</div>
          </div>
        </div>

        <Input
          label="Filter Nodes"
          placeholder="Search title, author, tag..."
          onChange={(e) => onSearch(e.target.value)}
        />

        <div className="space-y-3">
          <MultiSelect
            label="Relation Types"
            options={allRelationTypes}
            selected={selectedRelationTypes}
            onChange={onRelationTypesChange}
            placeholder="All relation types"
          />

          <MultiSelect
            label="Tags"
            options={allTags}
            selected={selectedTags}
            onChange={onTagsChange}
            placeholder="All tags"
          />

          <MultiSelect
            label="Keywords"
            options={allKeywords}
            selected={selectedKeywords}
            onChange={onKeywordsChange}
            placeholder="All keywords"
          />
        </div>
      </div>
    </Card>
  );
}
