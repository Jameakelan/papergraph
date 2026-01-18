# Research Paper Tracker

A lightweight SQLite-backed CLI to catalog research papers, link them, export graphs, and manage BibTeX per project. Includes helper scripts for graph/BibTeX generation and relationship management.

## Features
- Add or import papers (with PDF text extraction via `pypdf`).
- Track rich metadata: project, identifiers, authors, keywords, tags, methods, metrics, gaps, limitations, future work, relevance, notes, BibTeX, file paths, fulltext.
- Link papers (cites/extends/related/etc.) and auto-annotate edges by shared tags/keywords/authors.
- Export graphs (JSON + Graphviz DOT) globally or per project to `library/graph/`.
- Export BibTeX globally or per project to `library/bibtex/`.
- Project scaffolding: `projects` table with optional `bib_text_path` for per-project BibTeX location.
- Helper tools in `tools/` for graphs, BibTeX, and link creation.

## Quickstart
1. Install dependencies (see `INSTALL.md` for virtualenv instructions):
   ```bash
   pip install -r requirements.txt
   ```
2. Initialize the database:
   ```bash
   python3 paper_db.py init
   ```
3. Import a PDF into a project:
   ```bash
   python3 paper_db.py import-pdf \
     --path /path/to/paper.pdf \
     --project-id demo \
     --paper-id mypaper \
     --relevance high \
     --tag ml --keywords "machine learning" \
     --copy
   ```
4. Link two papers:
   ```bash
   python3 paper_db.py link --source mypaper --target otherpaper --type cites
   ```
5. Export graphs:
   ```bash
   python3 paper_db.py export                 # full graph -> library/graph/graph.json|dot
   python3 paper_db.py export --project-id demo  # -> library/graph/demo.json|dot
   ```
6. Export BibTeX:
   ```bash
   python3 tools/build_bib.py                 # all -> library/bibtex/all.bib
   python3 tools/build_bib.py --project-id demo  # -> library/bibtex/demo.bib
   ```

## Directory layout
- `paper_db.py` — main CLI and schema management.
- `library/db/` — SQLite database (`papers.db`).
- `library/graph/` — graph exports (JSON/DOT).
- `library/bibtex/` — BibTeX exports.
- `library/papers/` — stored PDFs (when using `--copy`).
- `tools/` — helper scripts (`build_graph.py`, `project_graph.py`, `build_bib.py`, `build_link.py`).
- `prompts/` — prompt guidelines (e.g., aligning DB changes with UI).

## Notes
- Graph labels include title, ids, project, year/venue, authors, keywords.
- Edge labels are auto-resolved to `related-tag`, `related-keyword`, or `related-author` when the base type is `related` and fields overlap; otherwise the user-specified type is used.
- Graphviz (`dot`) is optional; needed only to render DOT files to images.
