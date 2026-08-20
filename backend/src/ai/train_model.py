import os
import re
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    # Lowercase
    text = text.lower()
    # Remove punctuation & special symbols
    text = re.sub(r'[^\w\s]', ' ', text)
    # Normalize extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, "dataset.csv")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"dataset.csv not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset with {len(df)} samples across {df['intent'].nunique()} intents.")

    # Preprocess text
    df['clean_text'] = df['text'].apply(preprocess_text)

    # Encode labels
    label_encoder = LabelEncoder()
    df['label'] = label_encoder.fit_transform(df['intent'])

    # TF-IDF Vectorization with unigrams, bigrams, and trigrams
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        sublinear_tf=True,
        max_features=12000,
        min_df=1,
        strip_accents='unicode'
    )
    X = vectorizer.fit_transform(df['clean_text'])
    y = df['label']

    # Train / Test split for evaluation (85% train, 15% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    # Logistic Regression with tuned hyperparameters
    model = LogisticRegression(
        C=5.0,
        max_iter=1000,
        solver='lbfgs',
        class_weight='balanced',
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluation on holdout test set
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n--- NLP Model Holdout Evaluation ---")
    print(f"Test Accuracy: {accuracy * 100:.2f}%\n")
    print("Classification Report:\n", classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    # Retrain on 100% full dataset for production deployment
    full_model = LogisticRegression(
        C=5.0,
        max_iter=1000,
        solver='lbfgs',
        class_weight='balanced',
        random_state=42
    )
    full_model.fit(X, y)

    # Save artifact files
    joblib.dump(full_model, os.path.join(current_dir, "intent_model.pkl"))
    joblib.dump(vectorizer, os.path.join(current_dir, "vectorizer.pkl"))
    joblib.dump(label_encoder, os.path.join(current_dir, "label_encoder.pkl"))

    print("\nSuccessfully updated & saved production model files:")
    print(" - intent_model.pkl")
    print(" - vectorizer.pkl")
    print(" - label_encoder.pkl")

if __name__ == "__main__":
    train()
