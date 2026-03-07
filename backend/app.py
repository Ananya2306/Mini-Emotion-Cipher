from flask import Flask, request, jsonify
from flask_cors import CORS

from emotion import detect_emotions
from cipher import encrypt, decrypt

app = Flask(__name__)
CORS(app)

# Health check
@app.route("/")
def home():
    return {"message": "Mini Emotion Cipher API running"}

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}

# Encrypt endpoint
@app.route("/encrypt", methods=["POST"])
def encrypt_route():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Text is required"}), 400

        if len(text) > 1000:
            return jsonify({"error": "Text too long"}), 400

        emotions = detect_emotions(text)

        ciphertext = encrypt(text, emotions)

        return jsonify({
            "ciphertext": ciphertext,
            "emotions": emotions
        })

    except Exception as e:
        print("Encrypt error:", e)
        return jsonify({"error": str(e)}), 500


# Decrypt endpoint
@app.route("/decrypt", methods=["POST"])
def decrypt_route():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        ciphertext = data.get("ciphertext", "").strip()
        emotions = data.get("emotions")

        if not ciphertext:
            return jsonify({"error": "Ciphertext required"}), 400

        if not emotions:
            return jsonify({"error": "Emotions required"}), 400

        text, recovered = decrypt(ciphertext, emotions)

        return jsonify({
            "text": text,
            "emotions": recovered
        })

    except Exception as e:
        print("Decrypt error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)