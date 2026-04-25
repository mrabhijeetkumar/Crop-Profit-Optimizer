from pathlib import Path
import os
import logging

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv


def create_app():
    backend_dir = Path(__file__).resolve().parents[1]
    frontend_dir = backend_dir.parent / "frontend"

    load_dotenv(backend_dir / ".env")

    app = Flask(
        __name__,
        static_folder=str(frontend_dir / "static"),
        static_url_path="/static",
    )

    from config.config import DevelopmentConfig, ProductionConfig

    app_env = str(os.getenv("APP_ENV", "") or os.getenv("FLASK_ENV", "")).strip().lower()
    use_production_config = app_env == "production"
    app.config.from_object(ProductionConfig if use_production_config else DevelopmentConfig)
    logging.basicConfig(
        level=app.config.get("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    allowed_origins = app.config.get("CORS_ORIGINS", "*")
    CORS(
        app,
        resources={
            r"/api/*": {"origins": allowed_origins},
            r"/predict": {"origins": allowed_origins},
            r"/chat": {"origins": allowed_origins},
            r"/mandi-prices": {"origins": allowed_origins},
        },
    )

    from .routes import bp
    from .model_registry import load_model_once

    load_model_once(app.config["MODEL_PATH"])

    app.register_blueprint(bp)
    return app
