// ----------------------------
// Gobble - ChatGPT Water Tracker (final version, new chat reset)
// ----------------------------

// CONFIG
const KW_PER_100_WORDS = 0.14; // kWh per 100 words
const WATER_PER_KWH = 1.8;     // liters per kWh
const IMAGE_WATER = 10;        // assume 10 ml per AI image

// STATE
let waterBySession = {};       // track water per session
let floatingBadge;
let currentSessionId = null;   // track current chat session

// ----------------------------
// UTILITIES
// ----------------------------
function updateSession() {
  const sessionId = window.location.pathname;
  if (sessionId !== currentSessionId) {
    currentSessionId = sessionId;
    // Initialize water for this session
    if (!waterBySession[currentSessionId]) waterBySession[currentSessionId] = 0;
    updateFloatingBadge(currentSessionId);
  }
  return currentSessionId;
}

function estimateTextWater(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const kwh = (words / 100) * KW_PER_100_WORDS;
  return kwh * WATER_PER_KWH;
}

function addWater(sessionId, amount) {
  if (!waterBySession[sessionId]) waterBySession[sessionId] = 0;
  waterBySession[sessionId] += amount;
  updateFloatingBadge(sessionId);
}

// ----------------------------
// FLOATING BADGE
// ----------------------------
function createFloatingBadge() {
  if (!floatingBadge) {
    floatingBadge = document.createElement("div");
    floatingBadge.id = "gobble-floating";
    floatingBadge.style.position = "fixed";
    floatingBadge.style.top = "10px";
    floatingBadge.style.right = "10px";
    floatingBadge.style.padding = "5px 10px";
    floatingBadge.style.background = "#00aaff";
    floatingBadge.style.color = "#fff";
    floatingBadge.style.fontWeight = "bold";
    floatingBadge.style.borderRadius = "5px";
    floatingBadge.style.zIndex = "9999";
    floatingBadge.style.fontFamily = "Arial, sans-serif";
    floatingBadge.innerText = "💧 0 L";
    document.body.appendChild(floatingBadge);
  }
}

function updateFloatingBadge(sessionId) {
  if (!floatingBadge) createFloatingBadge();
  floatingBadge.innerText = `💧 ${waterBySession[sessionId]?.toFixed(2) || 0} L`;
}

// ----------------------------
// MESSAGE TRACKING (with streaming)
// ----------------------------
function processMessage(msg, sessionId) {
  const text = msg.innerText || "";
  const imagesCount = msg.querySelectorAll("img").length;
  const newWater = estimateTextWater(text) + imagesCount * IMAGE_WATER;

  const oldWater = parseFloat(msg.dataset.gobbleWater || "0");
  const delta = newWater - oldWater;

  if (delta > 0) {
    addWater(sessionId, delta);
    msg.dataset.gobbleWater = newWater;
  }
}

function trackMessages() {
  const sessionId = updateSession(); // ensure new chat resets badge
  const messages = document.querySelectorAll("[data-message-author-role]");

  messages.forEach(msg => {
    if (!msg.dataset.gobbleObserved) {
      msg.dataset.gobbleObserved = "true";

      // Watch for streaming text / image updates
      const innerObserver = new MutationObserver(() => {
        processMessage(msg, sessionId);
      });
      innerObserver.observe(msg, { childList: true, subtree: true });

      // Initial processing
      processMessage(msg, sessionId);
    }
  });
}

// ----------------------------
// OBSERVER
// ----------------------------
function startObserver() {
  const observer = new MutationObserver(trackMessages);
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run (for messages already on page)
  setTimeout(trackMessages, 2000);
}

// ----------------------------
// INIT
// ----------------------------
function initGobble() {
  createFloatingBadge();
  startObserver();
}

// Start Gobble after page load
window.addEventListener("load", () => {
  initGobble();
});