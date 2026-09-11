#!/usr/bin/env python3
"""Serve the local game and accept teaching recordings from teach.html."""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEACHING_DATA = ROOT / "training" / "data" / "teaching"
SAVE_PATH = "/api/teaching-recordings"
MAX_RECORDING_BYTES = 1_000_000_000
SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+\.json$")


class TurnarchistHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json_response(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if self.path != SAVE_PATH:
            self._json_response(404, {"error": "Unknown local endpoint"})
            return

        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            length = -1
        if length <= 0 or length > MAX_RECORDING_BYTES:
            self._json_response(413, {"error": "Recording size is missing or unsupported"})
            return

        requested_name = self.headers.get("X-Turnarchist-Filename", "")
        if not SAFE_NAME.fullmatch(requested_name) or requested_name in {".", ".."}:
            self._json_response(400, {"error": "Invalid recording filename"})
            return

        TEACHING_DATA.mkdir(parents=True, exist_ok=True)
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb", prefix=".teaching-", suffix=".tmp", dir=TEACHING_DATA, delete=False
            ) as temporary:
                temporary_path = Path(temporary.name)
                remaining = length
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise ValueError("Recording upload ended early")
                    temporary.write(chunk)
                    remaining -= len(chunk)

            with temporary_path.open("r", encoding="utf-8") as recording_file:
                recording = json.load(recording_file)
            if not isinstance(recording, dict) or not isinstance(recording.get("meta"), dict):
                raise ValueError("Recording is missing metadata")
            if not isinstance(recording.get("records"), list):
                raise ValueError("Recording is missing actions")

            destination = TEACHING_DATA / requested_name
            os.replace(temporary_path, destination)
            temporary_path = None
            self._json_response(
                201,
                {
                    "saved": True,
                    "name": requested_name,
                    "actions": len(recording["records"]),
                    "relativePath": f"training/data/teaching/{requested_name}",
                },
            )
        except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as error:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            self._json_response(400, {"error": str(error)})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), TurnarchistHandler)
    print(f"Turnarchist local server: http://127.0.0.1:{args.port}", flush=True)
    print(f"Teaching data: {TEACHING_DATA}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
