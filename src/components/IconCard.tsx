import { Icon } from "../types";

interface IconCardProps {
  icon: Icon;
  isSelected: boolean;
  onSelect: () => void;
}

export default function IconCard({ icon, isSelected, onSelect }: IconCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", icon.svg_content);
    e.dataTransfer.setData("text/html", icon.svg_content);
  };

  return (
    <div
      onClick={onSelect}
      draggable
      onDragStart={handleDragStart}
      className={`group relative aspect-square rounded-xl p-4 cursor-pointer transition-all ${
        isSelected
          ? "bg-[#0f3460] ring-2 ring-[#e94560]"
          : "bg-[#16213e] hover:bg-[#0f3460]"
      }`}
    >
      {/* SVG Preview */}
      <div
        className="w-full h-full flex items-center justify-center [&>svg]:w-10 [&>svg]:h-10 [&>svg]:text-white"
        dangerouslySetInnerHTML={{ __html: icon.svg_content }}
      />

      {/* Name tooltip */}
      <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-[#16213e] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-center truncate text-[#a0a0a0]">{icon.name}</p>
      </div>

      {/* Favorite star */}
      {icon.favorite && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
    </div>
  );
}
