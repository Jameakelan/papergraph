#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
from typing import Iterable

DEFAULT_DB = Path(__file__).resolve().parent.parent / "library" / "db" / "papers.db"


def list_projects(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.execute(
        "SELECT id, name, description, bib_text_path, created_at FROM projects ORDER BY created_at"
    )
    rows = cur.fetchall()
    if not rows:
        print("No projects found.")
        return
    for row in rows:
        line = f"{row['id']}"
        if row["name"]:
            line += f" | {row['name']}"
        print(line)
        if row["description"]:
            print(f"  desc: {row['description']}")
        if row["bib_text_path"]:
            print(f"  bib: {row['bib_text_path']}")
        print(f"  created: {row['created_at']}")


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="List projects from the papers database")
    parser.add_argument(
        "--db",
        default=str(DEFAULT_DB),
        help="Path to SQLite database",
    )
    args = parser.parse_args(argv)
    list_projects(Path(args.db))


if __name__ == "__main__":
    main()
