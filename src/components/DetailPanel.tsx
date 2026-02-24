import { useState, useRef, useEffect } from "react";
import { Icon } from "../types";

interface DetailPanelProps {
  icon: Icon;
  onClose: () => void;
  onToggleFavorite: (iconId: string) => void;
  onUpdateTags: (iconId: string, tags: string[]) => void;
  onDeleteIcon: (iconId: string) => void;
  tintColor: string | null;
}

export default function DetailPanel({
  icon,
  onClose,
  onToggleFavorite,
  onUpdateTags,
  onDeleteIcon,
  tintColor: _tintColor,
}: DetailPanelProps) {
  const [tagInput, setTagInput] = useState("");
  const [copied, setCopied] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCopied(false);
  }, [icon.id]);

  function handleCopySvg() {
    navigator.clipboard.writeText(icon.svg_content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleAddTag() {
    const tag = tagInput.trim();
    if (tag && !icon.tags.includes(tag)) {
      onUpdateTags(icon.id, [...icon.tags, tag]);
      setTagInput("");
    }
  }

  function handleRemoveTag(tag: string) {
    onUpdateTags(
      icon.id,
      icon.tags.filter((t) => t !== tag)
    );
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  // Extract SVG dimensions from content
  function getSvgDimensions(): string {
    const widthMatch = icon.svg_content.match(/width=["'](\d+)/);
    const heightMatch = icon.svg_content.match(/height=["'](\d+)/);
    const viewBoxMatch = icon.svg_content.match(/viewBox=["'][\d.]+ [\d.]+ ([\d.]+) ([\d.]+)/);

    if (widthMatch && heightMatch) {
      return `${widthMatch[1]} x ${heightMatch[1]}`;
    }
    if (viewBoxMatch) {
      return `${viewBoxMatch[1]} x ${viewBoxMatch[2]}`;
    }
    return "—";
  }

  return (
    <aside className="w-72 bg-[var(--bg-secondary)] border-l border-[var(--border)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--border)] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{icon.name}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="p-6 flex items-center justify-center bg-white m-4 rounded-xl border border-[var(--border)]">
          <div
            className="[&>svg]:w-24 [&>svg]:h-24"
            dangerouslySetInnerHTML={{ __html: icon.svg_content }}
          />
        </div>

        {/* Actions */}
        <div className="px-4 space-y-2">
          <button
            onClick={handleCopySvg}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              copied
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy SVG
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleFavorite(icon.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                icon.favorite
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <svg className={`w-4 h-4 ${icon.favorite ? "fill-current" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              {icon.favorite ? "Favorited" : "Favorite"}
            </button>
            <button
              onClick={() => onDeleteIcon(icon.id)}
              className="py-2 px-3 rounded-lg text-sm border border-[var(--border)] text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
              title="Delete icon"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="px-4 mt-5">
          <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {icon.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-tertiary)] text-[12px] text-[var(--text-secondary)] rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[var(--text-muted)] hover:text-red-500 ml-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="Add tag..."
              className="flex-1 px-2 py-1 bg-[var(--bg-tertiary)] border border-transparent rounded text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={handleAddTag}
              className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded text-[12px]"
            >
              Add
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 mt-5 pb-4">
          <h4 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Details</h4>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Format</span>
              <span className="text-[var(--text-primary)] font-medium">SVG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Dimensions</span>
              <span className="text-[var(--text-primary)]">{getSvgDimensions()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">File size</span>
              <span className="text-[var(--text-primary)]">{formatFileSize(icon.file_size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Added</span>
              <span className="text-[var(--text-primary)]">{formatDate(icon.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
