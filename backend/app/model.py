"""Prediction engine for crop suitability and profitability."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json
import logging
import os
import pickle
from typing import Dict, Iterable, List, Optional

from .crop_knowledge import get_suitable_crops
from .weather_service import filter_crops_by_weather, get_weather_data


LOGGER = logging.getLogger(__name__)

DEFAULT_PRICE_PER_QUINTAL: Dict[str, int] = {
    "rice": 2200,
    "wheat": 2350,
    "sugarcane": 340,
    "maize": 2150,
    "lentil": 6200,
    "chickpea": 5600,
    "mustard": 5800,
    "jute": 5000,
    "cotton": 6800,
    "soybean": 4600,
    "sorghum": 2800,
    "groundnut": 6100,
    "sunflower": 5400,
    "bajra": 2600,
    "ragi": 3500,
    "tobacco": 7200,
    "tea": 4300,
    "coffee": 9200,
    "cashew": 10500,
    "rubber": 14500,
    "coconut": 3200,
    "pineapple": 1900,
    "watermelon": 1700,
    "cucumber": 2100,
    "tomato": 1850,
    "onion": 2250,
    "barley": 2050,
    "potato": 1600,
    "apple": 4300,
    "guar": 5200,
    "cumin": 16000,
}

AVERAGE_YIELD_PER_HECTARE: Dict[str, int] = {
    "rice": 4100,
    "wheat": 3600,
    "sugarcane": 70000,
    "maize": 3300,
    "lentil": 1200,
    "chickpea": 1400,
    "mustard": 1300,
    "jute": 2500,
    "cotton": 2100,
    "soybean": 1700,
    "sorghum": 2300,
    "groundnut": 2200,
    "sunflower": 1700,
    "bajra": 1800,
    "ragi": 1900,
    "tobacco": 2000,
    "tea": 2200,
    "coffee": 1400,
    "cashew": 900,
    "rubber": 1500,
    "coconut": 10000,
    "pineapple": 16000,
    "watermelon": 26000,
    "cucumber": 14000,
    "tomato": 26000,
    "onion": 23000,
    "barley": 2900,
    "potato": 25000,
    "apple": 9000,
    "guar": 1200,
    "cumin": 700,
}

AVERAGE_COST_PER_CROP: Dict[str, int] = {
    "rice": 32000,
    "wheat": 28000,
    "sugarcane": 76000,
    "maize": 27000,
    "lentil": 18000,
    "chickpea": 21000,
    "mustard": 22000,
    "jute": 35000,
    "cotton": 43000,
    "soybean": 26000,
    "sorghum": 20000,
    "groundnut": 30000,
    "sunflower": 24000,
    "bajra": 17000,
    "ragi": 19000,
    "tobacco": 52000,
    "tea": 45000,
    "coffee": 68000,
    "cashew": 56000,
    "rubber": 69000,
    "coconut": 36000,
    "pineapple": 44000,
    "watermelon": 38000,
    "cucumber": 30000,
    "tomato": 42000,
    "onion": 36000,
    "barley": 19000,
    "potato": 46000,
    "apple": 72000,
    "guar": 16000,
    "cumin": 26000,
}


def _normalize_text(value: Optional[str]) -> str:
    text = str(value or "").strip().lower()
    return " ".join(text.split())


def _metadata_path() -> Path:
    return Path(__file__).resolve().parents[1] / "data" / "metadata" / "states_districts.json"


def _load_state_metadata() -> Dict[str, List[str]]:
    metadata_file = _metadata_path()
    if not metadata_file.exists():
        LOGGER.warning("State metadata not found at %s", metadata_file)
        return {}

    try:
        payload = json.loads(metadata_file.read_text(encoding="utf-8"))
    except Exception:
        LOGGER.exception("Unable to parse state metadata file")
        return {}

    states = payload.get("states", []) if isinstance(payload, dict) else []
    mapping: Dict[str, List[str]] = {}

    for item in states:
        if not isinstance(item, dict):
            continue
        state_name = str(item.get("state", "")).strip()
        if not state_name:
            continue
        districts = [str(d).strip() for d in item.get("districts", []) if str(d).strip()]
        mapping[state_name] = sorted(dict.fromkeys(districts))

    return mapping


STATE_DISTRICTS: Dict[str, List[str]] = _load_state_metadata()
LOWER_STATE_LOOKUP: Dict[str, str] = {
    _normalize_text(state_name): state_name for state_name in STATE_DISTRICTS
}


def _risk_level(risk: float) -> str:
    if risk <= 0.2:
        return "Low"
    if risk <= 0.45:
        return "Medium"
    return "High"


def _canonical_district(state_name: str, district_name: str) -> Optional[str]:
    district_lookup = {
        _normalize_text(name): name for name in STATE_DISTRICTS.get(state_name, [])
    }
    return district_lookup.get(_normalize_text(district_name))


def _validation_errors(input_data: Dict[str, object]) -> List[str]:
    errors: List[str] = []

    state = str(input_data.get("state", "")).strip()
    city = str(input_data.get("city", input_data.get("district", ""))).strip()
    season = str(input_data.get("season", "")).strip()
    soil = str(input_data.get("soil", input_data.get("soil_type", ""))).strip()

    if not state:
        errors.append("state is required")
    if not city:
        errors.append("city is required")
    if not season:
        errors.append("season is required")
    if not soil:
        errors.append("soil is required")

    canonical_state = LOWER_STATE_LOOKUP.get(_normalize_text(state))
    if state and not canonical_state:
        errors.append("Unsupported state")

    if city and canonical_state and not _canonical_district(canonical_state, city):
        errors.append("District does not belong to selected state")

    return errors


def _to_recommendations(crops_with_risk: Iterable[Dict[str, float | str]]) -> List[Dict[str, object]]:
    recommendations: List[Dict[str, object]] = []

    for item in crops_with_risk:
        crop_name = str(item.get("crop", "")).strip().lower()
        if not crop_name:
            continue

        risk = max(0.0, min(1.0, float(item.get("risk", 0) or 0)))
        expected_price = int(DEFAULT_PRICE_PER_QUINTAL.get(crop_name, 2000))
        yield_per_hectare = int(AVERAGE_YIELD_PER_HECTARE.get(crop_name, 2500))
        cultivation_cost = int(AVERAGE_COST_PER_CROP.get(crop_name, 24000))

        gross_revenue = (yield_per_hectare / 100.0) * expected_price
        profit = gross_revenue - cultivation_cost
        adjusted_profit = profit * (1 - risk)
        roi = (adjusted_profit / cultivation_cost * 100) if cultivation_cost else 0

        recommendations.append(
            {
                "crop": crop_name.title(),
                "risk": round(risk, 2),
                "risk_level": _risk_level(risk),
                "expected_price": expected_price,
                "market_price": expected_price,
                "cultivation_cost": cultivation_cost,
                "yield_per_hectare": yield_per_hectare,
                "profit": round(adjusted_profit, 2),
                "raw_profit": round(profit, 2),
                "roi": round(roi, 2),
                "price_source": "fallback",
                "explanation": "Estimated using soil-season suitability, weather risk, and regional fallback mandi prices.",
            }
        )

    recommendations.sort(key=lambda rec: float(rec.get("profit", 0)), reverse=True)
    return recommendations[:5]


def predict_crop_and_profit(input_data: Dict[str, object]) -> Dict[str, object]:
    errors = _validation_errors(input_data)
    if errors:
        return {"ok": False, "errors": errors}

    state_raw = str(input_data.get("state", "")).strip()
    city_raw = str(input_data.get("city", input_data.get("district", ""))).strip()
    season = str(input_data.get("season", "")).strip()
    soil = str(input_data.get("soil", input_data.get("soil_type", ""))).strip()

    canonical_state = LOWER_STATE_LOOKUP[_normalize_text(state_raw)]
    canonical_city = _canonical_district(canonical_state, city_raw) or city_raw

    weather = get_weather_data(canonical_city)
    suitable = get_suitable_crops(soil, season)
    weather_adjusted = filter_crops_by_weather(suitable, weather)
    recommendations = _to_recommendations(weather_adjusted)

    if not recommendations:
        return {
            "ok": False,
            "errors": ["No recommendation available for the provided soil and season"],
        }

    return {
        "ok": True,
        "state": canonical_state,
        "district": canonical_city,
        "season": season.title(),
        "soil": soil.title(),
        "weather": weather,
        "recommendations": recommendations,
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "recommendation_count": len(recommendations),
            "price_source": "fallback_only",
        },
    }


def load_model(model_path):
    """Load pre-trained model object from disk if present."""
    try:
        if os.path.exists(model_path):
            with open(model_path, "rb") as file_obj:
                return pickle.load(file_obj)
        LOGGER.warning("Model file not found at %s", model_path)
    except Exception:
        LOGGER.exception("Error loading model from %s", model_path)
    return None


def predict_crop(model, features):
    """Run model prediction with rule-based fallback."""
    if model is None:
        return rule_based_prediction(features)

    try:
        prediction = model.predict([features])
        return prediction[0]
    except Exception:
        LOGGER.exception("Model prediction failed")
        return rule_based_prediction(features)


def rule_based_prediction(features):
    """Simple fallback crop prediction when model is unavailable."""
    n, p, k, temp, humidity, ph, rainfall = features
    del p, ph

    if rainfall > 150:
        return "rice" if temp > 25 else "tea"
    if rainfall < 60:
        return "wheat" if n > 80 else "bajra"
    if temp > 30:
        return "rice" if humidity > 70 else "cotton"
    if temp < 20:
        return "wheat" if n > 70 else "potato"
    if n > 100:
        return "maize"
    if k > 100:
        return "groundnut"
    return "soybean"


def train_model(X_train, y_train):
    """Train a RandomForest model for experimentation."""
    from sklearn.ensemble import RandomForestClassifier

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    return model


def save_model(model, filepath):
    """Save model object to disk."""
    try:
        with open(filepath, "wb") as file_obj:
            pickle.dump(model, file_obj)
        return True
    except Exception:
        LOGGER.exception("Error saving model to %s", filepath)
        return False
