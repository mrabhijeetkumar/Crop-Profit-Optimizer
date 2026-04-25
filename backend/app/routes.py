from datetime import datetime, timezone
from collections import defaultdict, deque
import logging
import os
import re
import time
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
import requests

from .model import (
    DEFAULT_PRICE_PER_QUINTAL,
    LOWER_STATE_LOOKUP,
    STATE_DISTRICTS,
    predict_crop_and_profit,
)
from .model_registry import get_model_status
from .utils import normalize_text


bp = Blueprint("main", __name__)
LOGGER = logging.getLogger(__name__)
FRONTEND_INDEX = Path(__file__).resolve().parents[2] / "frontend" / "index.html"

MANDI_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
MANDI_CACHE_TTL_SECONDS = 300
MANDI_CACHE = {}
MANDI_CROP_SYNONYMS = {
    "rice": {"rice", "paddy", "dhan"},
    "wheat": {"wheat", "gehun"},
    "maize": {"maize", "corn", "makka"},
    "cotton": {"cotton", "kapas"},
    "soyabean": {"soyabean", "soybean", "soya"},
    "tomato": {"tomato"},
    "onion": {"onion", "pyaj"},
    "gram": {"gram", "chana", "bengal gram"},
    "moong": {"moong", "mung", "green gram"},
    "arhar/tur": {"arhar", "tur", "pigeon pea", "pigeonpea"},
}

RATE_LIMIT_WINDOW_SECONDS = 60
PREDICT_RATE_LIMIT = 120
CHAT_RATE_LIMIT = 30
_RATE_LIMIT_BUCKETS = defaultdict(deque)
TELEMETRY_MAX_EVENTS = 1000
TELEMETRY_EVENTS = deque(maxlen=TELEMETRY_MAX_EVENTS)


def _config_value(name):
    value = current_app.config.get(name)
    if isinstance(value, str) and value.strip():
        return value.strip()

    env_value = os.getenv(name, "")
    return str(env_value).strip()


def _build_chat_prompt(message, history, context=None, preference=None):
    preference = preference or {}
    context = context or {}
    response_mode = str(preference.get("mode", "balanced")).strip().lower()
    language = str(preference.get("language", "hinglish")).strip().lower()

    style_hint = {
        "quick": "Respond in 4-6 concise bullet points.",
        "detailed": "Respond with a short diagnosis, a table-style action plan, and a risk section.",
        "balanced": "Respond with short actionable bullets and 1 practical caution.",
    }.get(response_mode, "Respond with short actionable bullets and 1 practical caution.")

    language_hint = {
        "hindi": "Reply in Hindi (Devanagari) with simple farmer-friendly words.",
        "english": "Reply in clear English.",
        "hinglish": "Reply in Hinglish (Hindi + English words) for easy readability.",
    }.get(language, "Reply in Hinglish (Hindi + English words) for easy readability.")

    system_context = (
        "You are a reliable AI assistant for Indian users with strong agriculture expertise. "
        "When a user asks farming questions, provide practical, ground-level guidance on crop planning, mandi prices, "
        "soil-season suitability, and profitability. "
        "When the question is non-farming, still answer helpfully and clearly. "
        "Avoid hallucinations: if uncertain, state assumptions briefly and suggest how to verify. "
        "Never provide medical, legal, or financial guarantees. "
        "If farming input details are missing for a specific recommendation, ask for state, district, season, and soil type."
    )

    history_lines = []
    for item in history[-8:]:
        role = str(item.get("role", "user")).strip().lower()
        content = str(item.get("content", "")).strip()
        if not content:
            continue
        label = "User" if role == "user" else "Assistant"
        history_lines.append(f"{label}: {content}")

    history_block = "\n".join(history_lines)
    if not history_block:
        history_block = "No prior conversation."

    top_recommendation = {}
    if isinstance(context, dict):
        recommendations = context.get("recommendations", [])
        if isinstance(recommendations, list) and recommendations:
            top_recommendation = recommendations[0] if isinstance(recommendations[0], dict) else {}

    context_block = (
        f"Latest dashboard context: state={context.get('state', '-')}, district={context.get('district', '-')}, "
        f"season={context.get('season', '-')}, top_crop={top_recommendation.get('crop', '-')}, "
        f"top_profit={top_recommendation.get('profit', '-')}, risk={top_recommendation.get('risk_level', '-')}"
        if isinstance(context, dict) and context
        else "Latest dashboard context: not available."
    )

    return (
        f"{system_context}\n\n"
        f"Response style: {style_hint}\n"
        f"Language preference: {language_hint}\n\n"
        f"{context_block}\n\n"
        f"Conversation history:\n{history_block}\n\n"
        f"User question: {message}\n"
        "Assistant response:"
    )


