import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import IconGrid from "./components/IconGrid";
import SearchBar from "./components/SearchBar";
import { Icon, Collection } from "./types";

function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIcons, setFilteredIcons] = useState<Icon[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (activeCollection) {
      loadIcons(activeCollection);
    }
  }, [activeCollection]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          icon.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredIcons(filtered);
    } else {
      setFilteredIcons(icons);
    }
  }, [searchQuery, icons]);

  async function loadCollections() {
    try {
      const cols = await invoke<Collection[]>("get_collections");
      setCollections(cols);
      if (cols.length > 0) {
        setActiveCollection(cols[0].id);
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  }

  async function loadIcons(collectionId: string) {
    try {
      const iconList = await invoke<Icon[]>("get_icons", { collectionId });
      setIcons(iconList);
      setFilteredIcons(iconList);
    } catch (err) {
      console.error("Failed to load icons:", err);
    }
  }

  async function handleImportFolder() {
    try {
      await invoke("import_folder");
      loadCollections();
    } catch (err) {
      console.error("Failed to import folder:", err);
    }
  }

  async function handleCreateCollection(name: string) {
    try {
      await invoke("create_collection", { name });
      loadCollections();
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  }

  return (
    <div className="flex h-screen bg-[#1a1a2e]">
      {/* Sidebar */}
      <Sidebar
        collections={collections}
        activeCollection={activeCollection}
        onSelectCollection={setActiveCollection}
        onImportFolder={handleImportFolder}
        onCreateCollection={handleCreateCollection}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 px-6 flex items-center justify-between border-b border-[#16213e]">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
            {filteredIcons.length} icons
          </div>
        </header>

        {/* Icon Grid */}
        <IconGrid icons={filteredIcons} />
      </main>
    </div>
  );
}

export default App;
