import { useState } from "react";
import { Collection } from "../types";

interface SidebarProps {
  collections: Collection[];
  activeCollection: string | null;
  onSelectCollection: (id: string) => void;
  onImportFolder: () => void;
  onCreateCollection: (name: string) => void;
}

export default function Sidebar({
  collections,
  activeCollection,
  onSelectCollection,
  onImportFolder,
  onCreateCollection,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateCollection(newName.trim());
      setNewName("");
      setIsCreating(false);
    }
  };

  return (
    <aside className="w-64 bg-[#16213e] border-r border-[#0f3460] flex flex-col">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center border-b border-[#0f3460]">
        <svg className="w-6 h-6 text-[#e94560]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
        </svg>
        <span className="ml-2 font-semibold text-lg">IconBox</span>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-[#0f3460]">
        <button
          onClick={onImportFolder}
          className="w-full py-2 px-3 bg-[#e94560] hover:bg-[#d63850] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import Folder
        </button>
      </div>

      {/* Collections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">
              Collections
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="text-[#a0a0a0] hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {isCreating && (
            <div className="mb-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                onBlur={() => !newName && setIsCreating(false)}
                placeholder="Collection name..."
                autoFocus
                className="w-full px-3 py-2 bg-[#0f3460] border border-[#e94560] rounded-lg text-sm focus:outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => onSelectCollection(col.id)}
                className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${
                  activeCollection === col.id
                    ? "bg-[#0f3460] text-white"
                    : "text-[#a0a0a0] hover:bg-[#0f3460]/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: col.color || "#e94560" }}
                  />
                  <span className="truncate">{col.name}</span>
                </div>
                <span className="text-xs text-[#a0a0a0]">{col.icon_count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#0f3460]">
        <button className="w-full px-3 py-2 text-sm text-[#a0a0a0] hover:text-white flex items-center gap-2 rounded-lg hover:bg-[#0f3460]/50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}
