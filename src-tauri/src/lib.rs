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
    pub favorite: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub icon_count: i32,
    pub color: String,
    pub created_at: String,
}

#[tauri::command]
async fn get_collections(app: tauri::AppHandle) -> Result<Vec<Collection>, String> {
    db::get_all_collections(&app).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_icons(app: tauri::AppHandle, collection_id: String) -> Result<Vec<Icon>, String> {
    db::get_icons_by_collection(&app, &collection_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_collection(app: tauri::AppHandle, name: String) -> Result<Collection, String> {
    let collection = Collection {
        id: Uuid::new_v4().to_string(),
        name,
        icon_count: 0,
        color: random_color(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    db::insert_collection(&app, &collection).map_err(|e| e.to_string())?;
    Ok(collection)
}

#[tauri::command]
async fn import_folder(app: tauri::AppHandle) -> Result<Collection, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let folder = app
        .dialog()
        .file()
        .blocking_pick_folder();
    
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
                    let icon = Icon {
                        id: Uuid::new_v4().to_string(),
                        name: path.file_stem()
                            .and_then(|n| n.to_str())
                            .unwrap_or("icon")
                            .to_string(),
                        path: path.to_string_lossy().to_string(),
                        svg_content: content,
                        tags: vec![],
                        collection_id: collection.id.clone(),
                        created_at: chrono::Utc::now().to_rfc3339(),
                        favorite: false,
                    };
                    if db::insert_icon(&app, &icon).is_ok() {
                        count += 1;
                    }
                }
            }
        }
    }
    
    // Update collection count
    db::update_collection_count(&app, &collection.id, count).map_err(|e| e.to_string())?;
    
    let mut updated = collection;
    updated.icon_count = count;
    Ok(updated)
}

#[tauri::command]
async fn toggle_favorite(app: tauri::AppHandle, icon_id: String) -> Result<bool, String> {
    db::toggle_favorite(&app, &icon_id).map_err(|e| e.to_string())
}

fn random_color() -> String {
    let colors = [
        "#e94560", "#00d9ff", "#00ff88", "#ff6b35", "#a855f7",
        "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6",
    ];
    colors[rand::random::<usize>() % colors.len()].to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database
            let _ = db::init_db(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_collections,
            get_icons,
            create_collection,
            import_folder,
            toggle_favorite,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
