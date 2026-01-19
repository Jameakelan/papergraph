#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from typing import Iterable

UI_DIR = Path(__file__).resolve().parent.parent / "ui"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=UI_DIR, check=True)


def ensure_install(skip_install: bool) -> None:
    if skip_install:
        return
    if (UI_DIR / "node_modules").exists():
        return
    run(["npm", "install"])


def start_dev(host: str | None, port: int, skip_install: bool) -> None:
    ensure_install(skip_install)
    cmd = ["npm", "run", "dev", "--", "--port", str(port)]
    if host:
        cmd.extend(["--host", host])
    run(cmd)


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Start the UI dev server (runs npm install if needed)",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--port", type=int, default=5173, help="Port for Vite dev server")
    parser.add_argument(
        "--host",
        default=None,
        help="Host for Vite dev server (omit to use Vite default)",
    )
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Skip npm install even if node_modules is missing",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)
    start_dev(args.host, args.port, args.skip_install)


if __name__ == "__main__":
    main()
