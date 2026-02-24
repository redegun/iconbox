use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::{Collection, Icon, Settings};

pub struct DbState(pub Mutex<Connection>);

pub fn get_app_data_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
}

pub fn init_db(app: &AppHandle) -> Result<()> {
    let data_dir = get_app_data_dir(app);
    std::fs::create_dir_all(&data_dir).expect("Failed to create data dir");

    let db_path = data_dir.join("iconbox.db");
    let conn = Connection::open(&db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT,
            icon_count INTEGER DEFAULT 0,
            color TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS icons (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT,
            svg_content TEXT NOT NULL,
            tags TEXT DEFAULT '',
            collection_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            favorite INTEGER DEFAULT 0,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_icons_collection ON icons(collection_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_icons_favorite ON icons(favorite)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // Migrate: add parent_id column if missing (for existing databases)
    let has_parent_id: bool = conn
        .prepare("SELECT COUNT(*) FROM pragma_table_info('collections') WHERE name='parent_id'")?
        .query_row([], |row| row.get::<_, i32>(0))
        .map(|c| c > 0)
        .unwrap_or(false);
    if !has_parent_id {
        let _ = conn.execute("ALTER TABLE collections ADD COLUMN parent_id TEXT", []);
    }

    // Migrate: add file_size column if missing
    let has_file_size: bool = conn
        .prepare("SELECT COUNT(*) FROM pragma_table_info('icons') WHERE name='file_size'")?
        .query_row([], |row| row.get::<_, i32>(0))
        .map(|c| c > 0)
        .unwrap_or(false);
    if !has_file_size {
        let _ = conn.execute("ALTER TABLE icons ADD COLUMN file_size INTEGER DEFAULT 0", []);
    }

    app.manage(DbState(Mutex::new(conn)));
    Ok(())
}

pub fn with_db<F, T>(app: &AppHandle, f: F) -> Result<T>
where
    F: FnOnce(&Connection) -> Result<T>,
{
    let state = app.state::<DbState>();
    let conn = state.0.lock().unwrap();
    f(&conn)
}

// ── Collections ──────────────────────────────────────────────

pub fn get_all_collections(app: &AppHandle) -> Result<Vec<Collection>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, parent_id, icon_count, color, created_at FROM collections ORDER BY name",
        )?;

        let collections = stmt
            .query_map([], |row| {
                let parent_id: Option<String> = row.get(2)?;
                Ok(Collection {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    parent_id,
                    icon_count: row.get(3)?,
                    color: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(collections)
    })
}

pub fn insert_collection(app: &AppHandle, collection: &Collection) -> Result<()> {
    with_db(app, |conn| {
        conn.execute(
            "INSERT INTO collections (id, name, parent_id, icon_count, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                collection.id,
                collection.name,
                collection.parent_id,
                collection.icon_count,
                collection.color,
                collection.created_at,
            ],
        )?;
        Ok(())
    })
}

pub fn rename_collection(app: &AppHandle, id: &str, new_name: &str) -> Result<()> {
    with_db(app, |conn| {
        conn.execute(
            "UPDATE collections SET name = ?1 WHERE id = ?2",
            [new_name, id],
        )?;
        Ok(())
    })
}

pub fn delete_collection(app: &AppHandle, id: &str) -> Result<()> {
    with_db(app, |conn| {
        // Delete icons belonging to this collection
        conn.execute("DELETE FROM icons WHERE collection_id = ?1", [id])?;
        // Delete subcollections (and their icons) recursively via a CTE
        conn.execute(
            "WITH RECURSIVE sub(id) AS (
                SELECT id FROM collections WHERE parent_id = ?1
                UNION ALL
                SELECT c.id FROM collections c JOIN sub s ON c.parent_id = s.id
            )
            DELETE FROM icons WHERE collection_id IN (SELECT id FROM sub)",
            [id],
        )?;
        conn.execute(
            "WITH RECURSIVE sub(id) AS (
                SELECT id FROM collections WHERE parent_id = ?1
                UNION ALL
                SELECT c.id FROM collections c JOIN sub s ON c.parent_id = s.id
            )
            DELETE FROM collections WHERE id IN (SELECT id FROM sub)",
            [id],
        )?;
        conn.execute("DELETE FROM collections WHERE id = ?1", [id])?;
        Ok(())
    })
}

pub fn update_collection_count(app: &AppHandle, id: &str, count: i32) -> Result<()> {
    with_db(app, |conn| {
        conn.execute(
            "UPDATE collections SET icon_count = ?1 WHERE id = ?2",
            [&count.to_string(), id],
        )?;
        Ok(())
    })
}

// ── Icons ────────────────────────────────────────────────────

