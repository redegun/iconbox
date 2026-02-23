export interface Icon {
  id: string;
  name: string;
  path: string;
  svg_content: string;
  tags: string[];
  collection_id: string;
  created_at: string;
  favorite: boolean;
}

export interface Collection {
  id: string;
  name: string;
  icon_count: number;
  color: string;
  created_at: string;
}
