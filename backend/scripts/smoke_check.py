"""Basic deployment smoke checks for Flask routes.

Usage:
    python scripts/smoke_check.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def _check(client, method: str, path: str, payload: dict[str, Any] | None = None) -> tuple[bool, str]:
    if method == "GET":
        response = client.get(path)
    else:
        response = client.post(path, json=payload)

    ok = response.status_code < 400
    body = response.get_json(silent=True) or {}
    body_keys = sorted(body.keys())
    details = f"{method} {path} -> {response.status_code}; keys={body_keys[:6]}"
    return ok, details


def main() -> int:
    from app import create_app

    app = create_app()
    client = app.test_client()

    checks = [
        ("GET", "/api/health", None),
        ("GET", "/api/states", None),
        ("GET", "/api/public-meta", None),
        ("GET", "/api/districts/Punjab", None),
        (
            "GET",
            "/predict?soil=Alluvial&season=Kharif&city=Ludhiana&state=Punjab",
            None,
        ),
        (
            "POST",
            "/chat",
            {
                "message": "best crop for punjab rabi?",
                "context": {"state": "Punjab", "district": "Ludhiana", "season": "Rabi"},
            },
        ),
    ]

    failed = []
    for method, path, payload in checks:
        ok, details = _check(client, method, path, payload)
        print(details)
        if not ok:
            failed.append(details)

    if failed:
        print("\nSmoke check failed:")
        print(json.dumps(failed, indent=2))
        return 1

    print("\nSmoke check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
