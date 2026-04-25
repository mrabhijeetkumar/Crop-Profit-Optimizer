"""Backward-compatible helpers for profit calculations.

Unified prediction flow lives in model.predict_crop_and_profit.
"""

from __future__ import annotations

from typing import Dict, Optional

from .model import AVERAGE_COST_PER_CROP, AVERAGE_YIELD_PER_HECTARE, DEFAULT_PRICE_PER_QUINTAL


def _normalize(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def get_market_price(crop: str, state: Optional[str] = None) -> int:
    del state
    return int(DEFAULT_PRICE_PER_QUINTAL.get(_normalize(crop), 2000))


def calculate_profit(
    crop: str,
    price: Optional[int] = None,
    risk: float = 0.0,
    state: Optional[str] = None,
) -> Dict[str, float | str | int | None]:
    del state
    crop_key = _normalize(crop)
    market_price = int(price) if price is not None else get_market_price(crop)

    avg_yield = int(AVERAGE_YIELD_PER_HECTARE.get(crop_key, 2500))
    avg_cost = int(AVERAGE_COST_PER_CROP.get(crop_key, 22000))

    profit = (avg_yield * market_price / 100) - avg_cost
    adjusted_profit = profit * (1 - risk)

    return {
        "crop": crop,
        "profit": round(adjusted_profit, 2),
        "raw_profit": round(profit, 2),
        "risk": risk,
        "expected_price": market_price,
    }
