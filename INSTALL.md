# Installation

## Prerequisites
- Python 3.9+
- Optional: Graphviz CLI (`dot`) if you want to render `.dot` files to images.

## Setup
1. Create a virtual environment (recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the database (creates `library/db/papers.db` and folders as needed):
   ```bash
   python3 paper_db.py init
   ```

## Usage quickstart
- Add or import papers, link them, and export graphs using `paper_db.py` CLI (see `python3 paper_db.py --help`).
- Helper tools live in `tools/`:
  - `build_graph.py` / `project_graph.py` to export graphs (JSON/DOT) to `library/graph/`.
  - `build_bib.py` to export BibTeX files (default `library/bibtex/`).
  - `build_link.py` to create relationships between papers.

## Notes
- Default paths:
  - Database: `library/db/papers.db`
  - Graph exports: `library/graph/`
  - BibTeX exports: `library/bibtex/`
- Graphviz is only needed if you want to render `.dot` files to images (e.g., `dot -Tpng ...`).
