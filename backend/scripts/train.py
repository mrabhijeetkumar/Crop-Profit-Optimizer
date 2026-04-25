# ==========================================
# AI Crop Profit Optimization System
# Model Training Script
# ==========================================

import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


BACKEND_DIR = Path(__file__).resolve().parents[1]
DATASET_PATH = BACKEND_DIR / "data" / "raw" / "Crop_recommendation.csv"
MODEL_OUTPUT_PATH = BACKEND_DIR / "models" / "crop_model.pkl"

# 1. Load dataset
data = pd.read_csv(DATASET_PATH)

# 2. Separate features & target
X = data.drop("label", axis=1)
y = data["label"]

# 3. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 4. Model selection (strong & placement-safe)
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    random_state=42
)

# 5. Train model
model.fit(X_train, y_train)

# 6. Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Model Accuracy: {accuracy * 100:.2f}%")

# 7. Save trained model
joblib.dump(model, MODEL_OUTPUT_PATH)
print(f"✅ Model saved successfully in {MODEL_OUTPUT_PATH}")
