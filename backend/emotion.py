import httpx
import os

HF_API_URL = "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base"
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def detect_emotions(text: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    response = httpx.post(
        HF_API_URL,
        headers=headers,
        json={"inputs": text},
        timeout=30
    )
    results = response.json()[0]
    
    # Sort by score, take top 3, filter > 0.1
    results.sort(key=lambda x: x["score"], reverse=True)
    filtered = [
        {"label": r["label"].lower(), "score": round(r["score"], 4)}
        for r in results[:3]
        if r["score"] > 0.1
    ]
    return filtered if filtered else [{"label": results[0]["label"].lower(), "score": round(results[0]["score"], 4)}]
