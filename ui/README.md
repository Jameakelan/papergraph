# Paper Graph Viewer (Vite + React)

Interactive UI for exploring the paper relationship graph exported by `paper_db.py`. It loads a `graph.json` containing `nodes` and `links`, renders a force-directed graph, offers filters (search, tags, relation types, relevance, year), smart insights (top tags/relations/years, key nodes), recommendations, and a detail sidebar. The homepage also shows a tabular list of papers read directly from the SQLite DB via `sql.js`.

## Getting started

```bash
cd ui
npm install
npm run dev
```

Open the dev server URL from the terminal output (defaults to `http://localhost:5173`).

## Providing data

### Graph JSON
- The dev server and production build now automatically serve `../library/graph.json` as `/graph.json` if it exists at build/run time.
- To update the data, export again:
```bash
python ../paper_db.py export --json-out ../library/graph.json
```
- You can still manually copy if you prefer:
```bash
cp ../library/graph.json ./public/graph.json
```
- The UI defaults to `/graph.json`, but you can point the "Graph JSON path" input to any reachable URL.

A small sample dataset is preloaded in `public/graph.json` to preview the interface.

### Paper list (SQLite)
- The dev server and production build now automatically serve `../library/papers.db` as `/papers.db` if it exists at build/run time.
- If you prefer a copy, you can still do:
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
