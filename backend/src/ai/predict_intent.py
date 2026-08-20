import sys
import os
import re
import json
import joblib

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def predict(text):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "intent_model.pkl")
    vec_path = os.path.join(current_dir, "vectorizer.pkl")
    le_path = os.path.join(current_dir, "label_encoder.pkl")

    if not (os.path.exists(model_path) and os.path.exists(vec_path) and os.path.exists(le_path)):
        return {"intent": "unknown", "confidence": 0.0, "error": "Model files missing"}

    model = joblib.load(model_path)
    vectorizer = joblib.load(vec_path)
    label_encoder = joblib.load(le_path)

    clean = preprocess_text(text)
    if not clean:
        return {"intent": "unknown", "confidence": 0.0}

    vec = vectorizer.transform([clean])
    probabilities = model.predict_proba(vec)[0]
    best_idx = probabilities.argmax()
    confidence = float(probabilities[best_idx])
    intent_label = label_encoder.inverse_transform([best_idx])[0]

    return {
        "intent": str(intent_label),
        "confidence": round(confidence, 4)
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_text = " ".join(sys.argv[1:])
    else:
        user_text = sys.stdin.read()

    result = predict(user_text)
    print(json.dumps(result))
