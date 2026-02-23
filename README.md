# IconBox 📦

Менеджер иконок для Windows (и других платформ) на Tauri + React.

## Фичи

✅ **Реализовано:**
- Коллекции иконок
- Импорт папки с SVG
- Поиск по имени
- Drag & Drop в другие приложения
- Избранное
- SQLite для хранения метаданных
- Тёмная тема

🚧 **В планах:**
- Теги и автотегирование
- Синхронизация через облако (Яндекс.Диск, WebDAV)
- Экспорт в PNG разных размеров
- Смена цвета SVG
- AI-поиск иконок

## Разработка

```bash
# Установить зависимости
npm install

# Запуск в dev режиме
npm run tauri dev

# Сборка
npm run tauri build
```

## Требования

- Node.js 18+
- Rust (установится автоматически)
- Windows 7+ / macOS 10.11+ / Linux

## Структура

```
├── src/                    # React frontend
│   ├── components/
│   │   ├── Sidebar.tsx     # Боковая панель
│   │   ├── IconGrid.tsx    # Сетка иконок
│   │   ├── IconCard.tsx    # Карточка иконки
│   │   └── SearchBar.tsx   # Поиск
│   ├── App.tsx
│   └── types.ts
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri команды
│   │   ├── db.rs           # SQLite
│   │   └── main.rs
│   └── Cargo.toml
└── package.json
```

## Лицензия

MIT
