from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Iterable, Optional

DEFAULT_DB = Path(__file__).resolve().parent.parent / "library" / "db" / "papers.db"


def resolve_project_id(conn: sqlite3.Connection, project_id: Optional[str], project_name: Optional[str]) -> Optional[str]:
    if project_id and project_name:
        raise SystemExit("Provide either --project-id or --project-name, not both")
    if project_id:
        row = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not row:
            raise SystemExit(f"Project not found: {project_id}")
        return project_id
    if project_name:
        row = conn.execute("SELECT id FROM projects WHERE name = ?", (project_name,)).fetchone()
        if not row:
            raise SystemExit(f"Project not found by name: {project_name}")
        return row[0]
    return None


def fetch_papers(conn: sqlite3.Connection, project_id: Optional[str]):
    params = {}
    where = ""
    if project_id:
        where = " WHERE project_id = :pid"
        params["pid"] = project_id
    sql = f"""
        SELECT id, paper_id, project_id, title, authors, year, venue, doi, url, database,
               is_duplicated, duplicate_reason, is_excluded, excluded_reason, is_included, included_reason,
               revrieved_sought, sought_not_revrieved, tags
        FROM papers{where}
        ORDER BY id
    """
    return conn.execute(sql, params).fetchall()


def format_row(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in row.keys()}


def print_table(rows: list[sqlite3.Row]) -> None:
    headers = [
        "id",
        "project_id",
        "title",
        "doi",
        "paper_id",
        "database",
        "is_duplicated",
        "duplicate_reason",
        "is_excluded",
        "excluded_reason",
        "is_included",
        "included_reason",
        "revrieved_sought",
        "sought_not_revrieved",
    ]
    print("\t".join(headers))
    for r in rows:
        values = [
            r["id"],
            r["project_id"],
            r["title"],
            r["doi"],
            r["paper_id"],
            r["database"],
            r["is_duplicated"],
            r["duplicate_reason"],
            r["is_excluded"],
            r["excluded_reason"],
            r["is_included"],
            r["included_reason"],
            r["revrieved_sought"],
            r["sought_not_revrieved"],
        ]
        print("\t".join("" if v is None else str(v) for v in values))


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Query papers for a given project (by ID or name).",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--project-id", help="Project ID to filter")
    parser.add_argument("--project-name", help="Project name to filter")
    parser.add_argument("--db", default=str(DEFAULT_DB), help="Path to SQLite database")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of TSV")
    args = parser.parse_args(list(argv) if argv is not None else None)

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    project_id = resolve_project_id(conn, args.project_id, args.project_name)
    rows = fetch_papers(conn, project_id)

    if args.json:
        print(json.dumps([format_row(r) for r in rows], indent=2))
    else:
        print_table(rows)


if __name__ == "__main__":
    main()
