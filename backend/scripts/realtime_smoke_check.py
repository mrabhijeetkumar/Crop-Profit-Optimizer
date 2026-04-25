"""Realtime contract smoke checks for frontend-backend integration.

Usage:
    python scripts/realtime_smoke_check.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def _expect(condition: bool, message: str) -> tuple[bool, str]:
    return condition, message


def _get_json(response):
    return response.get_json(silent=True) or {}


def main() -> int:
    from app import create_app

    app = create_app()
    client = app.test_client()

    checks: list[tuple[bool, str]] = []

    health = client.get("/api/health")
    health_body = _get_json(health)
    checks.append(_expect(health.status_code == 200 and health_body.get("ok") is True, "GET /api/health should return ok=true"))

    states = client.get("/api/states")
    states_body = _get_json(states)
    checks.append(_expect(states.status_code == 200 and isinstance(states_body.get("states"), list) and len(states_body.get("states", [])) > 0, "GET /api/states should return non-empty states list"))

    districts = client.get("/api/districts/Punjab")
    districts_body = _get_json(districts)
    checks.append(_expect(districts.status_code == 200 and isinstance(districts_body.get("districts"), list) and len(districts_body.get("districts", [])) > 0, "GET /api/districts/Punjab should return districts"))

    predict_payload = {
        "state": "Punjab",
        "district": "Ludhiana",
        "city": "Ludhiana",
        "season": "rabi",
        "soil": "alluvial",
    }
    predict = client.post("/predict", json=predict_payload)
    predict_body = _get_json(predict)
    recommendations = predict_body.get("recommendations", []) if isinstance(predict_body, dict) else []
    checks.append(_expect(predict.status_code == 200 and predict_body.get("ok") is True and isinstance(recommendations, list) and len(recommendations) > 0, "POST /predict should return recommendation list"))

    mandi = client.get("/mandi-prices?state=Punjab&district=Ludhiana")
    mandi_body = _get_json(mandi)
    checks.append(_expect(mandi.status_code == 200 and mandi_body.get("ok") is True and isinstance(mandi_body.get("prices"), list), "GET /mandi-prices should return prices array"))

    chat_payload = {
        "message": "best crop for punjab rabi season",
        "history": [],
        "context": {
            "state": "Punjab",
            "district": "Ludhiana",
            "season": "Rabi",
            "soil": "Alluvial",
            "recommendations": recommendations[:3],
        },
        "preference": {"mode": "balanced", "language": "hinglish"},
    }
    chat = client.post("/chat", json=chat_payload)
    chat_body = _get_json(chat)
    checks.append(_expect(chat.status_code == 200 and chat_body.get("ok") is True and isinstance(chat_body.get("reply"), str) and chat_body.get("reply"), "POST /chat should return non-empty reply"))

    telemetry_event = client.post(
        "/api/telemetry/events",
        json={
            "event_type": "predict_success",
            "metadata": {"latency_ms": 321, "fallback_ratio": 0.0},
        },
    )
    telemetry_event_body = _get_json(telemetry_event)
    checks.append(_expect(telemetry_event.status_code == 202 and telemetry_event_body.get("ok") is True, "POST /api/telemetry/events should accept event"))

    telemetry_summary = client.get("/api/telemetry/summary")
    telemetry_summary_body = _get_json(telemetry_summary)
    checks.append(_expect(telemetry_summary.status_code == 200 and telemetry_summary_body.get("ok") is True and isinstance(telemetry_summary_body.get("events_by_type"), dict), "GET /api/telemetry/summary should return aggregates"))

    failed = [message for ok, message in checks if not ok]

    for ok, message in checks:
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {message}")

    if failed:
        print("\nRealtime smoke check failed:")
        print(json.dumps(failed, indent=2))
        return 1

    print("\nRealtime smoke check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
