import { useState, useEffect } from "react";
import { Settings } from "../types";

interface SettingsModalProps {
  settings: Settings;
  onSave: (key: string, value: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  null, // Original
  "#1a1a1a",
  "#6366f1",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
];

const ICON_SIZES = [32, 48, 64, 80, 96];

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [iconSize, setIconSize] = useState(settings.icon_size);
  const [tintColor, setTintColor] = useState<string | null>(settings.tint_color);
  const [customColor, setCustomColor] = useState(settings.tint_color || "#6366f1");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSizeChange(size: number) {
    setIconSize(size);
    onSave("icon_size", size.toString());
  }

  function handleTintChange(color: string | null) {
    setTintColor(color);
    onSave("tint_color", color || "");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-[var(--border)] w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Icon Size */}
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-3 block">
              Icon Size
            </label>
            <div className="flex gap-2">
              {ICON_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    iconSize === size
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Tint Color */}
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)] mb-3 block">
              Icon Tint Color
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => handleTintChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${
                    tintColor === color
                      ? "border-[var(--accent)] scale-110 shadow-sm"
                      : "border-[var(--border)] hover:border-[var(--text-muted)]"
                  }`}
                  style={color ? { backgroundColor: color } : undefined}
                  title={color || "Original colors"}
                >
                  {!color && (
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Custom color picker */}
            <div className="flex items-center gap-2">
              <label className="text-[13px] text-[var(--text-secondary)]">Custom:</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  handleTintChange(e.target.value);
                }}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--border)]"
              />
              <span className="text-[12px] text-[var(--text-muted)] font-mono">{customColor}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
