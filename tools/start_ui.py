#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import time
from pathlib import Path
from typing import Iterable

UI_DIR = Path(__file__).resolve().parent.parent / "ui"
DEFAULT_PID_FILE = UI_DIR / ".ui-dev.pid"
DEFAULT_LOG_FILE = Path("/tmp/ui-dev.log")


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=UI_DIR, check=True)


def ensure_install(skip_install: bool) -> None:
    if skip_install:
        return
    if (UI_DIR / "node_modules").exists():
        return
    run(["npm", "install"])


def is_pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def read_pid(pid_file: Path) -> int | None:
    if not pid_file.exists():
        return None
    try:
        return int(pid_file.read_text().strip())
    except ValueError:
        return None


def remove_pid_file(pid_file: Path) -> None:
    if pid_file.exists():
        pid_file.unlink()


def stop_dev(pid_file: Path, timeout: float = 10.0) -> None:
    pid = read_pid(pid_file)
    if not pid:
        remove_pid_file(pid_file)
        raise SystemExit("No running UI dev server found (missing or invalid PID).")
    if not is_pid_alive(pid):
        remove_pid_file(pid_file)
        raise SystemExit("Removed stale PID file; no running UI dev server found.")

    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        remove_pid_file(pid_file)
        raise SystemExit("Removed stale PID file; no running UI dev server found.")

    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if not is_pid_alive(pid):
            remove_pid_file(pid_file)
            print("Stopped UI dev server.")
            return
        time.sleep(0.2)

    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        remove_pid_file(pid_file)
        print("Stopped UI dev server.")
        return

    for _ in range(10):
        if not is_pid_alive(pid):
            remove_pid_file(pid_file)
            print("Stopped UI dev server.")
            return
        time.sleep(0.2)

    raise SystemExit("Failed to stop UI dev server; process still running.")


def start_dev(
    host: str | None,
    port: int,
    skip_install: bool,
    background: bool,
    pid_file: Path,
    log_file: Path,
) -> None:
    existing_pid = read_pid(pid_file)
    if existing_pid:
        if is_pid_alive(existing_pid):
            raise SystemExit(f"UI dev server already running with PID {existing_pid}.")
        remove_pid_file(pid_file)

    ensure_install(skip_install)

    cmd = ["npm", "run", "dev", "--", "--port", str(port)]
    if host:
        cmd.extend(["--host", host])

    if background:
        pid_file.parent.mkdir(parents=True, exist_ok=True)
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with log_file.open("ab") as log_handle:
            process = subprocess.Popen(
                cmd,
                cwd=UI_DIR,
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        pid_file.write_text(str(process.pid))
        print(
            f"Started UI dev server in background (PID {process.pid}). "
            f"PID file: {pid_file} Log: {log_file}"
        )
        return

    run(cmd)


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Start or stop the UI dev server",
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
    parser.add_argument(
        "--background",
        action="store_true",
        help="Run the dev server in the background and write a PID file",
    )
    parser.add_argument(
        "--stop",
        action="store_true",
        help="Stop a background UI dev server using the PID file",
    )
    parser.add_argument(
        "--pid-file",
        type=Path,
        default=DEFAULT_PID_FILE,
        help="Path to PID file for background mode",
    )
    parser.add_argument(
        "--log-file",
        type=Path,
        default=DEFAULT_LOG_FILE,
        help="Path to log file for background mode",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.stop:
        stop_dev(args.pid_file)
        return

    start_dev(
        args.host,
        args.port,
        args.skip_install,
        args.background,
        args.pid_file,
        args.log_file,
    )


if __name__ == "__main__":
    main()