def _call_gemini_chat(prompt):
    gemini_key = _config_value("GEMINI_API_KEY")
    if not gemini_key:
        return None

    # Try multiple model ids because availability varies by project/region.
    model_ids = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
    ]

    body = {
        "systemInstruction": {
            "parts": [
                {
                    "text": "You are a concise, trustworthy assistant. Prefer practical and accurate answers."
                }
            ]
        },
        "contents": [
            {
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.9,
            "maxOutputTokens": 700,
        },
    }

    for model_id in model_ids:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
        params = {"key": gemini_key}

        try:
            response = requests.post(url, params=params, json=body, timeout=30)
            response.raise_for_status()
        except requests.RequestException:
            LOGGER.warning("Gemini request failed for model '%s'", model_id)
            continue

        payload = response.json()

        candidates = payload.get("candidates", []) or []
        for candidate in candidates:
            parts = candidate.get("content", {}).get("parts", []) or []
            text_chunks = [str(item.get("text", "")).strip() for item in parts if str(item.get("text", "")).strip()]
            text = "\n".join(text_chunks).strip()
            if text:
                return text

    return None


def _call_openai_chat(prompt):
    openai_key = _config_value("OPENAI_API_KEY")
    if not openai_key:
        return None

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
    }

    response = requests.post(url, headers=headers, json=body, timeout=20)
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    return str(message.get("content", "")).strip() or None


def _local_chat_fallback(message):
    question = str(message or "").strip()
    if not question:
        question = "general farming guidance"

    return (
        "AI service is temporarily unavailable, but here is practical guidance: "
        f"For '{question}', verify local mandi modal price, estimate per-acre cost, "
        "and choose crops with stronger margin under current season and soil. "
        "If you share state, district, season, and soil type, I can give a tighter crop plan."
    )


def _format_local_chat_context(context):
    if not isinstance(context, dict) or not context:
        return ""

    recommendations = context.get("recommendations", [])
    if not isinstance(recommendations, list) or not recommendations:
        return ""

    top_recommendations = [item for item in recommendations[:3] if isinstance(item, dict)]
    if not top_recommendations:
        return ""

    location_bits = []
    for key in ("state", "district", "season", "soil"):
        value = str(context.get(key, "")).strip()
        if value:
            location_bits.append(f"{key.title()}: {value}")

    lines = []
    if location_bits:
        lines.append("Current plan context: " + "; ".join(location_bits))

    lines.append("Top crop options from your latest analysis:")
    for item in top_recommendations:
        crop = str(item.get("crop", "Crop")).strip()
        profit = float(item.get("profit", 0) or 0)
        risk_level = str(item.get("risk_level", "Unknown")).strip()
        price_source = str(item.get("price_source", "fallback")).strip()
        market_price = item.get("market_price", item.get("expected_price", "N/A"))
        lines.append(
            f"- {crop}: expected profit INR {int(round(profit)):,}, risk {risk_level}, "
            f"price {market_price} ({price_source})"
        )

    return "\n".join(lines)


def _is_price_question(message):
    text = normalize_text(message)
    return any(term in text for term in ("price", "mandi", "market rate", "rate", "modal price"))


def _is_crop_recommendation_question(message):
    text = normalize_text(message)
    return any(term in text for term in ("best crop", "which crop", "recommend", "suggest crop", "crop plan"))


