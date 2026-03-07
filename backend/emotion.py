from transformers import pipeline # type: ignore

# ── Model Load (once at startup) ───────────────────────
print("Loading emotion model...")
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=3
)
print("Model loaded!")

# ── Emotion Detection ──────────────────────────────────
def detect_emotions(text: str) -> list[dict]:
    """Detect top 3 emotions from text."""
    results = emotion_classifier(text)[0]
    
    # Filter emotions with score > 0.1 only
    filtered = [
        {"label": r["label"].lower(), "score": round(r["score"], 4)}
        for r in results
        if r["score"] > 0.1
    ]
    
    # Always return at least 1 emotion
    if not filtered:
        filtered = [{"label": results[0]["label"].lower(), 
                    "score": round(results[0]["score"], 4)}]
    
    return filtered