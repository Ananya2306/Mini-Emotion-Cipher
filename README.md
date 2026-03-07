# 🧠🔐 Mini Emotion Cipher

**Feelings stay readable · Words stay private**

Mini Emotion Cipher is an AI-powered encryption system that detects emotional signals in text and encrypts the message while preserving emotional metadata.  
It demonstrates how **Natural Language Processing (NLP)** and **cryptography** can work together to balance **privacy and emotional understanding**.

---

# 🚀 Live Demo

🌐 **Frontend**  
https://mini-emotion-cipher.vercel.app

⚙️ **Backend API**  
https://mini-emotion-cipher.onrender.com

---

# 🧩 Problem Statement

Traditional encryption hides everything inside a message.

However, human communication contains both **words and emotions**.

Mini Emotion Cipher explores a new concept:

> What if the words were encrypted but the emotional meaning could still be interpreted?

The system encrypts text while preserving emotional signals for AI interpretation.

---

# 🏗 System Architecture

```
User Input
   │
   ▼
React Frontend (Vercel)
   │
POST /encrypt
   │
   ▼
Flask Backend (Render)
   │
   ├── Emotion Detection
   │       HuggingFace Emotion Model
   │
   ├── Payload Builder
   │       emotion_header || original_text
   │
   ├── Key Derivation
   │       SHA256(emotion_signature)
   │
   ├── AES Encryption
   │
   └── Base64 Ciphertext Output
```

Decryption reverses the same process.

---

# 🤖 Emotion Detection

Emotion detection is performed using a pretrained NLP model:

**Model**

```
j-hartmann/emotion-english-distilroberta-base
```

The model analyzes text and predicts emotional signals such as:

```
joy
sadness
anger
fear
surprise
disgust
```

The top emotional signals are embedded into the encrypted payload.

---

# 🔐 Encryption Design

The encryption pipeline works as follows:

### Step 1 — Emotion Detection
The system detects emotional signals from the text.

Example input:

```
"I finally got the job but I'm nervous."
```

Detected emotions:

```
Joy (0.91)
Anxiety (0.76)
```

---

### Step 2 — Payload Construction

The payload is structured as:

```
emotion_header || original_text
```

Example payload:

```
joy:0.91|excitement:0.76||I finally got the job today
```

---

### Step 3 — Key Derivation

The encryption key is derived from emotional signals using SHA256:

```
AES Key = SHA256(emotion_signature)
```

---

### Step 4 — Encryption

The payload is encrypted using:

```
AES (CBC mode)
```

Output format:

```
base64(iv).base64(ciphertext)
```

---

# 📦 Example

### Input

```
"I finally got the job but I'm nervous."
```

### Detected Emotion

```
Joy (0.91)
Anxiety (0.76)
```

### Encrypted Output

```
Qz8GJZ7JkP1kQ1q6...QmFzZTY0
```

### Decrypted Result

```
I finally got the job but I'm nervous.
```

---

# 🛠 Tech Stack

### Frontend
- React
- Vercel

### Backend
- Flask
- Gunicorn
- Render

### AI / NLP
- HuggingFace Transformers
- Emotion Classification Model

### Cryptography
- AES Encryption (PyCryptodome)
- SHA256 Key Derivation

---

# 📂 Project Structure

```
mini-emotion-cipher
│
├── backend
│   ├── app.py
│   ├── emotion.py
│   ├── cipher.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── components
│   └── api.js
│
└── README.md
```

---

# ⚙️ Running Locally

## Backend

```
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on:

```
http://localhost:5000
```

---

## Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

# 🧪 API Endpoints

## Encrypt

```
POST /encrypt
```

Request

```json
{
 "text": "I am excited but nervous about the interview"
}
```

Response

```json
{
 "ciphertext": "...",
 "emotions": [...]
}
```

---

## Decrypt

```
POST /decrypt
```

Request

```json
{
 "ciphertext": "...",
 "emotions": [...]
}
```

Response

```json
{
 "text": "...",
 "emotions": [...]
}
```

---

# 🎥 Demo Video

Add your Loom or Google Drive demo link here.

```
Demo Video: [Add Link]
```

---

# 💡 Key Idea

Traditional encryption hides **all information**.

Mini Emotion Cipher explores a hybrid idea:

```
Words → encrypted
Emotion → preserved
```

The system demonstrates how **privacy and emotional context** can coexist in AI systems.

---

# 📜 License

MIT License

---

# 👩‍💻 Author

**Ananya**

AI / Machine Learning Enthusiast  
Computer Science Engineering (AI & ML)

GitHub:  
https://github.com/Ananya2306
