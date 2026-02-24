import { useState, useRef, useEffect } from "react";
import { Collection, ViewMode } from "../types";

interface SidebarProps {
  collections: Collection[];
  activeCollection: string | null;
  viewMode: ViewMode;
  totalIconCount: number;
  favoriteCount: number;
  onSelectCollection: (id: string) => void;
  onSelectView: (mode: ViewMode) => void;
  onImportFolder: (parentId?: string) => void;
  onCreateCollection: (name: string, parentId?: string) => void;
  onRenameCollection: (id: string, newName: string) => void;
  onDeleteCollection: (id: string) => void;
  onOpenSettings: () => void;
}

interface TreeNode {
  collection: Collection;
  children: TreeNode[];
  expanded: boolean;
}

export default function Sidebar({
  collections,
  activeCollection,
  viewMode,
  totalIconCount,
  favoriteCount,
  onSelectCollection,
  onSelectView,
  onImportFolder,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onOpenSettings,
}: SidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [creatingParentId, setCreatingParentId] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; colId: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // Build tree structure
  function buildTree(items: Collection[], parentId: string | null = null): TreeNode[] {
    return items
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        collection: c,
        children: buildTree(items, c.id),
        expanded: expandedIds.has(c.id),
      }))
      .sort((a, b) => a.collection.name.localeCompare(b.collection.name));
  }

  const tree = buildTree(collections);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (newName.trim()) {
      onCreateCollection(newName.trim(), creatingParentId);
      setNewName("");
      setIsCreating(false);
      setCreatingParentId(undefined);
    }
  }

  function handleRename() {
    if (renamingId && renameValue.trim()) {
      onRenameCollection(renamingId, renameValue.trim());
      setRenamingId(null);
      setRenameValue("");
    }
  }

  function startCreateSubfolder(parentId: string) {
    setCreatingParentId(parentId);
    setIsCreating(true);
    setExpandedIds((prev) => new Set(prev).add(parentId));
    setContextMenu(null);
  }

  function handleContextMenu(e: React.MouseEvent, colId: string) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, colId });
  }

  // Recursive tree item renderer
  function renderTreeNode(node: TreeNode, depth: number = 0) {
    const isActive = viewMode === "collection" && activeCollection === node.collection.id;
    const hasChildren = node.children.length > 0;
    const paddingLeft = 12 + depth * 16;

    return (
      <div key={node.collection.id}>
        <button
          onClick={() => {
            onSelectCollection(node.collection.id);
          }}
          onContextMenu={(e) => handleContextMenu(e, node.collection.id)}
          className={`w-full flex items-center gap-2 py-1.5 pr-3 text-[13px] rounded-md transition-colors group ${
            isActive
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
          style={{ paddingLeft }}
        >
          {/* Expand/collapse toggle */}
          <span
            className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${
              hasChildren ? "cursor-pointer" : "opacity-0"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.collection.id);
            }}
          >
            {hasChildren && (
              <svg
                className={`w-3 h-3 transition-transform ${node.expanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>

          {/* Folder icon */}
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          {/* Collection color dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.collection.color || "#6366f1" }}
          />

          {/* Name or rename input */}
          {renamingId === node.collection.id ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenamingId(null);
              }}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white border border-[var(--accent)] rounded px-1.5 py-0.5 text-[13px] focus:outline-none"
            />
          ) : (
            <span className="flex-1 truncate text-left">{node.collection.name}</span>
          )}

          {/* Count */}
          <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
            {node.collection.icon_count}
          </span>
        </button>

        {/* Children */}
        {node.expanded && hasChildren && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}

        {/* Inline create subfolder input */}
        {isCreating && creatingParentId === node.collection.id && (
          <div style={{ paddingLeft: paddingLeft + 20 }} className="pr-3 py-1">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setCreatingParentId(undefined);
                }
              }}
              onBlur={() => {
                if (!newName.trim()) {
                  setIsCreating(false);
                  setCreatingParentId(undefined);
                }
              }}
              placeholder="Folder name..."
              className="w-full bg-white border border-[var(--accent)] rounded px-2 py-1 text-[13px] focus:outline-none"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col select-none">
      {/* Logo */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-[var(--border)] flex-shrink-0">
        <svg className="w-5 h-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
        </svg>
        <span className="font-semibold text-sm text-[var(--text-primary)]">IconBox</span>
      </div>

      {/* Navigation */}
      <div className="px-2 pt-3 pb-1 space-y-0.5">
        {/* All Icons */}
        <button
          onClick={() => onSelectView("all")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
            viewMode === "all"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="flex-1 text-left">All Icons</span>
          <span className="text-[11px] text-[var(--text-muted)]">{totalIconCount}</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => onSelectView("favorites")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
            viewMode === "favorites"
              ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="flex-1 text-left">Favorites</span>
          <span className="text-[11px] text-[var(--text-muted)]">{favoriteCount}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-[var(--border)]" />

      {/* Collections header */}
      <div className="px-4 pb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Collections
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onImportFolder()}
            title="Import folder"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button
            onClick={() => {
              setCreatingParentId(undefined);
              setIsCreating(true);
            }}
            title="New collection"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Root-level create input */}
        {isCreating && creatingParentId === undefined && (
          <div className="px-3 py-1 mb-1">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
              onBlur={() => {
                if (!newName.trim()) setIsCreating(false);
              }}
              placeholder="Collection name..."
              className="w-full bg-white border border-[var(--accent)] rounded px-2 py-1 text-[13px] focus:outline-none"
            />
          </div>
        )}

        {tree.map((node) => renderTreeNode(node))}

        {collections.length === 0 && !isCreating && (
          <div className="px-3 py-4 text-center">
            <p className="text-[12px] text-[var(--text-muted)]">No collections yet</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Import a folder to begin</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--border)] flex-shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              startCreateSubfolder(contextMenu.colId);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            New Subfolder
          </button>
          <button
            onClick={() => {
              onImportFolder(contextMenu.colId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Into...
          </button>
          <div className="mx-2 my-1 border-t border-[var(--border)]" />
          <button
            onClick={() => {
              const col = collections.find((c) => c.id === contextMenu.colId);
              if (col) {
                setRenamingId(col.id);
                setRenameValue(col.name);
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <button
            onClick={() => {
              onDeleteCollection(contextMenu.colId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </aside>
  );
}
