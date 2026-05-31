/* ═══════════════════════════════════════════════════════════════════
   FutureMe – Frontend Logic
   All API calls go through the Express backend (no key exposure)
   ═══════════════════════════════════════════════════════════════════ */

"use strict";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

// ─── State ───────────────────────────────────────────────────────────────────
let selectedTone = "Motivational";
let currentProfile = null;     // Saved after successful generation
let chatHistory = [];          // [{ role: "user"|"futureme", message: "..." }]
let isGenerating = false;
let isChatting = false;

// ─── DOM References ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const formCard       = $("form-card");
const btnGenerate    = $("btn-generate");
const btnGenerateText= $("btn-generate-text");
const btnGenerateIcon= $("btn-generate-icon");
const loadingState   = $("loading-state");
const resultSection  = $("result-section");
const chatSection    = $("chat-section");

// Form inputs
const inputName     = $("input-name");
const inputAge      = $("input-age");
const inputGoal     = $("input-goal");
const inputStruggle = $("input-struggle");
const inputVision   = $("input-vision");

// Result display elements
const resultUserName = $("result-user-name");
const resultIdentity = $("result-identity");
const resultMessage  = $("result-message");
const resultMoves    = $("result-moves");
const resultHabit    = $("result-habit");
const resultWarning  = $("result-warning");
const resultMantra   = $("result-mantra");

// Chat elements
const chatMessages   = $("chat-messages");
const chatWelcome    = $("chat-welcome");
const chatInput      = $("chat-input");
const chatSendBtn    = $("chat-send-btn");
const typingIndicator= $("typing-indicator");

// Action buttons
const btnCopy        = $("btn-copy");
const btnRegenerate  = $("btn-regenerate");
const btnOpenChat    = $("btn-open-chat");

// ─── Tone Selector ────────────────────────────────────────────────────────────
document.querySelectorAll(".tone-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone-btn").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    selectedTone = btn.dataset.tone;
  });
});

// ─── Toast Notification ───────────────────────────────────────────────────────
function showToast(message, type = "info", duration = 3500) {
  const container = $("toast-container");
  const icons = { success: "✅", error: "❌", info: "💡" };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Field Validation ─────────────────────────────────────────────────────────
function validateForm() {
  const fields = [
    { el: inputName,     label: "Name" },
    { el: inputAge,      label: "Age" },
    { el: inputGoal,     label: "Dream / Goal" },
    { el: inputStruggle, label: "Current Struggle" },
    { el: inputVision,   label: "One-Year Vision" },
  ];

  for (const { el, label } of fields) {
    if (!el.value.trim()) {
      showToast(`Please fill in your ${label}.`, "error");
      el.focus();
      el.style.borderColor = "rgba(247, 111, 111, 0.6)";
      setTimeout(() => (el.style.borderColor = ""), 2000);
      return false;
    }
  }

  const age = parseInt(inputAge.value, 10);
  if (isNaN(age) || age < 13 || age > 100) {
    showToast("Please enter a valid age (13–100).", "error");
    inputAge.focus();
    return false;
  }

  return true;
}

// ─── Show / Hide Sections ─────────────────────────────────────────────────────
function showLoading() {
  loadingState.classList.add("visible");
  resultSection.classList.remove("visible");
  resultSection.style.display = "none";
}

function hideLoading() {
  loadingState.classList.remove("visible");
}

function showResult() {
  resultSection.style.display = "block";
  requestAnimationFrame(() => resultSection.classList.add("visible"));
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Render Result ────────────────────────────────────────────────────────────
function renderResult(data, name) {
  resultUserName.textContent = `${name}, here is your message.`;
  resultIdentity.textContent = data.futureIdentity || "—";
  resultMessage.textContent  = data.message        || "—";
  resultHabit.textContent    = data.habit          || "—";
  resultWarning.textContent  = data.warning        || "—";
  resultMantra.textContent   = data.mantra         || "—";

  // Render moves
  resultMoves.innerHTML = "";
  const moves = Array.isArray(data.nextMoves) ? data.nextMoves : [];
  moves.forEach((move, i) => {
    const item = document.createElement("div");
    item.className = "move-item";
    item.innerHTML = `
      <div class="move-number">${i + 1}</div>
      <div class="move-text">${escapeHTML(move)}</div>
    `;
    resultMoves.appendChild(item);
  });
}

// ─── Generate FutureMe ───────────────────────────────────────────────────────
async function generateFutureMe() {
  if (isGenerating) return;
  if (!validateForm()) return;

  const profile = {
    name:          inputName.value.trim(),
    age:           inputAge.value.trim(),
    goal:          inputGoal.value.trim(),
    struggle:      inputStruggle.value.trim(),
    oneYearVision: inputVision.value.trim(),
    tone:          selectedTone,
  };

  isGenerating = true;
  btnGenerate.disabled = true;
  btnGenerateText.textContent = "Generating…";
  btnGenerateIcon.textContent = "⏳";
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/api/generate-futureme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || "FutureMe could not respond right now. Try again.");
    }

    // Save profile for chat
    currentProfile = profile;
    chatHistory = [];

    // Render
    renderResult(json.data, profile.name);
    hideLoading();
    showResult();

    // Reset chat if visible
    chatSection.classList.remove("visible");
    chatSection.style.display = "none";
    chatMessages.innerHTML = "";
    chatMessages.appendChild(chatWelcome);
    chatWelcome.style.display = "block";

    showToast("Your FutureMe message is ready! ✨", "success");

  } catch (err) {
    hideLoading();
    console.error(err);
    showToast(err.message || "FutureMe could not respond right now. Try again.", "error");
  } finally {
    isGenerating = false;
    btnGenerate.disabled = false;
    btnGenerateText.textContent = "Generate My FutureMe";
    btnGenerateIcon.textContent = "✨";
  }
}

