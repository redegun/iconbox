use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use crate::{Collection, Icon};

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
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon_count INTEGER DEFAULT 0,
            color TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS icons (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT,
            svg_content TEXT NOT NULL,
            tags TEXT,
            collection_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            favorite INTEGER DEFAULT 0,
            FOREIGN KEY (collection_id) REFERENCES collections(id)
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_icons_collection ON icons(collection_id)",
        [],
    )?;
    
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

pub fn get_all_collections(app: &AppHandle) -> Result<Vec<Collection>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, icon_count, color, created_at FROM collections ORDER BY name"
        )?;
        
        let collections = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                icon_count: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
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
            "INSERT INTO collections (id, name, icon_count, color, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &collection.id,
                &collection.name,
                &collection.icon_count.to_string(),
                &collection.color,
                &collection.created_at,
            ],
        )?;
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

pub fn get_icons_by_collection(app: &AppHandle, collection_id: &str) -> Result<Vec<Icon>> {
    with_db(app, |conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, path, svg_content, tags, collection_id, created_at, favorite 
             FROM icons WHERE collection_id = ?1 ORDER BY name"
        )?;
        
        let icons = stmt.query_map([collection_id], |row| {
            let tags_str: String = row.get(4)?;
            let tags: Vec<String> = if tags_str.is_empty() {
                vec![]
            } else {
                tags_str.split(',').map(|s| s.to_string()).collect()
            };
            
            Ok(Icon {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                svg_content: row.get(3)?,
                tags,
                collection_id: row.get(5)?,
                created_at: row.get(6)?,
                favorite: row.get::<_, i32>(7)? == 1,
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
            "INSERT INTO icons (id, name, path, svg_content, tags, collection_id, created_at, favorite) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            [
                &icon.id,
                &icon.name,
                &icon.path,
                &icon.svg_content,
                &tags_str,
                &icon.collection_id,
                &icon.created_at,
                &(if icon.favorite { "1" } else { "0" }).to_string(),
            ],
        )?;
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
