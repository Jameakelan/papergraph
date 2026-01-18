#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

PAPER_DB = Path(__file__).resolve().parent.parent / "paper_db.py"


def build_project_graph(project_id: str) -> None:
    cmd = [sys.executable, str(PAPER_DB), "export", "--project-id", project_id]
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build graph JSON/DOT for a specific project",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("project_id", help="Target project id")
    args = parser.parse_args()
    build_project_graph(args.project_id)


if __name__ == "__main__":
    main()