// ─── Copy Result ──────────────────────────────────────────────────────────────
function copyResult() {
  if (!currentProfile) return;

  const movesText = Array.from(resultMoves.querySelectorAll(".move-text"))
    .map((el, i) => `${i + 1}. ${el.textContent}`)
    .join("\n");

  const text = `
🔮 FutureMe — A Message from Your Future Self
═══════════════════════════════════════

👤 For: ${resultUserName.textContent}

🌟 Future Identity
${resultIdentity.textContent}

📨 Message from FutureMe
"${resultMessage.textContent}"

🎯 Your Next 3 Moves
${movesText}

🌱 Daily Habit
${resultHabit.textContent}

⚠️ FutureMe Warning
${resultWarning.textContent}

✨ Daily Mantra
"${resultMantra.textContent}"

Generated by FutureMe · Powered by Gemini AI
  `.trim();

  navigator.clipboard
    .writeText(text)
    .then(() => showToast("Copied to clipboard!", "success"))
    .catch(() => showToast("Could not copy. Please select and copy manually.", "error"));
}

// ─── Open Chat ────────────────────────────────────────────────────────────────
function openChat() {
  chatSection.style.display = "block";
  requestAnimationFrame(() => chatSection.classList.add("visible"));
  chatSection.scrollIntoView({ behavior: "smooth", block: "start" });
  chatInput.focus();
}

// ─── Append Chat Bubble ───────────────────────────────────────────────────────
function appendBubble(role, text) {
  // Hide welcome message
  if (chatWelcome) chatWelcome.style.display = "none";

  const wrapper = document.createElement("div");
  wrapper.className = `chat-bubble ${role}`;

  const roleLabel = role === "user"
    ? (currentProfile?.name || "You")
    : "FutureMe";

  wrapper.innerHTML = `
    <div class="bubble-role">${escapeHTML(roleLabel)}</div>
    <div class="bubble-content">${escapeHTML(text)}</div>
  `;

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Send Chat Message ────────────────────────────────────────────────────────
async function sendChatMessage() {
  if (isChatting) return;
  if (!currentProfile) {
    showToast("Please generate your FutureMe first.", "info");
    return;
  }

  const question = chatInput.value.trim();
  if (!question) return;

  chatInput.value = "";
  chatSendBtn.disabled = true;
  isChatting = true;

  // Show user bubble
  appendBubble("user", question);

  // Add to history
  chatHistory.push({ role: "user", message: question });

  // Show typing indicator
  typingIndicator.classList.add("visible");
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/api/chat-futureme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userProfile: currentProfile,
        chatHistory: chatHistory.slice(-10), // Keep last 10 messages for context
        question,
      }),
    });

    const json = await res.json();
    typingIndicator.classList.remove("visible");

    if (!json.success) {
      throw new Error(json.error || "FutureMe could not respond right now.");
    }

    appendBubble("futureme", json.reply);
    chatHistory.push({ role: "futureme", message: json.reply });

  } catch (err) {
    typingIndicator.classList.remove("visible");
    appendBubble("futureme", "I couldn't hear that clearly. Try asking again.");
    showToast(err.message || "FutureMe could not respond right now. Try again.", "error");
    console.error(err);
  } finally {
    isChatting = false;
    chatSendBtn.disabled = false;
    chatInput.focus();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
btnGenerate.addEventListener("click", generateFutureMe);
btnRegenerate.addEventListener("click", generateFutureMe);
btnCopy.addEventListener("click", copyResult);
btnOpenChat.addEventListener("click", openChat);

// Send chat on button click
chatSendBtn.addEventListener("click", sendChatMessage);

// Send chat on Enter key
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Clear red border on input focus
[inputName, inputAge, inputGoal, inputStruggle, inputVision].forEach((el) => {
  el.addEventListener("focus", () => (el.style.borderColor = ""));
});

// ─── Init ─────────────────────────────────────────────────────────────────────
// Show a subtle welcome toast after load
window.addEventListener("load", () => {
  setTimeout(() => {
    showToast("Welcome. Tell FutureMe your story. 🔮", "info", 4000);
  }, 800);
});
