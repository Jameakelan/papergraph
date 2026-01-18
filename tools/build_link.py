#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

PAPER_DB = Path(__file__).resolve().parent.parent / "paper_db.py"


def build_link(source: str, target: str, relation_type: str, note: str | None, db: str | None) -> None:
    cmd = [sys.executable, str(PAPER_DB), "link", "--source", source, "--target", target, "--type", relation_type]
    if note:
        cmd.extend(["--note", note])
    if db:
        cmd.extend(["--db", db])
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a relationship link between two papers (id/DOI/paper_id)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--source", required=True, help="Source paper id/DOI/paper_id")
    parser.add_argument("--target", required=True, help="Target paper id/DOI/paper_id")
    parser.add_argument(
        "--type",
        default="related",
        help="Relationship type (e.g., cites, extends, compares, uses-dataset)",
    )
    parser.add_argument("--note", help="Optional note for the relationship")
    parser.add_argument("--db", help="Path to SQLite database (defaults to paper_db.py default)")
    args = parser.parse_args()

    build_link(args.source, args.target, args.type, args.note, args.db)


if __name__ == "__main__":
    main()
