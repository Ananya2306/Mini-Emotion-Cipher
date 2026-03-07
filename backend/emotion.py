import httpx
import os
from typing import Any

HF_API_URL = "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base"
HF_TOKEN = os.environ.get("HF_TOKEN")

# Emoji → emotion boost mapping
EMOJI_EMOTIONS = {
    "😤": "anger", "😡": "anger", "🤬": "anger", "💢": "anger",
    "😢": "sadness", "😭": "sadness", "😞": "sadness", "💔": "sadness",
    "😊": "joy", "😂": "joy", "🥰": "joy", "😄": "joy", "🎉": "joy",
    "😨": "fear", "😰": "fear", "😱": "fear",
    "🤢": "disgust", "🤮": "disgust", "😒": "disgust",
    "😮": "surprise", "😲": "surprise", "🤯": "surprise",
    "😐": "neutral", "🙂": "neutral",
}

def detect_emotions(text: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    response = httpx.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": text},
        timeout=30
    )

    data = response.json()

    if not isinstance(data, list):
        raise Exception(f"HuggingFace API error: {data}")

    results = data[0]

    # Convert to dict
    scores = {r["label"].lower(): r["score"] for r in results}

    # Boost scores based on emojis in text
    for emoji, emotion in EMOJI_EMOTIONS.items():
        if emoji in text and emotion in scores:
            scores[emotion] = min(1.0, scores[emotion] + 0.3)

    # Sort and filter
    sorted_emotions = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    filtered = [
        {"label": label, "score": round(score, 4)}
        for label, score in sorted_emotions[:3]
        if score > 0.1
    ]

    if not filtered:
        filtered = [{"label": sorted_emotions[0][0], "score": round(sorted_emotions[0][1], 4)}]

    return filtered