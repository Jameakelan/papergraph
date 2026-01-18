#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Iterable

PAPER_DB = Path(__file__).resolve().parent.parent / "paper_db.py"


def build_for_project(project_id: str | None) -> None:
    cmd = [sys.executable, str(PAPER_DB), "export"]
    if project_id:
        cmd.extend(["--project-id", project_id])
    subprocess.run(cmd, check=True)


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Build graph exports for one or more projects.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--project-id",
        action="append",
        help="Project ID to export (repeatable). If omitted, exports full graph only.",
    )
    args = parser.parse_args(argv)

    projects = args.project_id or [None]
    for proj in projects:
        build_for_project(proj)


if __name__ == "__main__":
    main()
