import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import IconGrid from "./components/IconGrid";
import SearchBar from "./components/SearchBar";
import DetailPanel from "./components/DetailPanel";
import SettingsModal from "./components/SettingsModal";
import { Icon, Collection, Settings, ViewMode } from "./types";

function App() {
  // Data
  const [collections, setCollections] = useState<Collection[]>([]);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<Icon[]>([]);
  const [totalIconCount, setTotalIconCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // UI state
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [detailIcon, setDetailIcon] = useState<Icon | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    theme: "light",
    icon_size: 64,
    tint_color: null,
  });

  // ── Data loading ───────────────────────────────────────────

  const loadCollections = useCallback(async () => {
    try {
      const cols = await invoke<Collection[]>("get_collections");
      setCollections(cols);
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const [total, favs] = await Promise.all([
        invoke<number>("get_total_icon_count"),
        invoke<number>("get_favorite_count"),
      ]);
      setTotalIconCount(total);
      setFavoriteCount(favs);
    } catch (err) {
      console.error("Failed to load counts:", err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const s = await invoke<Settings>("get_settings");
      setSettings(s);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  const loadIcons = useCallback(async () => {
    try {
      let iconList: Icon[];
      if (viewMode === "all") {
        iconList = await invoke<Icon[]>("get_all_icons");
      } else if (viewMode === "favorites") {
        iconList = await invoke<Icon[]>("get_favorite_icons");
      } else if (activeCollection) {
        iconList = await invoke<Icon[]>("get_icons", { collectionId: activeCollection });
      } else {
        iconList = [];
      }
      setIcons(iconList);
    } catch (err) {
      console.error("Failed to load icons:", err);
    }
  }, [viewMode, activeCollection]);

  // Initial load
  useEffect(() => {
    loadCollections();
    loadCounts();
    loadSettings();
  }, [loadCollections, loadCounts, loadSettings]);

  // Reload icons when view changes
  useEffect(() => {
    loadIcons();
  }, [loadIcons]);

  // Filter icons by search
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredIcons(
        icons.filter(
          (icon) =>
            icon.name.toLowerCase().includes(q) ||
            icon.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      );
    } else {
      setFilteredIcons(icons);
    }
  }, [searchQuery, icons]);

  // Keep detailIcon in sync with data
  useEffect(() => {
    if (detailIcon) {
      const updated = icons.find((i) => i.id === detailIcon.id);
      if (updated) setDetailIcon(updated);
    }
  }, [icons, detailIcon]);

  // ── Handlers ───────────────────────────────────────────────

  function handleSelectView(mode: ViewMode) {
    setViewMode(mode);
    setActiveCollection(null);
    setDetailIcon(null);
    setSelectedIcon(null);
  }

  function handleSelectCollection(id: string) {
    setViewMode("collection");
    setActiveCollection(id);
    setDetailIcon(null);
    setSelectedIcon(null);
  }

  function handleSelectIcon(icon: Icon) {
    setSelectedIcon(icon);
    setDetailIcon(icon);
  }

  function handleOpenDetail(icon: Icon) {
    setDetailIcon(icon);
    setSelectedIcon(icon);
  }

  async function handleImportFolder(parentId?: string) {
    try {
      const col = await invoke<Collection>("import_folder", { parentId: parentId || null });
      await loadCollections();
      await loadCounts();
      setViewMode("collection");
      setActiveCollection(col.id);
    } catch (err) {
      console.error("Failed to import folder:", err);
    }
  }

  async function handleCreateCollection(name: string, parentId?: string) {
    try {
      await invoke("create_collection", { name, parentId: parentId || null });
      await loadCollections();
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  }

  async function handleRenameCollection(id: string, newName: string) {
    try {
      await invoke("rename_collection", { id, newName });
      await loadCollections();
    } catch (err) {
      console.error("Failed to rename collection:", err);
    }
  }

  async function handleDeleteCollection(id: string) {
    try {
      await invoke("delete_collection", { id });
      if (activeCollection === id) {
        setViewMode("all");
        setActiveCollection(null);
      }
      await loadCollections();
      await loadCounts();
      await loadIcons();
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  }

  async function handleToggleFavorite(iconId: string) {
    try {
      await invoke("toggle_favorite", { iconId });
      await loadIcons();
      await loadCounts();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }

  async function handleUpdateTags(iconId: string, tags: string[]) {
    try {
      await invoke("update_icon_tags", { iconId, tags });
      await loadIcons();
    } catch (err) {
      console.error("Failed to update tags:", err);
    }
  }

  async function handleDeleteIcon(iconId: string) {
    try {
      await invoke("delete_icon", { iconId });
      if (detailIcon?.id === iconId) setDetailIcon(null);
      if (selectedIcon?.id === iconId) setSelectedIcon(null);
      await loadIcons();
      await loadCounts();
      await loadCollections(); // refresh counts
    } catch (err) {
      console.error("Failed to delete icon:", err);
    }
  }

  async function handleSaveSetting(key: string, value: string) {
    try {
      await invoke("save_setting", { key, value });
      await loadSettings();
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  }

  // ── Breadcrumb ─────────────────────────────────────────────

  function getBreadcrumb(): string[] {
    if (viewMode === "all") return ["All Icons"];
    if (viewMode === "favorites") return ["Favorites"];

    const crumbs: string[] = [];
    let current = collections.find((c) => c.id === activeCollection);
    while (current) {
      crumbs.unshift(current.name);
      current = collections.find((c) => c.id === current!.parent_id);
    }
    return crumbs.length > 0 ? crumbs : ["Collection"];
  }

  const breadcrumb = getBreadcrumb();

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] p-2">
      {/* Left Sidebar */}
      <Sidebar
        collections={collections}
        activeCollection={activeCollection}
        viewMode={viewMode}
        totalIconCount={totalIconCount}
        favoriteCount={favoriteCount}
        onSelectCollection={handleSelectCollection}
        onSelectView={handleSelectView}
        onImportFolder={handleImportFolder}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
        {/* Header */}
        <header className="h-12 px-6 flex items-center gap-4 border-b border-[var(--border)] flex-shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            iconCount={filteredIcons.length}
          />
        </header>

        {/* Icon Grid */}
        <IconGrid
          icons={filteredIcons}
          selectedIcon={selectedIcon}
          onSelectIcon={handleSelectIcon}
          onOpenDetail={handleOpenDetail}
          tintColor={settings.tint_color}
          iconSize={settings.icon_size}
        />

        {/* Breadcrumb */}
        <div className="h-8 px-6 flex items-center border-t border-[var(--border)] flex-shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className={i === breadcrumb.length - 1 ? "text-[var(--text-secondary)]" : ""}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Right Detail Panel */}
      {detailIcon && (
        <DetailPanel
          icon={detailIcon}
          onClose={() => {
            setDetailIcon(null);
            setSelectedIcon(null);
          }}
          onToggleFavorite={handleToggleFavorite}
          onUpdateTags={handleUpdateTags}
          onDeleteIcon={handleDeleteIcon}
          tintColor={settings.tint_color}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSetting}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
