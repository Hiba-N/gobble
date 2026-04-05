// ----------------------------
// Gobble - Improved Tracker
// ----------------------------

// CONFIG
const KW_PER_100_WORDS = 0.14;
const WATER_PER_KWH = 1.8;
const IMAGE_WATER = 0.01; // 10 ml = 0.01 L

// STATE
let waterBySession = {};
let floatingBadge;
let currentSessionId = null;

// NEW: track counted images
const countedImages = new Set();

// ----------------------------
// SESSION
// ----------------------------
function updateSession() {
  const sessionId = window.location.pathname;
  if (sessionId !== currentSessionId) {
    currentSessionId = sessionId;
    if (!waterBySession[currentSessionId]) {
      waterBySession[currentSessionId] = 0;
    }
    updateFloatingBadge(sessionId);
  }
  return currentSessionId;
}

// ----------------------------
// WATER CALC
// ----------------------------
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
// BADGE
// ----------------------------
function createFloatingBadge() {
  if (!floatingBadge) {
    floatingBadge = document.createElement("div");
    floatingBadge.style.position = "fixed";
    floatingBadge.style.top = "10px";
    floatingBadge.style.right = "10px";
    floatingBadge.style.padding = "6px 12px";
    floatingBadge.style.background = "#00aaff";
    floatingBadge.style.color = "#fff";
    floatingBadge.style.fontWeight = "bold";
    floatingBadge.style.borderRadius = "6px";
    floatingBadge.style.zIndex = "9999";
    floatingBadge.innerText = "💧 0.00 L";
    document.body.appendChild(floatingBadge);
  }
}

function updateFloatingBadge(sessionId) {
  if (!floatingBadge) createFloatingBadge();
  floatingBadge.innerText = `💧 ${waterBySession[sessionId]?.toFixed(2) || "0.00"} L`;
}

// ----------------------------
// TEXT TRACKING (unchanged core idea)
// ----------------------------
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
    if (!msg.dataset.gobbleObserved) {
      msg.dataset.gobbleObserved = "true";

      const observer = new MutationObserver(() => {
        processMessage(msg, sessionId);
      });

      observer.observe(msg, { childList: true, subtree: true });

      processMessage(msg, sessionId);
    }
  });
}

// ----------------------------
// IMAGE TRACKING (NEW + FIXED)
// ----------------------------
function trackImages() {
  const sessionId = updateSession();
  const images = document.querySelectorAll("img");

  images.forEach(img => {
    if (!countedImages.has(img)) {
      countedImages.add(img);
      addWater(sessionId, IMAGE_WATER);
    }
  });
}

// Observe new images globally
function startImageObserver() {
  const observer = new MutationObserver(() => {
    trackImages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // initial scan
  setTimeout(trackImages, 1500);
}

// ----------------------------
// MAIN OBSERVER
// ----------------------------
function startObserver() {
  const observer = new MutationObserver(() => {
    trackMessages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(trackMessages, 1500);
}

// ----------------------------
// INIT
// ----------------------------
function initGobble() {
  createFloatingBadge();
  startObserver();
  startImageObserver(); // 🔥 key addition
}

window.addEventListener("load", initGobble);