def _build_local_chat_reply(message, context=None):
    question = str(message or "").strip()
    if not question:
        question = "general farming guidance"

    context_block = _format_local_chat_context(context)
    response_parts = []

    if context_block:
        response_parts.append(context_block)

    if _is_price_question(question):
        response_parts.append(
            "For price checks, use the latest mandi modal price for your district, then compare it with cultivation cost and transport. If you share the crop name plus state and district, I can narrow it further."
        )
    elif _is_crop_recommendation_question(question):
        response_parts.append(
            "For crop selection, prefer the crop with the best mix of profit, climate fit, and lower risk from the latest analysis. If you want, I can turn this into a short sowing plan."
        )
    else:
        response_parts.append(
            "Share state, district, season, soil type, and crop goal. I can then give a practical crop plan, risk note, and mandi-price aware advice."
        )

    if not context_block:
        response_parts.append(_local_chat_fallback(question))

    return "\n\n".join(response_parts)


def _json_response(payload, status_code=200):
    response = jsonify(payload)
    response.status_code = status_code
    return response


def _client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _check_rate_limit(bucket_name, limit):
    now = time.time()
    key = f"{bucket_name}:{_client_ip()}"
    bucket = _RATE_LIMIT_BUCKETS[key]

    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= limit:
        return False

    bucket.append(now)
    return True


def _safe_price_value(value):
    if value in (None, ""):
        return None

    cleaned = re.sub(r"[^\d.]", "", str(value))
    if not cleaned:
        return None

    try:
        return int(float(cleaned))
    except ValueError:
        return None


def _normalize_crop(value):
    return normalize_text(str(value or "")).replace("-", " ").strip()


def _extract_prices(records):
    prices = []
    for item in records:
        commodity = str(item.get("commodity", "")).strip()
        if not commodity:
            continue

        parsed_min = _safe_price_value(item.get("min_price"))
        parsed_max = _safe_price_value(item.get("max_price"))
        parsed_modal = _safe_price_value(item.get("modal_price"))

        prices.append(
            {
                "crop": commodity,
                "min_price": parsed_min,
                "max_price": parsed_max,
                "modal_price": parsed_modal,
            }
        )
    return prices


def _matches_crop_filter(commodity_name, requested_crop):
    crop_normalized = _normalize_crop(requested_crop)
    if not crop_normalized:
        return True

    commodity_normalized = _normalize_crop(commodity_name)
    synonyms = MANDI_CROP_SYNONYMS.get(crop_normalized, {crop_normalized})

    return any(token in commodity_normalized for token in synonyms)


def _fallback_mandi_prices(state, district, crop=None):
    normalized_crop = _normalize_crop(crop)
    selected_crops = []

    if normalized_crop:
        selected_crops = [normalized_crop]
    else:
        selected_crops = list(DEFAULT_PRICE_PER_QUINTAL.keys())[:8]

    prices = []
    for crop_name in selected_crops:
        modal_price = int(DEFAULT_PRICE_PER_QUINTAL.get(crop_name, 2200))
        prices.append(
            {
                "crop": crop_name.title(),
                "min_price": max(0, modal_price - 200),
                "max_price": modal_price + 200,
                "modal_price": modal_price,
            }
        )

    return {
        "ok": True,
        "state": state,
        "district": district,
        "crop": crop,
        "total": len(prices),
        "prices": prices,
        "source": "fallback",
        "cached": False,
    }


def _collect_predict_input():
    if request.method == "GET":
        return {
            "soil": request.args.get("soil", ""),
            "season": request.args.get("season", ""),
            "city": request.args.get("city", request.args.get("district", "")),
            "state": request.args.get("state", ""),
        }

    if request.is_json:
        body = request.get_json(silent=True)
        if body is None:
            return None
        return {
            "soil": body.get("soil", ""),
            "season": body.get("season", ""),
            "city": body.get("city", body.get("district", "")),
            "state": body.get("state", ""),
        }

    form_payload = request.form.to_dict(flat=True)
    return {
        "soil": form_payload.get("soil", ""),
        "season": form_payload.get("season", ""),
        "city": form_payload.get("city", form_payload.get("district", "")),
        "state": form_payload.get("state", ""),
    }


@bp.route("/")
def index():
    if FRONTEND_INDEX.exists():
        return send_file(FRONTEND_INDEX)

    return _json_response(
        {
            "ok": True,
            "service": "AI Crop Profit Optimization API",
            "docs": {
                "health": "/api/health",
                "states": "/api/states",
                "districts": "/api/districts/<state_name>",
                "predict": "/predict",
                "mandi_prices": "/mandi-prices",
                "chat": "/chat",
                "telemetry_events": "/api/telemetry/events",
                "telemetry_summary": "/api/telemetry/summary",
            },
        }
    )


