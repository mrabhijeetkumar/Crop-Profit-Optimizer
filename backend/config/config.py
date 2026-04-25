from pathlib import Path
import os


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    MANDI_API_KEY = os.environ.get("MANDI_API_KEY", "")
    WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
    MODEL_PATH = os.environ.get("MODEL_PATH", str((BACKEND_DIR / "models" / "crop_model.pkl").resolve()))
    CORS_ORIGINS = [item.strip() for item in os.environ.get("CORS_ORIGINS", "*").split(",") if item.strip()]
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
