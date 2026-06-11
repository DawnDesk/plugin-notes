# plugin-notes — Agent Context

> This AGENTS.md lives at the root of `dawndesk/plugin-notes`.
> Read `agents/AGENTS.md` and `agents/PLUGIN.md` first for shared rules.

---

## What this plugin does

A clean, fast note-taking app with Markdown support and AI writing assistance.
Users can create, edit, search, and organize notes. The AI can create and search notes on the user's behalf.

---

## Data model

All data stored via `useDawnDesk().setData` / `getData`.

```typescript
// Key: "notes"
interface Note {
  id: string;           // uuid
  title: string;
  content: string;      // Markdown
  tags: string[];
  createdAt: string;    // ISO 8601
  updatedAt: string;
  pinned: boolean;
}

// Key: "preferences"
interface NotesPreferences {
  defaultView: 'list' | 'grid';
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortDir: 'asc' | 'desc';
}
```

---

## AI tools

| Tool | Description | Required params | Optional params |
|---|---|---|---|
| `create_note` | Creates a new note | `title`, `content` | `tags` |
| `search_notes` | Full-text search across notes | `query` | `limit` (default 5) |
| `update_note` | Updates an existing note's content | `id`, `content` | `title`, `tags` |
| `delete_note` | Deletes a note by ID | `id` | — |
| `list_notes` | Lists recent or pinned notes | — | `pinned_only`, `limit` |

---

## Frontend structure

```
src/
├── App.tsx                   ← <PluginPanel> + layout (NoteList + NoteEditor side-by-side)
├── components/
│   ├── NoteList/             ← Scrollable list of note cards, search bar at top
│   ├── NoteEditor/           ← Markdown editor (uses CodeMirror or similar)
│   ├── NoteCard/             ← Preview card in the list
│   └── TagFilter/            ← Tag pill filter UI
├── store/
│   └── notesStore.ts         ← Zustand: loaded notes, active note, search query
└── hooks/
    └── useNotes.ts           ← CRUD operations via useDawnDesk() IPC
```

---

## Sidecar structure

```
src-sidecar/
├── main.rs                   ← stdin/stdout JSON-lines loop + dispatch()
├── lib.rs                    ← ToolCall, ToolResult structs
├── store.rs                  ← Reads/writes note JSON from plugin data dir
└── handlers/
    └── notes.rs              ← create_note, search_notes, update_note, delete_note, list_notes
```

The sidecar reads the notes JSON file directly from the plugin data directory (passed via env var `DAWNDESK_PLUGIN_DATA_DIR` by the host on sidecar spawn). It does not use IPC for data access — it has direct filesystem access to its own data directory.

---

## Known constraints

- Note content is stored as Markdown strings — no binary attachments
- Search is simple substring match in the sidecar (no full-text index needed for MVP)
- The sidecar receives `DAWNDESK_PLUGIN_DATA_DIR` env var pointing to its data directory
- Max note size: 1 MB (soft limit, enforced in frontend)