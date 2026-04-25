from app import create_app


def test_health_endpoint():
    app = create_app()
    client = app.test_client()

    response = client.get("/api/health")
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["ok"] is True
    assert "timestamp" in payload


def test_weather_recommendation_endpoint_validation():
    app = create_app()
    client = app.test_client()

    response = client.get("/predict")
    assert response.status_code == 400
    payload = response.get_json()
    assert payload["ok"] is False
    assert isinstance(payload.get("errors"), list)


def test_weather_recommendation_endpoint_success():
    app = create_app()
    client = app.test_client()

    response = client.get(
        "/predict?soil=Alluvial&season=Kharif&city=Ludhiana&state=Punjab"
    )
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["ok"] is True
    assert isinstance(payload.get("recommendations"), list)
    assert "weather" in payload


def test_legacy_weather_endpoint_still_works():
    app = create_app()
    client = app.test_client()

    response = client.get(
        "/api/crops/weather?soil=Alluvial&season=Kharif&city=Ludhiana&state=Punjab"
    )
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True


def test_chat_endpoint_validation():
    app = create_app()
    client = app.test_client()

    response = client.post("/chat", json={})
    assert response.status_code == 400
    payload = response.get_json()
    assert payload["ok"] is False
    assert isinstance(payload.get("errors"), list)


def test_chat_endpoint_fallback_provider(monkeypatch):
    from app import routes as app_routes

    monkeypatch.setattr(app_routes, "_call_gemini_chat", lambda prompt: None)
    monkeypatch.setattr(app_routes, "_call_openai_chat", lambda prompt: None)

    app = create_app()
    client = app.test_client()

    response = client.post("/chat", json={"message": "best crop for kharif?"})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload.get("provider") == "fallback"
    assert isinstance(payload.get("reply"), str)


def test_chat_endpoint_fallback_uses_context(monkeypatch):
    from app import routes as app_routes

    monkeypatch.setattr(app_routes, "_call_gemini_chat", lambda prompt: None)
    monkeypatch.setattr(app_routes, "_call_openai_chat", lambda prompt: None)

    app = create_app()
    client = app.test_client()

    response = client.post(
        "/chat",
        json={
            "message": "What is the best crop plan?",
            "context": {
                "state": "Punjab",
                "district": "Ludhiana",
                "season": "Kharif",
                "soil": "Alluvial",
                "recommendations": [
                    {
                        "crop": "Rice",
                        "profit": 12345,
                        "risk_level": "Low",
                        "price_source": "fallback",
                        "market_price": 2400,
                    }
                ],
            },
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload.get("provider") == "fallback"
    assert "Top crop options" in payload.get("reply", "")
    assert "Rice" in payload.get("reply", "")
