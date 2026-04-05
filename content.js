// ----------------------------
// Gobble - ChatGPT Text Water Tracker (per-session, no images)
// ----------------------------

// CONFIG
const WATER_PER_100_WORDS = 0.519; // liters per 100 words

// STATE
let waterBySession = {};       // water per session
let floatingBadge;
let currentSessionId = null;   // current chat session

// ----------------------------
// UTILITIES
function updateSession() {
  const sessionId = window.location.pathname;

  if (sessionId !== currentSessionId) {
    currentSessionId = sessionId;

    // initialize session water
    waterBySession[currentSessionId] = 0;
    updateFloatingBadge(currentSessionId);

    // reset all message tracking for this session
    const messages = document.querySelectorAll("[data-message-author-role]");
    messages.forEach(msg => {
      msg.dataset.gobbleObserved = "false";
      msg.dataset.gobbleWater = "0";
    });
  }

  return currentSessionId;
}

function estimateTextWater(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return (words / 100) * WATER_PER_100_WORDS;
}

function addWater(sessionId, amount) {
  if (!waterBySession[sessionId]) waterBySession[sessionId] = 0;
  waterBySession[sessionId] += amount;
  updateFloatingBadge(sessionId);
}

// ----------------------------
// FLOATING BADGE
function createFloatingBadge() {
  if (!floatingBadge) {
    floatingBadge = document.createElement("div");
    floatingBadge.id = "gobble-floating";
    floatingBadge.style.position = "fixed";
    floatingBadge.style.bottom = "10px";   // bottom-right
    floatingBadge.style.right = "10px";
    floatingBadge.style.padding = "5px 10px";
    floatingBadge.style.background = "#00aaff";
    floatingBadge.style.color = "#fff";
    floatingBadge.style.fontWeight = "bold";
    floatingBadge.style.borderRadius = "5px";
    floatingBadge.style.zIndex = "9999";
    floatingBadge.style.fontFamily = "Arial, sans-serif";
    floatingBadge.innerText = "💧 0 L";

    // optional tooltip for transparency
    floatingBadge.title = "Estimated water usage for GPT-4 text; actual use may vary";

    document.body.appendChild(floatingBadge);
  }
}

function updateFloatingBadge(sessionId) {
  if (!floatingBadge) createFloatingBadge();
  floatingBadge.innerText = `💧 ${waterBySession[sessionId]?.toFixed(2) || 0} L`;
}

// ----------------------------
// MESSAGE TRACKING (text-only, streaming)
function processMessage(msg, sessionId) {
  const text = msg.innerText || "";
  const newWater = estimateTextWater(text);

  const oldWater = parseFloat(msg.dataset.gobbleWater || "0");
  const delta = newWater - oldWater;

  if (delta > 0) {
    addWater(sessionId, delta);
    msg.dataset.gobbleWater = newWater;
  }
}

function trackMessages() {
  const sessionId = updateSession();

  const messages = document.querySelectorAll("[data-message-author-role]");
  messages.forEach(msg => {
    if (msg.dataset.gobbleObserved !== "true") {
      msg.dataset.gobbleObserved = "true";

      // watch for streaming updates
      const observer = new MutationObserver(() => {
        processMessage(msg, sessionId);
      });
      observer.observe(msg, { childList: true, subtree: true });

      // initial processing
      processMessage(msg, sessionId);
    }
  });
}

// ----------------------------
// OBSERVER
function startObserver() {
  const observer = new MutationObserver(trackMessages);
  observer.observe(document.body, { childList: true, subtree: true });

  // initial run for messages already loaded
  setTimeout(trackMessages, 2000);
}

// ----------------------------
// INIT
function initGobble() {
  createFloatingBadge();
  startObserver();
}

// Start Gobble after page load
window.addEventListener("load", initGobble);