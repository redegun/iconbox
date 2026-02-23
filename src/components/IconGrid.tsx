import { useState } from "react";
import { Icon } from "../types";
import IconCard from "./IconCard";

interface IconGridProps {
  icons: Icon[];
}

export default function IconGrid({ icons }: IconGridProps) {
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);

  if (icons.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#a0a0a0]">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
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
          <p className="text-lg mb-2">No icons yet</p>
          <p className="text-sm">Import a folder or drag SVG files here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
        {icons.map((icon) => (
          <IconCard
            key={icon.id}
            icon={icon}
            isSelected={selectedIcon?.id === icon.id}
            onSelect={() => setSelectedIcon(icon)}
          />
        ))}
      </div>
    </div>
  );
}