pub fn get_icons_by_collection(app: &AppHandle, collection_id: &str) -> Result<Vec<Icon>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, path, svg_content, tags, collection_id, created_at, file_size, favorite
             FROM icons WHERE collection_id = ?1 ORDER BY name",
        )?;

        let icons = stmt
            .query_map([collection_id], |row| {
                let tags_str: String = row.get(4)?;
                let tags: Vec<String> = if tags_str.is_empty() {
                    vec![]
                } else {
                    tags_str.split(',').map(|s| s.trim().to_string()).collect()
                };

                Ok(Icon {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    svg_content: row.get(3)?,
                    tags,
                    collection_id: row.get(5)?,
                    created_at: row.get(6)?,
                    file_size: row.get(7)?,
                    favorite: row.get::<_, i32>(8)? == 1,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(icons)
    })
}

pub fn get_all_icons(app: &AppHandle) -> Result<Vec<Icon>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, path, svg_content, tags, collection_id, created_at, file_size, favorite
             FROM icons ORDER BY name",
        )?;

        let icons = stmt
            .query_map([], |row| {
                let tags_str: String = row.get(4)?;
                let tags: Vec<String> = if tags_str.is_empty() {
                    vec![]
                } else {
                    tags_str.split(',').map(|s| s.trim().to_string()).collect()
                };

                Ok(Icon {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    svg_content: row.get(3)?,
                    tags,
                    collection_id: row.get(5)?,
                    created_at: row.get(6)?,
                    file_size: row.get(7)?,
                    favorite: row.get::<_, i32>(8)? == 1,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(icons)
    })
}

pub fn get_favorite_icons(app: &AppHandle) -> Result<Vec<Icon>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, path, svg_content, tags, collection_id, created_at, file_size, favorite
             FROM icons WHERE favorite = 1 ORDER BY name",
        )?;

        let icons = stmt
            .query_map([], |row| {
                let tags_str: String = row.get(4)?;
                let tags: Vec<String> = if tags_str.is_empty() {
                    vec![]
                } else {
                    tags_str.split(',').map(|s| s.trim().to_string()).collect()
                };

                Ok(Icon {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    path: row.get(2)?,
                    svg_content: row.get(3)?,
                    tags,
                    collection_id: row.get(5)?,
                    created_at: row.get(6)?,
                    file_size: row.get(7)?,
                    favorite: row.get::<_, i32>(8)? == 1,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(icons)
    })
}

pub fn insert_icon(app: &AppHandle, icon: &Icon) -> Result<()> {
    with_db(app, |conn| {
        let tags_str = icon.tags.join(",");
        conn.execute(
            "INSERT INTO icons (id, name, path, svg_content, tags, collection_id, created_at, file_size, favorite)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                icon.id,
                icon.name,
                icon.path,
                icon.svg_content,
                tags_str,
                icon.collection_id,
                icon.created_at,
                icon.file_size,
                if icon.favorite { 1 } else { 0 },
            ],
        )?;
        Ok(())
    })
}

pub fn delete_icon(app: &AppHandle, icon_id: &str) -> Result<()> {
    with_db(app, |conn| {
        conn.execute("DELETE FROM icons WHERE id = ?1", [icon_id])?;
        Ok(())
    })
}

pub fn toggle_favorite(app: &AppHandle, icon_id: &str) -> Result<bool> {
    with_db(app, |conn| {
        conn.execute(
            "UPDATE icons SET favorite = 1 - favorite WHERE id = ?1",
            [icon_id],
        )?;

        let mut stmt = conn.prepare("SELECT favorite FROM icons WHERE id = ?1")?;
        let favorite: i32 = stmt.query_row([icon_id], |row| row.get(0))?;
        Ok(favorite == 1)
    })
}

pub fn update_icon_tags(app: &AppHandle, icon_id: &str, tags: &[String]) -> Result<()> {
    with_db(app, |conn| {
        let tags_str = tags.join(",");
        conn.execute(
            "UPDATE icons SET tags = ?1 WHERE id = ?2",
            [&tags_str, icon_id],
        )?;
        Ok(())
    })
}

// ── Settings ─────────────────────────────────────────────────

pub fn get_settings(app: &AppHandle) -> Result<Settings> {
    with_db(app, |conn| {
        let get = |key: &str, default: &str| -> String {
            conn.prepare("SELECT value FROM settings WHERE key = ?1")
                .and_then(|mut s| s.query_row([key], |row| row.get(0)))
                .unwrap_or_else(|_| default.to_string())
        };

        Ok(Settings {
            theme: get("theme", "light"),
            icon_size: get("icon_size", "64").parse().unwrap_or(64),
            tint_color: {
                let v = get("tint_color", "");
                if v.is_empty() { None } else { Some(v) }
            },
        })
    })
}

pub fn save_setting(app: &AppHandle, key: &str, value: &str) -> Result<()> {
    with_db(app, |conn| {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            [key, value],
        )?;
        Ok(())
    })
}

// ── Stats ────────────────────────────────────────────────────

pub fn get_total_icon_count(app: &AppHandle) -> Result<i32> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM icons")?;
        let count: i32 = stmt.query_row([], |row| row.get(0))?;
        Ok(count)
    })
}

pub fn get_favorite_count(app: &AppHandle) -> Result<i32> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM icons WHERE favorite = 1")?;
        let count: i32 = stmt.query_row([], |row| row.get(0))?;
        Ok(count)
    })
}
