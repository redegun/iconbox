use serde::{Deserialize, Serialize};
use std::fs;
use uuid::Uuid;

mod db;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Icon {
    pub id: String,
    pub name: String,
    pub path: String,
    pub svg_content: String,
    pub tags: Vec<String>,
    pub collection_id: String,
    pub created_at: String,
    pub file_size: i64,
    pub favorite: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub icon_count: i32,
    pub color: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub theme: String,
    pub icon_size: i32,
    pub tint_color: Option<String>,
}

// ── Collection commands ──────────────────────────────────────

#[tauri::command]
async fn get_collections(app: tauri::AppHandle) -> Result<Vec<Collection>, String> {
    db::get_all_collections(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_collection(
    app: tauri::AppHandle,
    name: String,
    parent_id: Option<String>,
) -> Result<Collection, String> {
    let collection = Collection {
        id: Uuid::new_v4().to_string(),
        name,
        parent_id,
        icon_count: 0,
        color: random_color(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    db::insert_collection(&app, &collection).map_err(|e| e.to_string())?;
    Ok(collection)
}

#[tauri::command]
async fn rename_collection(
    app: tauri::AppHandle,
    id: String,
    new_name: String,
) -> Result<(), String> {
    db::rename_collection(&app, &id, &new_name).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_collection(app: tauri::AppHandle, id: String) -> Result<(), String> {
    db::delete_collection(&app, &id).map_err(|e| e.to_string())
}

// ── Icon commands ────────────────────────────────────────────

#[tauri::command]
async fn get_icons(app: tauri::AppHandle, collection_id: String) -> Result<Vec<Icon>, String> {
    db::get_icons_by_collection(&app, &collection_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_icons(app: tauri::AppHandle) -> Result<Vec<Icon>, String> {
    db::get_all_icons(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_favorite_icons(app: tauri::AppHandle) -> Result<Vec<Icon>, String> {
    db::get_favorite_icons(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn toggle_favorite(app: tauri::AppHandle, icon_id: String) -> Result<bool, String> {
    db::toggle_favorite(&app, &icon_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_icon_tags(
    app: tauri::AppHandle,
    icon_id: String,
    tags: Vec<String>,
) -> Result<(), String> {
    db::update_icon_tags(&app, &icon_id, &tags).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_icon(app: tauri::AppHandle, icon_id: String) -> Result<(), String> {
    db::delete_icon(&app, &icon_id).map_err(|e| e.to_string())
}

// ── Import ───────────────────────────────────────────────────

#[tauri::command]
async fn import_folder(app: tauri::AppHandle, parent_id: Option<String>) -> Result<Collection, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog().file().blocking_pick_folder();

    let folder_path = folder.ok_or("No folder selected")?;
    let folder_path = folder_path.as_path().ok_or("Invalid path")?;

    let folder_name = folder_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Imported")
        .to_string();

    let collection = Collection {
        id: Uuid::new_v4().to_string(),
        name: folder_name,
        parent_id,
        icon_count: 0,
        color: random_color(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    db::insert_collection(&app, &collection).map_err(|e| e.to_string())?;

    // Scan for SVG files
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(folder_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |e| e == "svg") {
                if let Ok(content) = fs::read_to_string(&path) {
                    let file_size = fs::metadata(&path).map(|m| m.len() as i64).unwrap_or(0);
                    let icon = Icon {
                        id: Uuid::new_v4().to_string(),
                        name: path
                            .file_stem()
                            .and_then(|n| n.to_str())
                            .unwrap_or("icon")
                            .to_string(),
                        path: path.to_string_lossy().to_string(),
                        svg_content: content,
                        tags: vec![],
                        collection_id: collection.id.clone(),
                        created_at: chrono::Utc::now().to_rfc3339(),
                        file_size,
                        favorite: false,
                    };
                    if db::insert_icon(&app, &icon).is_ok() {
                        count += 1;
                    }
                }
            }
        }
    }

    db::update_collection_count(&app, &collection.id, count).map_err(|e| e.to_string())?;

    let mut updated = collection;
    updated.icon_count = count;
    Ok(updated)
}

// ── Settings ─────────────────────────────────────────────────

#[tauri::command]
async fn get_settings(app: tauri::AppHandle) -> Result<Settings, String> {
    db::get_settings(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_setting(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    db::save_setting(&app, &key, &value).map_err(|e| e.to_string())
}

// ── Stats ────────────────────────────────────────────────────

#[tauri::command]
async fn get_total_icon_count(app: tauri::AppHandle) -> Result<i32, String> {
    db::get_total_icon_count(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_favorite_count(app: tauri::AppHandle) -> Result<i32, String> {
    db::get_favorite_count(&app).map_err(|e| e.to_string())
}

// ── Helpers ──────────────────────────────────────────────────

fn random_color() -> String {
    let colors = [
        "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
        "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
    ];
    colors[rand::random::<usize>() % colors.len()].to_string()
}

// ── App entry ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _ = db::init_db(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_collections,
            create_collection,
            rename_collection,
            delete_collection,
            get_icons,
            get_all_icons,
            get_favorite_icons,
            toggle_favorite,
            update_icon_tags,
            delete_icon,
            import_folder,
            get_settings,
            save_setting,
            get_total_icon_count,
            get_favorite_count,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
