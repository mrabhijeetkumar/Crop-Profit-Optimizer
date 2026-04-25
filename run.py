import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug_mode = str(os.environ.get("APP_ENV", "development")).strip().lower() != "production"
    app.run(host="127.0.0.1", debug=debug_mode, port=port)
