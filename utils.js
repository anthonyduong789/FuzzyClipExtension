// utils.js
export function generateId() {
  return crypto.randomUUID();
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function highlight(str, positions) {
  if (!positions || positions.length === 0) return escHtml(str);
  const posSet = new Set(positions);
  return str
    .split("")
    .map((c, i) =>
      posSet.has(i) ? `<mark class="match">${escHtml(c)}</mark>` : escHtml(c),
    )
    .join("");
}

export function debounce(fn, ms, state) {
  return (...args) => {
    clearTimeout(state.timers.debounce);
    state.timers.debounce = setTimeout(() => fn(...args), ms);
  };
}

export function storageManager(action, key, data) {
  if (action === "update-data") {
    window.parent.postMessage({ action, key, data }, "*");
  }
}

export function postMessageToParent(action, data = null) {
  window.parent.postMessage({ action, ...(data && { data }) }, "*");
}
