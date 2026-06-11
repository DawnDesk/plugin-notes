# dawndesk/plugin-notes

> Clean, fast note-taking with Markdown support and AI writing assistance.

This is an official DawnDesk plugin. Install it from the DawnDesk plugin store, or build it from source using the instructions below.

---

## Features

- Markdown editor with live preview
- Folder and tag organisation
- Full-text search
- AI writing assistance (expand, summarise, rewrite)
- AI can create and search notes on your behalf
- Export to PDF or plain text
- Configurable data storage path

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (sidecar — runs inside DawnDesk host) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | @dawndesk/ui |
| Backend | Rust |
| Package manager | pnpm |

---

## Repository structure

```
plugin-notes/
├── src/                          # React frontend
│   ├── App.tsx                   # Root — wrapped in <PluginPanel>
│   ├── main.tsx
│   └── features/                 # Feature-based folder structure
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Sidecar entry point
│   │   ├── commands.rs           # IPC commands and AI tool handlers
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── plugin.manifest.json
├── icon.svg
├── package.json
└── .github/
    └── workflows/
        ├── ci.yml
        └── release.yml
```

---

## Plugin manifest summary

```json
{
  "id": "notes",
  "name": "Notes",
  "category": "productivity",
  "permissions": ["fs:read", "fs:write", "ai:tools", "events:emit"],
  "aiTools": [{"name":"create_note","description":"Create a new note with given title and content"},{"name":"search_notes","description":"Search notes by keyword or semantic query"},{"name":"append_to_note","description":"Append content to an existing note by title"}]
}
```

Full manifest: see [`plugin.manifest.json`](./plugin.manifest.json)

---

## Getting started (development)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust stable (1.77+)
- Tauri CLI: `cargo install tauri-cli`

### Run in development mode

```bash
git clone https://github.com/dawndesk/plugin-notes.git
cd plugin-notes
pnpm install
pnpm tauri dev
```

During development the plugin opens as a standalone Tauri window. The `@dawndesk/ui` IPC bridge falls back to a local mock store so all host calls work without needing DawnDesk running.

### Build

```bash
pnpm tauri build
```

### Test inside DawnDesk

1. Run `pnpm tauri build`
2. Copy the output from `src-tauri/target/release/bundle/` into `{data_dir}/dawndesk/plugins/notes/`
3. Restart DawnDesk — the plugin will appear in the sidebar

---

## Releasing a new version

```bash
git tag v1.2.0
git push origin v1.2.0
```

The `release.yml` workflow builds for all four platforms, packages the plugin archives, generates checksums, creates a GitHub Release, and opens a PR to [`dawndesk/registry`](https://github.com/dawndesk/registry) to update the store index.

---

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

For questions about the plugin system in general, open a discussion in [`dawndesk/dawndesk`](https://github.com/dawndesk/dawndesk/discussions).

---

## License

MIT — see [LICENSE](./LICENSE).
