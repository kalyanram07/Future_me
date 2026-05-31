# 🔮 FutureMe — A Message from Your Future Self

> **FutureMe** is an AI-powered personal reflection product where you fill in details about your current life, goals, fears, struggles, habits, and future ambitions. The app then generates a deeply personal, emotional, and actionable message from your **future self** — powered by Google Gemini AI.

---

## ✨ What It Does

1. **Fill the form** — Share your name, age, dream, struggle, and 1-year vision.
2. **Choose your tone** — Motivational, Brutally Honest, Calm Mentor, or CEO Mode.
3. **Generate your FutureMe** — Gemini crafts a personal message from your future self.
4. **See the result** — Includes a message, future identity, 3 next moves, a daily habit, a warning, and a mantra.
5. **Chat with FutureMe** — Ask follow-up questions. FutureMe replies in context.
6. **Copy & Share** — Copy the full result to share anywhere.

---

## 🛠 Tech Stack

| Layer     | Tech                       |
|-----------|----------------------------|
| Frontend  | HTML, CSS, Vanilla JS      |
| Backend   | Node.js + Express          |
| AI        | Google Gemini (`gemini-1.5-flash`) |
| Security  | API key only in `.env`     |

---

## 📁 Project Structure

```
1st_week/
├── frontend/
│   ├── index.html       ← Premium Apple-style UI
│   ├── style.css        ← Glassmorphism dark design
│   └── script.js        ← Frontend logic + API calls
├── backend/
│   ├── server.js        ← Express server + Gemini integration
│   ├── package.json     ← Dependencies
│   ├── .env             ← Your Gemini API key (DO NOT commit)
│   └── .env.example     ← Template for sharing
└── README.md
```

---

## 🚀 How to Run

### Step 1 — Add Your Gemini API Key

Navigate to the backend folder and open (or create) the `.env` file:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
```

> Get your free API key at: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 3 — Start the Backend Server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

You should see:
```
🚀 FutureMe server running at http://localhost:5000
📡 API ready at http://localhost:5000/api/generate-futureme
💬 Chat ready at http://localhost:5000/api/chat-futureme
```

---

### Step 4 — Open the Frontend

Since the Express server serves the frontend automatically, just open:

```
http://localhost:5000
```

That's it! The app is fully running. ✅

---

## 🔌 API Routes

### `POST /api/generate-futureme`

Generates the full FutureMe result.

**Request Body:**
```json
{
  "name": "Nitish",
  "age": "23",
  "goal": "Build a successful AI startup",
  "struggle": "Lack of consistency",
  "oneYearVision": "Running a profitable AI company",
  "tone": "Brutally Honest"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "...",
    "futureIdentity": "...",
    "nextMoves": ["...", "...", "..."],
    "habit": "...",
    "warning": "...",
    "mantra": "..."
  }
}
```

---

### `POST /api/chat-futureme`

Chat with your FutureMe using context from your profile.

**Request Body:**
```json
{
  "userProfile": { "name": "Nitish", "age": "23", ... },
  "chatHistory": [
    { "role": "user", "message": "Will I make it?" },
    { "role": "futureme", "message": "Only if you stop negotiating." }
  ],
  "question": "What should I focus on this week?"
}
```

**Response:**
```json
{
  "success": true,
  "reply": "..."
}
```

---

## 🔐 Security

- The Gemini API key is **only** stored in the backend `.env` file.
- The frontend **never** touches the API key.
- All AI requests go through the Express server.
- `.env` is gitignored — never commit it.

---

## 💡 Tips for Live Demo

1. Fill the form with a real person's details for an authentic emotional response.
2. Try **Brutally Honest** tone for the most dramatic effect.
3. After generating, open the chat and ask: *"What should I focus on this week?"*
4. Copy the result and paste it in your session slides.

---

## 📜 License

Built for learning and demo purposes. Powered by Google Gemini AI.
