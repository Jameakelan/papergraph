#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path
from typing import Iterable, Optional

DEFAULT_DB = Path(__file__).resolve().parent.parent / "library" / "db" / "papers.db"
DEFAULT_BIB_DIR = Path(__file__).resolve().parent.parent / "library" / "bibtex"


def resolve_output_path(conn: sqlite3.Connection, project_id: Optional[str], out_path: Optional[Path]) -> Path:
    if out_path:
        return out_path
    if project_id:
        row = conn.execute("SELECT bib_text_path FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            raise SystemExit(f"Project not found: {project_id}")
        if row[0]:
            return Path(row[0])
        return DEFAULT_BIB_DIR / f"{project_id}.bib"
    return DEFAULT_BIB_DIR / "all.bib"


def export_bib(conn: sqlite3.Connection, project_id: Optional[str], out_path: Optional[Path]) -> Path:
    target = resolve_output_path(conn, project_id, out_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    params = {}
    where = ""
    if project_id:
        where = " WHERE project_id = :pid"
        params["pid"] = project_id
    rows = conn.execute(
        f"SELECT bibtex FROM papers{where} AND bibtex IS NOT NULL" if where else "SELECT bibtex FROM papers WHERE bibtex IS NOT NULL",
        params,
    ).fetchall()

    entries = [r[0] for r in rows if r[0]]
    content = "\n\n".join(entries) + ("\n" if entries else "")
    target.write_text(content, encoding="utf-8")
    print(f"Wrote {len(entries)} BibTeX entries to {target}")
    return target


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Build BibTeX file(s) from papers table, optionally per project.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--project-id",
        action="append",
        help="Project ID to export (repeatable). If omitted, exports all BibTeX entries.",
    )
    parser.add_argument(
        "--out",
        help="Explicit output file (only if a single project or no project is specified)",
    )
    parser.add_argument("--db", default=str(DEFAULT_DB), help="Path to SQLite database")
    args = parser.parse_args(argv)

    projects = args.project_id or [None]
    if args.out and len(projects) != 1:
        raise SystemExit("--out can only be used with a single project or no project")

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    out_path = Path(args.out) if args.out else None
    for proj in projects:
        export_bib(conn, proj, out_path if len(projects) == 1 else None)


if __name__ == "__main__":
    main()
