import os
import re
import sys
import joblib

def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def run_tests():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "intent_model.pkl")
    vec_path = os.path.join(current_dir, "vectorizer.pkl")
    le_path = os.path.join(current_dir, "label_encoder.pkl")

    model = joblib.load(model_path)
    vectorizer = joblib.load(vec_path)
    label_encoder = joblib.load(le_path)

    # Test suite covering all user-requested real-world questions + off-topic queries
    user_requested_tests = [
        # Food Donation
        ("What food are accepted?", "food_donation"),
        ("Which foods can I donate?", "food_donation"),
        ("Can I donate cooked food?", "food_donation"),
        ("Can I donate fruits?", "food_donation"),
        ("Can I donate vegetables?", "food_donation"),
        ("Can I donate packaged food?", "food_donation"),
        ("What food is not accepted?", "food_donation"),
        ("Can I donate expired food?", "food_donation"),
        ("Can I donate homemade food?", "food_donation"),
        ("Is hot food accepted?", "food_donation"),
        ("Is frozen food accepted?", "food_donation"),
        ("What are the food donation guidelines?", "food_donation"),
        ("What foods are safe to donate?", "food_donation"),
        ("Can I donate bakery items?", "food_donation"),
        ("Can I donate milk products?", "food_donation"),
        ("Can I donate rice?", "food_donation"),
        ("Can I donate curry?", "food_donation"),
        ("Can I donate leftover food?", "food_donation"),
        ("Can I donate unopened packaged food?", "food_donation"),
        ("What types of food does FoodReach accept?", "food_donation"),

        # NGO
        ("How do NGOs work?", "ngo_registration"),
        ("How does an NGO receive donations?", "ngo_registration"),
        ("How can NGOs accept donations?", "ngo_registration"),
        ("How can I register my NGO?", "ngo_registration"),
        ("What are NGO requirements?", "ngo_registration"),
        ("Can an NGO reject a donation?", "ngo_registration"),
        ("How are NGOs verified?", "ngo_registration"),

        # Volunteer
        ("How do I become a volunteer?", "volunteer"),
        ("How are volunteers assigned?", "volunteer"),
        ("What does a volunteer do?", "volunteer"),
        ("Can I track a volunteer?", "volunteer"),
        ("How do volunteers pick up food?", "volunteer"),

        # Food Safety
        ("Is my food safe?", "food_safety"),
        ("How long is cooked food safe?", "food_safety"),
        ("Food safety tips", "food_safety"),
        ("How should food be packed?", "food_safety"),
        ("Can spoiled food be donated?", "food_safety"),

        # App Usage
        ("How do I use FoodReach?", "app_usage"),
        ("How do I create a donation?", "food_donation"),
        ("How do I edit my profile?", "profile"),
        ("How do I track my donation?", "donation_status"),
        ("How do I reset my password?", "forgot_password"),
        ("How do I contact support?", "contact_support"),

        # Off-topic queries
        ("What is the capital of France?", "off_topic"),
        ("Who won the football match?", "off_topic"),
        ("How to code binary search in Python?", "off_topic")
    ]

    CONFIDENCE_THRESHOLD = 0.40

    correct = 0
    total_domain = 0
    results_summary = {}

    print("\n=======================================================")
    print("   REAL-WORLD USER QUESTIONS INTENT ACCURACY SUITE     ")
    print("=======================================================\n")

    for query, expected in user_requested_tests:
        clean = preprocess_text(query)
        vec = vectorizer.transform([clean])
        probs = model.predict_proba(vec)[0]
        best_idx = probs.argmax()
        conf = probs[best_idx]
        predicted_intent = label_encoder.inverse_transform([best_idx])[0]

        is_off = (expected == "off_topic")
        
        if not is_off:
            total_domain += 1
            is_correct = (predicted_intent == expected and conf >= CONFIDENCE_THRESHOLD)
            if is_correct:
                correct += 1
            
            status_symbol = "[PASS]" if is_correct else "[FAIL]"
            print(f"{status_symbol} [{expected}] -> Pred: '{predicted_intent}' (Conf: {conf*100:.1f}%) | Query: \"{query}\"")

            if expected not in results_summary:
                results_summary[expected] = {"tested": 0, "passed": 0}
            results_summary[expected]["tested"] += 1
            if is_correct:
                results_summary[expected]["passed"] += 1
        else:
            is_fallback = (conf < CONFIDENCE_THRESHOLD)
            status_symbol = "[PASS - Fallback Triggered]" if is_fallback else "[WARN - Off-Topic Matched]"
            print(f"{status_symbol} [off_topic] -> Pred: '{predicted_intent}' (Conf: {conf*100:.1f}%) | Query: \"{query}\"")

    print("\n-------------------------------------------------------")
    print(f"  Overall Domain Intent Accuracy: {correct}/{total_domain} ({correct/total_domain*100:.2f}%)")
    print(f"  Confidence Threshold: {CONFIDENCE_THRESHOLD}")
    print("-------------------------------------------------------\n")

    print("Per-Intent Breakdown:")
    for intent_name, stats in results_summary.items():
        pass_rate = (stats["passed"] / stats["tested"]) * 100
        print(f" - {intent_name:<18}: {stats['passed']}/{stats['tested']} ({pass_rate:.0f}% accuracy)")

if __name__ == "__main__":
    run_tests()