@bp.route("/api/health", methods=["GET"])
def api_health():
    model_status = get_model_status()
    return jsonify(
        {
            "ok": True,
            "service": "AI Crop Profit Optimization API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model": model_status,
        }
    )


@bp.route("/api/states", methods=["GET"])
def api_states():
    data = [
        {"name": state, "district_count": len(districts)}
        for state, districts in sorted(STATE_DISTRICTS.items(), key=lambda item: item[0])
    ]
    return jsonify({"ok": True, "total": len(data), "states": data})


@bp.route("/api/public-meta", methods=["GET"])
def api_public_meta():
    total_states = len(STATE_DISTRICTS)
    total_districts = sum(len(districts) for districts in STATE_DISTRICTS.values())
    return jsonify(
        {
            "ok": True,
            "total_states": total_states,
            "total_districts": total_districts,
        }
    )


@bp.route("/api/districts/<state_name>", methods=["GET"])
def api_districts(state_name):
    canonical_state = LOWER_STATE_LOOKUP.get(normalize_text(state_name))
    if not canonical_state:
        return jsonify({"ok": False, "error": "state not found"}), 404

    districts = sorted(STATE_DISTRICTS.get(canonical_state, []))
    return jsonify(
        {
            "ok": True,
            "state": canonical_state,
            "district_count": len(districts),
            "districts": districts,
        }
    )


@bp.route("/predict", methods=["GET", "POST"])
def predict():
    if not _check_rate_limit("predict", PREDICT_RATE_LIMIT):
        return _json_response({"ok": False, "errors": ["Too many requests. Please retry shortly."]}, 429)

    input_data = _collect_predict_input()
    if input_data is None:
        return _json_response({"ok": False, "errors": ["Invalid JSON payload"]}, 400)

    try:
        payload = predict_crop_and_profit(input_data)
    except Exception:
        LOGGER.exception("Prediction route failed")
        return _json_response({"ok": False, "errors": ["Prediction engine failure"]}, 500)

    if not payload.get("ok"):
        return _json_response(payload, 400)

    return _json_response(payload, 200)


@bp.route("/api/predict", methods=["GET", "POST"])
def api_predict_compat():
    return predict()


@bp.route("/api/crops/weather", methods=["GET", "POST"])
def api_crops_weather_compat():
    return predict()


@bp.route("/mandi-prices", methods=["GET"])
def mandi_prices():
    state = str(request.args.get("state", "")).strip()
    district = str(request.args.get("district", "")).strip()
    crop = str(request.args.get("crop", "")).strip()

    if not state or not district:
        return _json_response(
            {"ok": False, "errors": ["state and district are required"]},
            400,
        )

    api_key = os.getenv("MANDI_API_KEY", "DEMO_KEY").strip()
    params = {
        "api-key": api_key,
        "format": "json",
        "limit": 1000,
        "filters[state]": state.title(),
        "filters[district]": district.title(),
    }

    cache_key = f"{state.strip().lower()}|{district.strip().lower()}|{crop.strip().lower()}"
    now = time.time()
    cached = MANDI_CACHE.get(cache_key)
    if cached and now - float(cached.get("time", 0)) < MANDI_CACHE_TTL_SECONDS:
        return _json_response(cached.get("payload", {}), 200)

    try:
        response = requests.get(MANDI_URL, params=params, timeout=10)
        if response.status_code in (401, 403):
            LOGGER.warning("Mandi API access denied (status=%s). Using fallback prices.", response.status_code)
            return _json_response(_fallback_mandi_prices(state, district, crop), 200)
        response.raise_for_status()
        payload = response.json()
        records = payload.get("records", []) or []
    except requests.RequestException as exc:
        LOGGER.warning("Mandi prices API fetch failed (%s). Using fallback prices.", exc.__class__.__name__)
        return _json_response(_fallback_mandi_prices(state, district, crop), 200)

    source = "district"
    if not records:
        fallback_params = {
            "api-key": api_key,
            "format": "json",
            "limit": 1000,
            "filters[state]": state.title(),
        }
        try:
            fallback_response = requests.get(MANDI_URL, params=fallback_params, timeout=10)
            if fallback_response.status_code in (401, 403):
                LOGGER.warning("Mandi state fallback API denied (status=%s).", fallback_response.status_code)
                records = []
                fallback_payload = {}
            else:
                fallback_response.raise_for_status()
                fallback_payload = fallback_response.json()
                records = fallback_payload.get("records", []) or []
            source = "state_fallback"
        except requests.RequestException as exc:
            LOGGER.warning("Mandi prices fallback API fetch failed (%s).", exc.__class__.__name__)
            records = []

    prices = _extract_prices(records)
    if crop:
        prices = [item for item in prices if _matches_crop_filter(item.get("crop"), crop)]

    response_payload = {
        "ok": True,
        "state": state,
        "district": district,
        "crop": crop,
        "total": len(prices),
        "prices": prices,
        "source": source,
        "cached": False,
    }

    MANDI_CACHE[cache_key] = {
        "time": now,
        "payload": response_payload,
    }

    return _json_response(response_payload, 200)


