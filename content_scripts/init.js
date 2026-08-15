
// ============================================================
// FUZZY CONTENT SCRIPT
// ============================================================
//
// Responsibilities:
// - Loads and manages the iframe
// - Manages iframe size and position
// - Manages Chrome storage
// - Handles communication with the iframe
// - Handles dragging/resizing
//
// Event listener strategy:
// - Permanent listeners are registered in setupEventListeners()
// - Temporary drag/resize listeners are registered only while
//   the interaction is active and removed when it ends
// - Initialization is guarded so this script cannot initialize
//   twice on the same page
// ============================================================



// ============================================================
// INITIALIZATION
// ============================================================

async function initialize() {
  await initializeIframe();

  setupResizeHandles();

  setupEventListeners();
}


// ============================================================
// IFRAME INITIALIZATION
// loads necessary data from iframe and intializes the data
// ============================================================

async function initializeIframe() {
  iframe.style.cssText = `
    all: unset;
    flex-grow: 1;
    background: none;
    border-radius: 0px 0px 10px 10px;
  `;

  iframe.src = chrome.runtime.getURL("fuzzy.html");

  wrapper.appendChild(topBar);
  wrapper.appendChild(iframe);

  document.body.appendChild(wrapper);

  // Load stored data before registering the iframeReady
  // listener so the iframe receives the latest data.
  const results = await loadAllData();

  notes = results.notes ?? [];
  tags = results.tags ?? [];

  if (results.personal_settings) {
    personal_settings = results.personal_settings;
  }

  applyPersonalSettings();
}

// ============================================================
// INITIALIZATION GUARD
// ============================================================

if (window.__fuzzyContentInitialized) {
  console.warn("Fuzzy content script already initialized.");
} else {
  window.__fuzzyContentInitialized = true;

  initialize();
}