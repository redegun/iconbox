export interface Icon {
  id: string;
  name: string;
  path: string;
  svg_content: string;
  tags: string[];
  collection_id: string;
  created_at: string;
  file_size: number;
  favorite: boolean;
}

export interface Collection {
  id: string;
  name: string;
  parent_id: string | null;
  icon_count: number;
  color: string;
  created_at: string;
}

export interface Settings {
  theme: string;
  icon_size: number;
  tint_color: string | null;
}

export type ViewMode = "all" | "favorites" | "collection";

export interface ContextMenuState {
  x: number;
  y: number;
  type: "sidebar" | "icon" | "collection";
  targetId?: string;
}
