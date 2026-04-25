"""Weather intelligence helpers with mock weather data."""

from __future__ import annotations

import os
import time
from typing import Dict, List

import requests


DEFAULT_WEATHER = {
    "temperature": 32,
    "humidity": 60,
    "rainfall": 5,
}

WEATHER_CACHE: Dict[str, Dict[str, object]] = {}
CACHE_TTL_SECONDS = 600


def get_weather_data(city: str) -> Dict[str, int]:
    normalized_city = (city or "").strip().lower()
    now = time.time()

    if normalized_city in WEATHER_CACHE:
        cached_entry = WEATHER_CACHE[normalized_city]
        timestamp = float(cached_entry.get("timestamp", 0))
        if now - timestamp < CACHE_TTL_SECONDS:
            cached_data = cached_entry.get("data")
            if isinstance(cached_data, dict):
                return {
                    "temperature": int(cached_data.get("temperature", DEFAULT_WEATHER["temperature"])),
                    "humidity": int(cached_data.get("humidity", DEFAULT_WEATHER["humidity"])),
                    "rainfall": int(cached_data.get("rainfall", DEFAULT_WEATHER["rainfall"])),
                }

    api_key = os.getenv("WEATHER_API_KEY", "").strip()
    if not api_key or not normalized_city:
        return dict(DEFAULT_WEATHER)

    try:
        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "q": city,
                "appid": api_key,
                "units": "metric",
            },
            timeout=5,
        )
        response.raise_for_status()
        payload = response.json()

        temperature = int(round(float(payload.get("main", {}).get("temp", DEFAULT_WEATHER["temperature"]))))
        humidity = int(round(float(payload.get("main", {}).get("humidity", DEFAULT_WEATHER["humidity"]))))
        rainfall = int(round(float(payload.get("rain", {}).get("1h", 0))))

        weather_data = {
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
        }

        WEATHER_CACHE[normalized_city] = {
            "timestamp": now,
            "data": weather_data,
        }
        return weather_data
    except Exception:
        return dict(DEFAULT_WEATHER)


def _clamp_risk(value: float) -> float:
    return round(max(0.0, min(1.0, value)), 2)


def _rainfall_risk(crop: str, rainfall: int) -> float:
    preferred_rainfall_ranges = {
        "rice": (50, 120),
        "watermelon": (10, 35),
        "cucumber": (10, 35),
        "tomato": (15, 40),
        "onion": (10, 30),
        "cotton": (35, 80),
        "soybean": (30, 70),
        "maize": (25, 60),
        "wheat": (15, 40),
        "barley": (10, 35),
        "mustard": (10, 30),
        "chickpea": (10, 30),
        "bajra": (10, 35),
    }

    low, high = preferred_rainfall_ranges.get(crop.lower(), (20, 50))

    if rainfall < low:
        mismatch = low - rainfall
    elif rainfall > high:
        mismatch = rainfall - high
    else:
        mismatch = 0

    return min(0.7, mismatch / 100)


def filter_crops_by_weather(
    crops: Dict[str, List[str]], weather_data: Dict[str, int]
) -> List[Dict[str, float | str]]:
    ordered_crops = crops.get("primary", []) + crops.get("secondary", [])
    unique_crops = list(dict.fromkeys(ordered_crops))

    rainfall = weather_data.get("rainfall", 0)
    temperature = weather_data.get("temperature", 0)

    recommendations: List[Dict[str, float | str]] = []

    for crop in unique_crops:
        risk = _rainfall_risk(crop, rainfall)

        if temperature > 35 and crop.lower() == "wheat":
            risk += 0.3
        elif temperature < 15 and crop.lower() in {"cotton", "soybean"}:
            risk += 0.2

        recommendations.append({"crop": crop, "risk": _clamp_risk(risk)})

    return recommendations
