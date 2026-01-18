# Paper Graph Viewer (Vite + React)

Interactive UI for exploring the paper relationship graph exported by `paper_db.py`. It loads a `graph.json` containing `nodes` and `links`, renders a force-directed graph, and offers filters (search, tags, relation types, relevance, year) plus a detail sidebar. The homepage also shows a tabular list of papers read directly from the SQLite DB via `sql.js`.

## Getting started

```bash
cd ui
npm install
npm run dev
```

Open the dev server URL from the terminal output (defaults to `http://localhost:5173`).

## Providing data

### Graph JSON
1) Export the latest graph from the SQLite database:
```bash
python ../paper_db.py export --json-out ../library/graph.json
```
2) Copy or link that file so the UI can read it (default path: `public/graph.json`):
```bash
cp ../library/graph.json ./public/graph.json
```
   Alternatively, enter a different path/URL in the "Graph JSON path" input at the top of the UI.

A small sample dataset is preloaded in `public/graph.json` to preview the interface.

### Paper list (SQLite)
- Copy the database so the browser can read it:
```bash
cp ../library/papers.db ./public/papers.db
```
- Leave the default path `/papers.db` in the UI, or point the "Database path" input to another reachable URL.
- The UI uses `sql.js` (wasm) to query the DB client-side; the wasm file is already included in `public/sql-wasm.wasm`.

## Build for production

```bash
npm run build
```
The static assets will be emitted to `ui/dist`. Serve that directory with any static host.