@bp.route("/chat", methods=["POST"])
def chat():
    if not _check_rate_limit("chat", CHAT_RATE_LIMIT):
        return _json_response({"ok": False, "errors": ["Too many chat requests. Please wait a moment."]}, 429)

    if not request.is_json:
        return _json_response({"ok": False, "errors": ["JSON payload required"]}, 400)

    body = request.get_json(silent=True)
    if body is None:
        return _json_response({"ok": False, "errors": ["Invalid JSON payload"]}, 400)

    message = str(body.get("message", "")).strip()
    history = body.get("history", [])
    context = body.get("context", {})
    preference = body.get("preference", {})

    if not message:
        return _json_response({"ok": False, "errors": ["message is required"]}, 400)
    if not isinstance(history, list):
        history = []
    history = history[-12:]

    if not isinstance(context, dict):
        context = {}
    if not isinstance(preference, dict):
        preference = {}

    prompt = _build_chat_prompt(message, history, context, preference)

    provider = "none"
    try:
        reply = _call_gemini_chat(prompt)
        if reply:
            provider = "gemini"
        if not reply:
            reply = _call_openai_chat(prompt)
            if reply:
                provider = "openai"
    except requests.RequestException:
        LOGGER.exception("Chat provider request failed")
        reply = None

    if not reply:
        reply = _build_local_chat_reply(message, context)
        provider = "fallback"

    return _json_response({"ok": True, "reply": reply, "provider": provider}, 200)


@bp.route("/api/telemetry/events", methods=["POST"])
def telemetry_events():
    if not request.is_json:
        return _json_response({"ok": False, "errors": ["JSON payload required"]}, 400)

    body = request.get_json(silent=True)
    if body is None:
        return _json_response({"ok": False, "errors": ["Invalid JSON payload"]}, 400)

    event_type = str(body.get("event_type", "")).strip().lower()
    metadata = body.get("metadata", {})
    if not event_type:
        return _json_response({"ok": False, "errors": ["event_type is required"]}, 400)
    if not isinstance(metadata, dict):
        metadata = {}

    item = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip": _client_ip(),
        "metadata": metadata,
    }
    TELEMETRY_EVENTS.append(item)

    return _json_response({"ok": True, "stored": True, "total": len(TELEMETRY_EVENTS)}, 202)


@bp.route("/api/telemetry/summary", methods=["GET"])
def telemetry_summary():
    event_counts = defaultdict(int)
    latency_by_prefix = defaultdict(list)

    for event in TELEMETRY_EVENTS:
        event_type = str(event.get("event_type", "unknown"))
        event_counts[event_type] += 1

        metadata = event.get("metadata", {})
        if not isinstance(metadata, dict):
            continue

        latency = metadata.get("latency_ms")
        if latency is None:
            continue

        try:
            latency_value = int(latency)
        except (TypeError, ValueError):
            continue

        prefix = event_type.split("_")[0]
        latency_by_prefix[prefix].append(latency_value)

    avg_latency = {}
    for prefix, values in latency_by_prefix.items():
        if not values:
            continue
        avg_latency[prefix] = round(sum(values) / len(values), 2)

    return _json_response(
        {
            "ok": True,
            "total_events": len(TELEMETRY_EVENTS),
            "events_by_type": dict(sorted(event_counts.items())),
            "average_latency_ms": dict(sorted(avg_latency.items())),
        },
        200,
    )
