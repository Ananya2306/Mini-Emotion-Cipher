import os
import base64
import hashlib
from Crypto.Cipher import AES # type: ignore
from Crypto.Util.Padding import pad, unpad # type: ignore

# ── Constants ──────────────────────────────────────────
SEPARATOR = "||"
EMOTION_SEP = "|"
SCORE_SEP = ":"

def derive_key(emotions: list[dict]) -> bytes:
    """Derive a 32-byte AES key from detected emotions."""
    emotion_string = EMOTION_SEP.join(
        f"{e['label']}{SCORE_SEP}{round(e['score'], 4)}"
        for e in emotions
    )
    return hashlib.sha256(emotion_string.encode()).digest()

def build_payload(text: str, emotions: list[dict]) -> str:
    """Build payload: emotion_header || original_text"""
    header = EMOTION_SEP.join(
        f"{e['label']}{SCORE_SEP}{round(e['score'], 4)}"
        for e in emotions
    )
    return f"{header}{SEPARATOR}{text}"

def parse_payload(payload: str) -> tuple[str, list[dict]]:
    """Parse decrypted payload back into text and emotions."""
    parts = payload.split(SEPARATOR, 1)
    if len(parts) != 2:
        raise ValueError("Invalid payload format")
    
    header, text = parts
    emotions = []
    for item in header.split(EMOTION_SEP):
        label, score = item.split(SCORE_SEP, 1)
        emotions.append({"label": label, "score": float(score)})
    
    return text, emotions

def encrypt(text: str, emotions: list[dict]) -> str:
    """Encrypt text with emotion-derived AES key."""
    key = derive_key(emotions)
    payload = build_payload(text, emotions)
    
    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(payload.encode("utf-8"), AES.block_size))
    
    iv_b64 = base64.b64encode(cipher.iv).decode()
    ct_b64 = base64.b64encode(ct_bytes).decode()
    
    return f"{iv_b64}.{ct_b64}"

def decrypt(ciphertext: str, emotions: list[dict]) -> tuple[str, list[dict]]:
    """Decrypt ciphertext using emotion-derived AES key."""
    key = derive_key(emotions)
    
    iv_b64, ct_b64 = ciphertext.split(".", 1)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ct_b64)
    
    cipher = AES.new(key, AES.MODE_CBC, iv)
    payload = unpad(cipher.decrypt(ct), AES.block_size).decode("utf-8")
    
    return parse_payload(payload)