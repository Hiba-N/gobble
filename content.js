// Gobble content script

// Configurable constants
const KW_PER_100_WORDS = 0.14;  // kWh per 100 words
const WATER_PER_KWH = 1.8;      // liters per kWh
const IMAGE_WATER = 10;         // assume 10 ml per AI image

// Store total water per session
let waterBySession = {};

// Utility: estimate water for text
function estimateTextWater(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const kwh = (words / 100) * KW_PER_100_WORDS;
  return kwh * WATER_PER_KWH;
}

// Utility: add water usage for session
function addWater(sessionId, amount) {
  if (!waterBySession[sessionId]) waterBySession[sessionId] = 0;
  waterBySession[sessionId] += amount;
}

// Detect ChatGPT session ID from URL
function getSessionId() {
  return window.location.pathname;
}

// Annotate sidebar chats with water usage
function annotateSidebar() {
  const chats = document.querySelectorAll("nav a");

  chats.forEach(chat => {
    const href = chat.getAttribute("href");
    const sessionWater = waterBySession[href] || 0;

    if (!chat.querySelector(".water-badge")) {
      const badge = document.createElement("span");
      badge.className = "water-badge";
      badge.innerText = `💧 ${sessionWater.toFixed(2)} L`;
      chat.appendChild(badge);
    } else {
      chat.querySelector(".water-badge").innerText = `💧 ${sessionWater.toFixed(2)} L`;
    }
  });
}

// Track messages (text + images)
function trackMessages() {
  const sessionId = getSessionId();
  const messages = document.querySelectorAll("[data-message-author-role]");

  messages.forEach(msg => {
    if (!msg.dataset.gobbleProcessed) {
      msg.dataset.gobbleProcessed = "true";

      // Text messages
      const text = msg.innerText || "";
      const textWater = estimateTextWater(text);
      addWater(sessionId, textWater);

      // Images in message (assume AI)
      const imgs = msg.querySelectorAll("img");
      imgs.forEach(() => addWater(sessionId, IMAGE_WATER));
    }
  });

  annotateSidebar();
}

// Observe page for new messages
const observer = new MutationObserver(trackMessages);
observer.observe(document.body, { childList: true, subtree: true });

// Initial run (for already loaded messages)
setTimeout(trackMessages, 2000);