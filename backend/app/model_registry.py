from __future__ import annotations

from pathlib import Path
import logging
from typing import Any, Optional

import joblib


LOGGER = logging.getLogger(__name__)
MODEL_HANDLE: Optional[Any] = None
MODEL_STATUS = {
    "loaded": False,
    "path": "",
    "error": "",
}


def load_model_once(model_path: str) -> None:
    global MODEL_HANDLE

    resolved = Path(model_path).resolve()
    MODEL_STATUS["path"] = str(resolved)

    if MODEL_HANDLE is not None:
        MODEL_STATUS["loaded"] = True
        MODEL_STATUS["error"] = ""
        return

    if not resolved.exists():
        MODEL_STATUS["loaded"] = False
        MODEL_STATUS["error"] = "model file not found"
        return

    try:
        MODEL_HANDLE = joblib.load(resolved)
        MODEL_STATUS["loaded"] = True
        MODEL_STATUS["error"] = ""
    except Exception as exc:
        LOGGER.exception("Failed to load model from %s", resolved)
        MODEL_STATUS["loaded"] = False
        MODEL_STATUS["error"] = str(exc)


def get_model_status() -> dict:
    return dict(MODEL_STATUS)
