from flask import Flask, request, jsonify # type: ignore
from flask_cors import CORS # type: ignore
from emotion import detect_emotions
from cipher import encrypt, decrypt

# ── App Setup ──────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Routes ─────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/encrypt", methods=["POST"])
def encrypt_route():
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Text is required"}), 400

        if len(text) > 1000:
            return jsonify({"error": "Text too long (max 1000 chars)"}), 400

        # Step 1 — Detect emotions
        emotions = detect_emotions(text)

        # Step 2 — Encrypt with emotion-derived key
        ciphertext = encrypt(text, emotions)

        return jsonify({
            "ciphertext": ciphertext,
            "emotions": emotions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/decrypt", methods=["POST"])
def decrypt_route():
    try:
        data = request.get_json()
        ciphertext = data.get("ciphertext", "").strip()
        emotions = data.get("emotions")

        if not ciphertext:
            return jsonify({"error": "Ciphertext is required"}), 400

        if not emotions:
            return jsonify({"error": "Emotions are required for decryption"}), 400

        # Decrypt using provided emotions
        text, recovered_emotions = decrypt(ciphertext, emotions)

        return jsonify({
            "text": text,
            "emotions": recovered_emotions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)