"""Compatibility wrapper for legacy imports.

Primary prediction flow now lives in model.predict_crop_and_profit.
"""

from __future__ import annotations

from typing import Dict

from .model import predict_crop_and_profit


def build_recommendations(*, soil: str, season: str, city: str, state: str) -> Dict[str, object]:
    return predict_crop_and_profit(
        {
            "soil": soil,
            "season": season,
            "city": city,
            "state": state,
        }
    )
