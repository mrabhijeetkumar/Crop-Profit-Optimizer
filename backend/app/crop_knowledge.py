"""Rule-based crop knowledge engine for soil and season suitability."""

from __future__ import annotations

from typing import Dict, List

SOIL_CROP_MAP: Dict[str, Dict[str, List[str]]] = {
    "alluvial": {
        "primary": ["rice", "wheat", "sugarcane", "maize"],
        "secondary": ["lentil", "chickpea", "mustard", "jute"],
    },
    "black": {
        "primary": ["cotton", "soybean", "sorghum", "groundnut"],
        "secondary": ["wheat", "lentil", "sunflower", "chickpea"],
    },
    "red": {
        "primary": ["bajra", "ragi", "groundnut", "cotton"],
        "secondary": ["lentil", "chickpea", "maize", "tobacco"],
    },
    "laterite": {
        "primary": ["tea", "coffee", "cashew", "rubber"],
        "secondary": ["coconut", "bajra", "lentil", "pineapple"],
    },
    "sandy": {
        "primary": ["groundnut", "watermelon", "cucumber", "bajra"],
        "secondary": ["mustard", "cotton", "tomato", "onion"],
    },
    "clay": {
        "primary": ["rice", "wheat", "barley", "mustard"],
        "secondary": ["soybean", "jute", "tomato", "onion"],
    },
    "mountain": {
        "primary": ["barley", "maize", "tea", "potato"],
        "secondary": ["wheat", "apple", "tomato", "onion"],
    },
    "desert": {
        "primary": ["bajra", "guar", "mustard", "barley"],
        "secondary": ["cumin", "cotton", "chickpea", "ragi"],
    },
}

SOIL_ALIASES = {
    "alluvial": "alluvial",
    "black": "black",
    "black (regur)": "black",
    "regur": "black",
    "red": "red",
    "laterite": "laterite",
    "sandy": "sandy",
    "clay": "clay",
    "mountain": "mountain",
    "desert": "desert",
}

SEASON_CROPS: Dict[str, List[str]] = {
    "kharif": ["rice", "maize", "cotton", "soybean", "bajra"],
    "rabi": ["wheat", "barley", "mustard", "chickpea"],
    "zaid": ["watermelon", "cucumber", "tomato", "onion"],
}


def _normalize(value: str) -> str:
    return (value or "").strip().lower()


def get_all_supported_soils() -> List[str]:
    return [
        "Alluvial",
        "Black (Regur)",
        "Red",
        "Laterite",
        "Sandy",
        "Clay",
        "Mountain",
        "Desert",
    ]


def get_suitable_crops(soil_type: str, season: str) -> Dict[str, List[str]]:
    normalized_soil = SOIL_ALIASES.get(_normalize(soil_type))
    normalized_season = _normalize(season)

    if normalized_soil not in SOIL_CROP_MAP:
        return {"primary": [], "secondary": []}

    soil_groups = SOIL_CROP_MAP[normalized_soil]

    if normalized_season not in SEASON_CROPS:
        return {
            "primary": list(soil_groups["primary"]),
            "secondary": list(soil_groups["secondary"]),
        }

    season_set = set(SEASON_CROPS[normalized_season])

    primary = [crop for crop in soil_groups["primary"] if crop in season_set]
    secondary = [crop for crop in soil_groups["secondary"] if crop in season_set]
    combined = primary + secondary

    if len(combined) < 3:
        for crop in soil_groups["primary"] + soil_groups["secondary"]:
            if crop in combined:
                continue
            secondary.append(crop)
            combined.append(crop)
            if len(combined) >= 3:
                break

    if not primary and not secondary:
        return {
            "primary": list(soil_groups["primary"]),
            "secondary": list(soil_groups["secondary"]),
        }

    return {"primary": primary, "secondary": secondary}
