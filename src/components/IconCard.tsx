import { Icon } from "../types";

interface IconCardProps {
  icon: Icon;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  tintColor: string | null;
  iconSize: number;
}

export default function IconCard({
  icon,
  isSelected,
  onSelect,
  onDoubleClick,
  tintColor,
  iconSize,
}: IconCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Set SVG content for drag to external apps
    e.dataTransfer.setData("text/plain", icon.svg_content);
    e.dataTransfer.setData("text/html", icon.svg_content);
    e.dataTransfer.setData("image/svg+xml", icon.svg_content);
    e.dataTransfer.effectAllowed = "copy";

    // Create a drag image from the SVG
    const div = document.createElement("div");
    div.innerHTML = icon.svg_content;
    div.style.width = "48px";
    div.style.height = "48px";
    div.style.position = "absolute";
    div.style.top = "-1000px";
    document.body.appendChild(div);
    e.dataTransfer.setDragImage(div, 24, 24);
    setTimeout(() => document.body.removeChild(div), 0);
  };

  const tintStyle = tintColor
    ? { filter: `brightness(0) saturate(100%)`, color: tintColor }
    : {};

  const svgContainerStyle = tintColor
    ? `[&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[${iconSize}px] [&>svg]:max-h-[${iconSize}px] [&>svg_path]:fill-[${tintColor}] [&>svg]:text-[${tintColor}]`
    : "[&>svg]:w-full [&>svg]:h-full";

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all select-none ${
        isSelected
          ? "bg-[var(--accent-light)] ring-2 ring-[var(--accent)]"
          : "hover:bg-[var(--bg-hover)]"
      }`}
    >
      {/* SVG Preview */}
      <div
        className={`flex items-center justify-center ${svgContainerStyle}`}
        style={{
          width: iconSize,
          height: iconSize,
          ...tintStyle,
        }}
        dangerouslySetInnerHTML={{ __html: icon.svg_content }}
      />

      {/* Name */}
      <span
        className="text-[11px] leading-tight text-center text-[var(--text-secondary)] truncate w-full px-1"
        title={icon.name}
      >
        {icon.name}
      </span>

      {/* Favorite indicator */}
      {icon.favorite && (
        <div className="absolute top-1.5 right-1.5">
          <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
    </div>
  );
}
