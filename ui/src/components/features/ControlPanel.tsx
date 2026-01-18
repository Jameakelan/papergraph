import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { MultiSelect } from "../ui/MultiSelect";
import { Tooltip } from "../ui/Tooltip";
import { useState } from "react";
import type { FormEvent } from "react";
import { RefreshCw, Hammer, Link as LinkIcon, Sparkles } from "lucide-react";

interface ControlPanelProps {
  onSearch: (query: string) => void;
  onLoadData: (url: string) => void;
  onBuildGraph?: () => void;
  onBuildLink?: () => void;
  onAutoDiscoverLinks?: () => void;
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
  onBuildGraph,
  onBuildLink,
  onAutoDiscoverLinks,
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
    <Card className="mb-4 relative z-20 overflow-visible border-0 bg-transparent shadow-none p-0">
      <div className="flex flex-col gap-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center p-3 bg-[var(--color-bg-surface)]/80 backdrop-blur-sm border border-[var(--color-border)] rounded-xl shadow-sm">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-500">
              {stats.nodes}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
              Nodes
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-[var(--color-bg-surface)]/80 backdrop-blur-sm border border-[var(--color-border)] rounded-xl shadow-sm">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-500">
              {stats.links}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
              Links
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-2xl font-bold relative z-10">
              {stats.visible}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80 relative z-10">
              Visible
            </div>
          </div>
        </div>

        {/* Actions & Source */}
        <form
          onSubmit={handleLoad}
          className="flex gap-2 items-center bg-[var(--color-bg-surface)] p-2 rounded-xl border border-[var(--color-border)] shadow-sm"
        >
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none opacity-50">
              <span className="text-xs font-mono text-[var(--color-text-muted)]">
                SRC:
              </span>
            </div>
            <input
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="/graph.json"
              className="w-full bg-transparent border-none text-xs font-mono text-[var(--color-text-main)] pl-10 pr-2 py-1 focus:ring-0 placeholder-[var(--color-text-muted)]/30 h-8"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-[var(--color-border)] pl-2">
            <Tooltip content="Reload Data">
              <Button
                type="submit"
                disabled={loading}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </Tooltip>

            {onBuildLink && (
              <Tooltip content="Build Link">
                <Button
                  type="button"
                  onClick={onBuildLink}
                  disabled={loading}
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            )}

            {onAutoDiscoverLinks && (
              <Tooltip content="Auto-Discover Links">
                <Button
                  type="button"
                  onClick={onAutoDiscoverLinks}
                  disabled={loading}
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 rounded-lg hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 text-[var(--color-text-muted)] hover:text-white transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            )}

            {onBuildGraph && (
              <Tooltip content="Rebuild Graph">
                <Button
                  type="button"
                  onClick={onBuildGraph}
                  disabled={loading}
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-muted)] hover:text-amber-400 transition-colors"
                >
                  <Hammer className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            )}
          </div>
        </form>

        {/* Search */}
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <Input
            label=""
            placeholder="Filter nodes..."
            onChange={(e) => onSearch(e.target.value)}
            className="border-none bg-transparent focus:ring-0 text-sm h-10"
            containerClassName="mb-0"
          />
        </div>

        {/* Filters Accordion/Group */}
        <div className="space-y-3 bg-[var(--color-bg-surface)]/50 p-3 rounded-xl border border-[var(--color-border)]">
          <MultiSelect
            label="Relation Types"
            options={allRelationTypes}
            selected={selectedRelationTypes}
            onChange={onRelationTypesChange}
            placeholder="All relation types"
            className="text-xs"
          />

          <MultiSelect
            label="Tags"
            options={allTags}
            selected={selectedTags}
            onChange={onTagsChange}
            placeholder="All tags"
            className="text-xs"
          />

          <MultiSelect
            label="Keywords"
            options={allKeywords}
            selected={selectedKeywords}
            onChange={onKeywordsChange}
            placeholder="All keywords"
            className="text-xs"
          />
        </div>
      </div>
    </Card>
  );
}
