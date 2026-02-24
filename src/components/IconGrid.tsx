import { Icon } from "../types";
import IconCard from "./IconCard";

interface IconGridProps {
  icons: Icon[];
  selectedIcon: Icon | null;
  onSelectIcon: (icon: Icon) => void;
  onOpenDetail: (icon: Icon) => void;
  tintColor: string | null;
  iconSize: number;
}

export default function IconGrid({
  icons,
  selectedIcon,
  onSelectIcon,
  onOpenDetail,
  tintColor,
  iconSize,
}: IconGridProps) {
  if (icons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-base font-medium mb-1 text-[var(--text-secondary)]">No icons yet</p>
          <p className="text-sm text-[var(--text-muted)]">Import a folder to get started</p>
        </div>
      </div>
    );
  }

  // Compute column width based on icon size + padding
  const cellWidth = iconSize + 40;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellWidth}px, 1fr))`,
        }}
      >
        {icons.map((icon) => (
          <IconCard
            key={icon.id}
            icon={icon}
            isSelected={selectedIcon?.id === icon.id}
            onSelect={() => onSelectIcon(icon)}
            onDoubleClick={() => onOpenDetail(icon)}
            tintColor={tintColor}
            iconSize={iconSize}
          />
        ))}
      </div>
    </div>
  );
}
