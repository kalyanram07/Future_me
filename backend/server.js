require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── Gemini Client ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = "gemini-2.5-flash";

// ─── Helper: clean Gemini response (strip markdown code fences) ────────────────
function cleanGeminiJSON(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// ─── Helper: retry with exponential backoff (handles 429 rate limits) ──────────
async function generateWithRetry(prompt, maxRetries = 3) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const is429 = err.message && err.message.includes("429");
      if (is429 && attempt < maxRetries) {
        const waitMs = attempt * 5000; // 5s, 10s, 15s
        console.log(`⚠️  Rate limited. Retrying in ${waitMs / 1000}s... (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
}

// ─── Route 1: POST /api/generate-futureme ─────────────────────────────────────
app.post("/api/generate-futureme", async (req, res) => {
  const { name, age, goal, struggle, oneYearVision, tone } = req.body;

  if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
    return res.status(400).json({
      success: false,
      error: "All fields are required.",
    });
  }

  const prompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user's future self speaking directly to their current self.

Tone selected by user: ${tone}

Tone guidelines:
- Motivational: warm, inspiring, supportive, full of belief in the user
- Brutally Honest: direct, sharp, no excuses, confrontational but caring
- Calm Mentor: peaceful, wise, grounded, like a wise older version of themselves
- CEO Mode: strategic, focused, execution-heavy, metrics-driven mindset

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return ONLY valid JSON in this exact format (no extra text, no markdown, no code fences):
{
  "message": "A powerful 120-180 word message from the future self, written in second person (you/your), deeply personal, emotional but practical.",
  "futureIdentity": "A concise 1-2 sentence description of who the user is becoming in 1 year.",
  "nextMoves": ["A specific, actionable move #1", "A specific, actionable move #2", "A specific, actionable move #3"],
  "habit": "One small daily habit they should start today that directly addresses their struggle.",
  "warning": "One specific mistake their future self warns them about — something they are likely already doing wrong.",
  "mantra": "A short, punchy, memorable 5-10 word line they can repeat daily."
}

Make it specific to this exact person. Avoid generic motivation. Avoid clichés. Make it emotional but practical. This person should feel seen and understood.`;

  try {
    const rawText = await generateWithRetry(prompt);
    const cleaned = cleanGeminiJSON(rawText);
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("❌ generate-futureme error:", err.message);
    res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again.",
    });
  }
});

// ─── Route 2: POST /api/chat-futureme ─────────────────────────────────────────
app.post("/api/chat-futureme", async (req, res) => {
  const { userProfile, chatHistory, question } = req.body;

  if (!userProfile || !question) {
    return res.status(400).json({
      success: false,
      error: "User profile and question are required.",
    });
  }

  const { name, age, goal, struggle, oneYearVision, tone } = userProfile;

  const historyText =
    chatHistory && chatHistory.length > 0
      ? chatHistory
          .map(
            (msg) =>
              `${msg.role === "user" ? name : "FutureMe"}: ${msg.message}`
          )
          .join("\n")
      : "No previous messages.";

  const prompt = `You are FutureMe, the future version of ${name} who has already achieved their one-year vision. Reply directly to the user's question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak exactly like the future self — you ARE them in the future.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone}

Tone guidelines:
- Motivational: warm, inspiring, supportive, full of belief in the user
- Brutally Honest: direct, sharp, no excuses, confrontational but caring
- Calm Mentor: peaceful, wise, grounded, like a wise older version of themselves
- CEO Mode: strategic, focused, execution-heavy, metrics-driven mindset

Recent conversation:
${historyText}

Current question from ${name}:
${question}

Reply in 2-5 short paragraphs. Give at least one clear, specific action. Do not use bullet points. Write in flowing prose. Sound human, personal, and wise. End with something that sticks.`;

  try {
    const reply = (await generateWithRetry(prompt)).trim();

    res.json({ success: true, reply });
  } catch (err) {
    console.error("❌ chat-futureme error:", err.message);
    res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again.",
    });
  }
});

// ─── Catch-all: serve frontend ─────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FutureMe server running at http://localhost:${PORT}`);
  console.log(`📡 API ready at http://localhost:${PORT}/api/generate-futureme`);
  console.log(`💬 Chat ready at http://localhost:${PORT}/api/chat-futureme\n`);
});
