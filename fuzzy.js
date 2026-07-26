// fuzz.js
//
// runs to control the direct iframe of fuzz.html
//
let RAW_DATA2 = [
  { id: crypto.randomUUID(), title: "example", content: "example", tags: [] },
  { id: crypto.randomUUID(), title: "example1", content: "example1", tags: [] },
];

let personal_settings = {
  highlightColor: "amber",
  height: 700,
  width: 500,
  top: 5,
  left: 5,
};
let new_personal_settings = {};
let visibleResults = [];
let currentAlgo = "fzf";
let selectedIndex = 0;
let debounceTimer = null;
let copyTimer = null;
let holdTimer = null;
let addBox = null;
let deleteMode = false;
let selectAll = false;

// Tracks RAW_DATA2 indexes of checked items (always numbers)
const checkboxes = new Set();
const HOLD_DURATION = 400;
const GHOST_SNAPBACK_MS = 300;
const colors = {
  amber: {
    bg: "#fde68a",
    text: "#92400e",
    activeBg: "#854d0e",
    activeText: "#fef3c7",
  },
  green: {
    bg: "#bbf7d0",
    text: "#14532d",
    activeBg: "#166534",
    activeText: "#dcfce7",
  },
  blue: {
    bg: "#bfdbfe",
    text: "#1e3a8a",
    activeBg: "#1e40af",
    activeText: "#dbeafe",
  },
  pink: {
    bg: "#fce7f3",
    text: "#831843",
    activeBg: "#9d174d",
    activeText: "#fce7f3",
  },
  coral: {
    bg: "#fed7aa",
    text: "#7c2d12",
    activeBg: "#9a3412",
    activeText: "#ffedd5",
  },
};

let selectedColor = "amber";
// =============================================================
// DOM refs
// =============================================================

const closeButton = document.getElementById("closeInjected");
const input = document.getElementById("search-input");
/** @type {HTMLElement} */
const resultsEl = document.getElementById("results");
const addEl = document.getElementById("addNotesButton");
const numberOfResults = document.getElementById("ff-count");
const deleteEl = document.getElementById("deleteNotesButton");
const deleteGroupEl = document.getElementById("deleteGroup");
const selectToDelete = document.getElementById("selectAllDeleteMode");
const deleteConfirmBtn = document.getElementById("deleteSelectedElements");
const actionBtnsSelectDelete = document.getElementById(
  "actionBtnsSelectDelete",
);
const cancelDeleteSelectBtn = document.getElementById("cancelDeleteSelectBtn");
const confirmDeleteSelectedBtn = document.getElementById(
  "confirmDeleteSelected",
);

const defaultOverlayContainer = document.getElementById("default-overlay");
const hotkeyOverlayContainer = document.getElementById("hotkey-overlay");

// settings elements
const settingOverlayContainer = document.getElementById("setting-overlay");
const showSettingsButton = document.getElementById("showSettings");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const actionBtnsSettings = document.getElementById("actionBtnsSettings");
const confirmSettingsButton = document.getElementById("confirmSettingsButton");
const cancelSettingsButton = document.getElementById("cancelSettingsButton");
const returnFromSettingsButton = document.getElementById("returnFromSettings");

// reset
const resetButton = document.getElementById("resetData");

// tags
const tagDropDown = document.getElementById("tagDropdown");
const toggleProjectTags = document.getElementById("toggleProjectTags");
const tagPopup = document.getElementById("popover");
let selectedTagIndex = 0;
let tagSelecteOn = false;
let tags = [];
/** @type {Array} tags that will be used in render to filter out elements that don't have activeTags */
let activeTags = [];
const currentTagsBox = document.getElementById("tagsAdded");
const addTagBox = document.getElementById("addTagButton");
/** @type {HTMLInputElement | null} */
const addTagInput = document.getElementById("addTagInput");
const addInputTagError = document.getElementById("tagError");
/** @type {HTMLButtonElement} */
const confirmTagInput = document.getElementById("confirmAddTagButton");
// might be better to have a datatset that i will remove the index for tags

const listProjectTags = document.getElementById("itemList");

function handleTagDelete() {
  function handleTagRemoveClick(e) {
    const btn = e.target.closest(".filter-remove");
    if (!btn) return;
    const pill = btn.closest(".filter-pill");
    const index = activeTags.indexOf(btn.dataset.tag);
    if (index !== -1) {
      activeTags.splice(index, 1);
    }
    pill.remove();
    render(search(input.value));
  }
  currentTagsBox.removeEventListener("click", handleTagRemoveClick);
  currentTagsBox.addEventListener("click", handleTagRemoveClick);
}

toggleProjectTags.addEventListener("click", () => {
  tagPopup.classList.toggle("open");
});

function handleAddTagBox() {
  function handleConfirmTag(e) {
    const newTag = addTagInput.value;
    if (newTag.includes(" ") || newTag.includes("/")) {
      addInputTagError.innerText = "No spaces or / allowed";
      addTagInput.classList.add("invalid");
      addInputTagError.classList.add("visible");
      setTimeout(() => {
        if (addTagInput) {
          addTagInput.classList.remove("invalid");
          addInputTagError.classList.remove("visible");
        }
      }, 1500);
      // tag needs to be unique for other functions to work
    } else if (tags.includes(escHtml(newTag))) {
      addInputTagError.innerText = "Already have Tag";
      addTagInput.classList.add("invalid");
      addInputTagError.classList.add("visible");
      setTimeout(() => {
        if (addTagInput) {
          addTagInput.classList.remove("invalid");
          addInputTagError.classList.remove("visible");
        }
      }, 1500);
    } else {
      tags.push(newTag);
      addTagInput.value = "";
      storageManager("update-data", "tags", tags);
      displayProjectTags(tags);
    }
  }
  confirmTagInput.removeEventListener("click", handleConfirmTag);
  confirmTagInput.addEventListener("click", handleConfirmTag);
}

handleAddTagBox();
function searchTags(query) {
  const algo = algos[currentAlgo].fn;
  const results = [];
  const trimmed = query.trim();
  for (let i = 0; i < tags.length; i++) {
    const res = algo(trimmed, tags[i]);
    if (res.matched) {
      results.push({ tag: tags[i], score: res.score });
    }
  }
  if (trimmed) results.sort((a, b) => b.score - a.score);
  console.log("tag results", results);
  return results;
}

function displayProjectTags(tags) {
  const projectTags = tags
    .map((tag) => {
      return `
          <div class="item-row" data-id="${escHtml(tag)}">
            <span class="item-label">${escHtml(tag)}</span>
            <input class="tag-edit"/>
            <div class="tagButtons">
              <button class="icon-btn edit-btn" data-action="start-edit" title="Edit">✎</button>
              <button class="icon-btn delete-btn" data-action="start-delete" title="Delete">🗑</button>
            </div>
            <div class="action-btns">
              <button class="btn confirmTagEditBtn" data-action="confirm" aria-label="Confirm">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="2.5,8 6.5,12 13.5,4" />
                </svg>
              </button>
              <button class="btn cancelTagEditBtn" data-action="cancel" aria-label="Cancel">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" />
                  <line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>
          </div>`;
    })
    .join("");
  listProjectTags.innerHTML = projectTags;
  listProjectTags.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    //fix
    const action = btn.dataset.action;
    const row = btn.closest(".item-row");
    const id = row.dataset.id;
    const actionBtns = row?.querySelector(".action-btns");
    switch (action) {
      case "start-delete":
        row.dataset.mode = "delete";
        row.classList.add("delete");
        actionBtns.classList.add("open");
        break;

      case "start-edit":
        row.dataset.mode = "edit";
        actionBtns.classList.add("open");
        row.querySelector(".tag-edit").value = id;
        row.classList.add("edit");
        break;

      case "confirm":
        if (row.dataset.mode === "delete") {
          confirmDeleteTag(row, id);
          row.classList.remove("delete");
        } else if (row.dataset.mode === "edit") {
          confirmEditTag(row, id);
          actionBtns.classList.remove("open");
        }
        row.dataset.mode = "";
        break;

      case "cancel":
        if (row.dataset.mode === "edit") {
          row.classList.remove("edit");
        } else if (row.dataset.mode === "delete") {
          row.classList.remove("delete");
        }

        actionBtns.classList.remove("open");
        row.dataset.mode = "";
        break;
    }
  });
}

// attach ONCE, outside displayProjectTags, at module init

function confirmDeleteTag(row, id) {
  tags = tags.filter((tag) => tag !== id);
  storageManager("update-data", "tags", tags);
  // TODO: better way to implement
  for (let step = 0; step < RAW_DATA2.length; step++) {
    if (RAW_DATA2[step].tags.includes(id)) {
      RAW_DATA2[step].tags = RAW_DATA2[step].tags.filter((tag) => tag !== id);
    }
  }
  storageManager("update-data", "notes", RAW_DATA2);
  render(search(input.value));
  row.remove();
}

/**
 *
 * @param {HTMLElement} row
 * @param {string} id
 */
function confirmEditTag(row, id) {
  const newTagValue = row.querySelector(".tag-edit").value.trim();
  row.classList.remove("edit");

  // no-op if empty or unchanged
  if (!newTagValue || newTagValue === id) return;

  // guard against duplicate tag names
  if (tags.includes(newTagValue)) {
    // optionally surface this to the user instead of silently bailing
    console.warn(`Tag "${newTagValue}" already exists`);
    return;
  }
  tags = tags.map((tag) => (tag === id ? newTagValue : tag));
  storageManager("update-data", "tags", tags);

  row.dataset.id = newTagValue;

  const label = row.querySelector(".item-label");
  if (label) label.textContent = newTagValue;
}

/**
 *
 * @param {Array<{tag: string, score: number}>} tags
 */
function displayTags(tags) {
  let results = tags
    .map((item, i) => {
      return `<div class="tag-option ${selectedTagIndex == i ? "selected" : ""}">${item.tag}</div>`;
    })
    .join("");
  console.log("display Tags", results);
  tagDropDown.innerHTML = results;
}

// =============================================================
// Utils
// =============================================================

/** Generate a unique id for a new note */
function generateId() {
  return crypto.randomUUID();
}

/** Escape HTML for safe insertion into templates */
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Highlight matched character positions in a string */
function highlight(str, positions) {
  if (!positions || positions.length === 0) return escHtml(str);
  const posSet = new Set(positions);
  return str
    .split("")
    .map((c, i) =>
      posSet.has(i) ? `<mark class="match">${escHtml(c)}</mark>` : escHtml(c),
    )
    .join("");
}

function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), ms);
  };
}

// =============================================================
// Search algorithms
// =============================================================

/**
 * Fuzzy-matches a pattern against a string (fzf-style, case-insensitive,
 * order-preserving). Scores favor start-of-string, consecutive, and
 * post-separator/uppercase matches; penalizes late matches and long strings.
 *
 * @param {string} pattern - Pattern to search for.
 * @param {string} str - String to search within.
 * @returns {{matched: boolean, score?: number, positions?: number[]}}
 */
function fzfMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let pi = 0,
    si = 0;
  const positions = [];

  while (pi < p.length && si < s.length) {
    if (p[pi] === s[si]) {
      positions.push(si);
      pi++;
    }
    si++;
  }
  if (pi < p.length) return { matched: false };

  let score = 0;
  let consecutive = 0;
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (pos === 0) score += 20;
    if (i > 0 && positions[i] === positions[i - 1] + 1) {
      consecutive++;
      score += 15 + consecutive * 5;
    } else {
      consecutive = 0;
    }
    if (pos > 0 && "/._- ".includes(str[pos - 1])) score += 10;
    if (
      str[pos] === str[pos].toUpperCase() &&
      str[pos] !== str[pos].toLowerCase()
    )
      score += 8;
    score -= pos * 0.5;
  }
  score -= str.length * 0.1;
  return { matched: true, score, positions };
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

function subsequencePositions(p, s, startOffset = 0) {
  const positions = [];
  let pi = 0;
  for (let si = startOffset; si < s.length && pi < p.length; si++) {
    if (p[pi] === s[si]) {
      positions.push(si);
      pi++;
    }
  }
  return positions;
}

function levenshteinMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let bestScore = -Infinity;
  let bestPositions = [];

  const wLen = Math.max(p.length, Math.min(p.length * 2, s.length));
  for (let start = 0; start <= s.length - p.length; start++) {
    const sub = s.slice(start, start + wLen);
    const dist = levenshtein(p, sub);
    const sim = 1 - dist / Math.max(p.length, sub.length);
    if (sim > 0.4) {
      const sc = sim * 100 - start * 0.2;
      if (sc > bestScore) {
        bestScore = sc;
        bestPositions = subsequencePositions(p, s, start);
      }
    }
  }

  if (bestScore === -Infinity) return { matched: false };
  return { matched: true, score: bestScore, positions: bestPositions };
}

function trigrams(s) {
  const set = new Set();
  const padded = " " + s + " ";
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

function trigramMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  if (pattern.length < 2) return fzfMatch(pattern, str);
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  const pGrams = trigrams(p);
  const sGrams = trigrams(s);
  const intersection = [...pGrams].filter((g) => sGrams.has(g)).length;
  const sim = (2 * intersection) / (pGrams.size + sGrams.size);
  if (sim < 0.1) return { matched: false };
  return {
    matched: true,
    score: sim * 100 - s.length * 0.05,
    positions: subsequencePositions(p, s),
  };
}

const algos = {
  fzf: { fn: fzfMatch, label: "fzf sequential" },
  levenshtein: { fn: levenshteinMatch, label: "levenshtein distance" },
  trigram: { fn: trigramMatch, label: "trigram similarity" },
};

// =============================================================
// Search
// =============================================================

/**
 * Search RAW_DATA2 using the active fuzzy-match algorithm.
 *
 * NOTE: if `query` starts with '#', a `tagQuery` is derived but not
 * currently used — the function still falls through to matching
 * against `note.title` for every note. Tag-filtering isn't wired up yet.
 *
 * @param {string} query - Raw search input from the search box. Leading/
 *   trailing whitespace is trimmed before matching; a leading '#' is
 *   intended to trigger tag-based filtering (not yet implemented).
 * @returns {Array<{
 *   id: string,
 *   title: string,
 *   content: string,
 *   tags: string[],
 *   score: number,
 *   positions: number[],
 *   rawIndex: number
 * }>} Matching notes, sorted by descending match score when `query` is
 *   non-empty, capped at 200 results. `rawIndex` is the note's position
 *   in RAW_DATA2 at the time of this call.
 */

function search(query) {
  const algo = algos[currentAlgo].fn;
  const results = [];
  const trimmed = query.trim();

  for (let i = 0; i < RAW_DATA2.length; i++) {
    const note = RAW_DATA2[i];
    const res = algo(trimmed, note.title);
    if (res.matched) {
      results.push({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        score: res.score,
        positions: res.positions,
        rawIndex: i, // stable index into RAW_DATA2
      });
    }
  }

  if (trimmed) results.sort((a, b) => b.score - a.score);
  return results.slice(0, 200);
}

// =============================================================
// HTML templates
// =============================================================

function dropDownIconHTML() {
  return `<span class="DropDownIcon">
    <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
  </span>`;
}

function copyIconHTML() {
  return `<div class="copy-group">
    <button class="copy-btn" title="Copy to clipboard">
      <svg class="icon icon-copy" width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <svg class="icon icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>
  </div>`;
}

function editBtnsHTML() {
  return `<div class="edit-btns">
    <button class="btn confirm-btn" aria-label="Save edit">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
        stroke="var(--color-text-success)" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2.5,8 6.5,12 13.5,4"/>
      </svg>
    </button>
    <button class="btn cancel-btn cancelEditBtn" aria-label="Cancel edit">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/>
        <line x1="11" y1="1" x2="1" y2="11"/>
      </svg>
    </button>
  </div>`;
}

function deleteBtnsHTML() {
  return `<div class="delete-group">
    <button class="btn trash-btn" aria-label="Delete">
      <svg class="trash-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3,5 15,5"/>
        <path d="M6 5V3.5A0.5 0.5 0 0 1 6.5 3h5a0.5 0.5 0 0 1 0.5 0.5V5"/>
        <rect x="4" y="5" width="10" height="10" rx="1.5"/>
        <line x1="7" y1="8" x2="7" y2="12"/>
        <line x1="11" y1="8" x2="11" y2="12"/>
      </svg>
    </button>
    <div class="action-btns">
      <button class="btn confirm-btn confirmDeleteBtn" aria-label="Confirm delete">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
          stroke="var(--color-text-success)" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2.5,8 6.5,12 13.5,4"/>
        </svg>
      </button>
      <button class="btn cancel-btn cancelDeleteBtn" aria-label="Cancel delete">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="11" y2="11"/>
          <line x1="11" y1="1" x2="1" y2="11"/>
        </svg>
      </button>
    </div>
  </div>`;
}

function tagsOnNoteHtml(tags, rawIndex) {
  if (!tags || tags.length === 0) return "";
  return `<div class="tags-group">${tags
    .map(
      (t) =>
        `<div class="ff-badge-x">
      <span>${escHtml(t)}</span>
      <button class="tags-group-button" data-raw-index="${rawIndex}" data-tag="${escHtml(t)}" aria-label="Remove tag">&#x2715;</button>
    </div>`,
    )
    .join("")}</div>`;
}

/**
 *
 * @param {EventListener} html
 */
function deleteTagsFromNote(e) {
  const btn = e.target.closest(".tags-group-button");
  if (!btn) return;
  const row = e.target.closest(".ff-badge-x");
  const rawIndex = Number(btn.dataset.rawIndex);
  const tag = btn.dataset.tag;
  RAW_DATA2[rawIndex].tags = RAW_DATA2[rawIndex].tags.filter((t) => t !== tag);
  storageManager("update-data", "notes", RAW_DATA2);
  row.remove();
}

function resultItemHTML(r, i) {
  const isChecked = checkboxes.has(r.rawIndex) ? "checked" : "";
  return `
    <div class="itemContainer" data-raw-index="${r.rawIndex}">
      <div class="itemAndTagBox">
        <div class="item">
        <div class="checkbox-group ${deleteMode ? "active" : ""}">
        <input type="checkbox" class="item-checkbox" data-raw-index="${r.rawIndex}" ${isChecked}/>
        </div>
        <input class="input-key"/>
        <span class="resultText"
        data-raw-index="${r.rawIndex}"
        data-id="${escHtml(r.id)}"
        data-title="${escHtml(r.title)}"
        >${highlight(r.title, r.positions)}</span>
        ${copyIconHTML()}
        <div class="edit-group">
        <button class="edit-btn btn">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81 3.23 11.33a.25.25 0 0 0-.064.108l-.618 2.162 2.162-.618a.25.25 0 0 0 .108-.064L11.19 6.25z" fill="#ffffff"/>
        </svg>
        </button>
        </div>
        ${deleteBtnsHTML()}
        <div class="add-tag-btn-container">
        <button class="add-tag-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#000000" viewBox="0 0 256 256"><path d="M246.66,123.56,201,55.13A15.94,15.94,0,0,0,187.72,48H40A16,16,0,0,0,24,64V192a16,16,0,0,0,16,16H187.72A16,16,0,0,0,201,200.88l45.63-68.44A8,8,0,0,0,246.66,123.56ZM187.72,192H40V64H187.72l42.66,64Z"></path></svg>
        </button>
        </div>
        ${dropDownIconHTML()}
        </div>
        ${tagsOnNoteHtml(r.tags, r.rawIndex)} 
      </div>
      <div class="itemContent">
        <textarea class="input-content"></textarea>
        <p class="contentText" data-content="${escHtml(r.content)}">${escHtml(r.content)}</p>
      </div>
      ${editBtnsHTML()}
    </div>`;
}

// =============================================================
// Render TODO:
// =============================================================

function renderTags(query) {
  console.log("renderTags", query);
}

function render(results) {
  visibleResults = results;
  selectedIndex = 0;
  injectMatchStyle(personal_settings.highlightColor);
  console.log(results);
  resultsEl.innerHTML = results
    .map((item, index) => {
      if (
        activeTags.length === 0 ||
        RAW_DATA2[item.rawIndex].tags.some((t) => activeTags.includes(t))
      ) {
        return resultItemHTML(item, index);
      } else {
        return "";
      }
    })
    .join("");
  updateResultCount();
  attachItemListeners();
  syncSelectAllButton();
  updateSelected(selectedIndex);
}

function updateResultCount() {
  numberOfResults.innerText = deleteMode
    ? `${checkboxes.size} selected`
    : `${visibleResults.length} results`;
}

function syncSelectAllButton() {
  selectToDelete.textContent = selectAll ? "Deselect All" : "Select All";
}

function updateSelected(newIndex) {
  resultsEl.children[selectedIndex]?.classList.remove("selected");
  resultsEl.children[newIndex]?.classList.add("selected");
  selectedIndex = newIndex;
  const sel = resultsEl.querySelector(".selected");
  if (sel) sel.scrollIntoView({ block: "nearest" });
}

// =============================================================
// Item-level listeners (attached per render)
// =============================================================

function attachItemListeners() {
  resultsEl.querySelectorAll(".itemContainer").forEach((el, i) => {
    // toggle show tags
    const tagBtn = el.querySelector(".add-tag-btn");
    const rawIndex = Number(el.dataset.rawIndex);
    tagBtn.addEventListener("click", (el) => {
      showTagPopover(tagBtn, rawIndex);
    });

    const checkBox = el.querySelector(".item-checkbox");
    const resultText = el.querySelector(".resultText");
    const contentText = el.querySelector(".contentText");
    const inputKey = el.querySelector(".input-key");
    const inputContent = el.querySelector(".input-content");
    const copyBtn = el.querySelector(".copy-btn");
    const trashBtn = el.querySelector(".trash-btn");
    const actionBtns = el.querySelector(".action-btns");
    const cancelDeleteBtn = el.querySelector(".cancelDeleteBtn");
    const confirmDeleteBtn = el.querySelector(".confirmDeleteBtn");
    const cancelEditBtn = el.querySelector(".cancelEditBtn");
    const confirmEditBtn = el
      .querySelector(".edit-btns")
      .querySelector(".confirm-btn");
    const editBtn = el.querySelector(".edit-btn");
    const dropDown = el.querySelector(".DropDownIcon");

    // ---- Checkbox ----
    checkBox.addEventListener("click", () => {
      if (checkBox.checked) {
        checkboxes.add(rawIndex);
      } else {
        checkboxes.delete(rawIndex);
      }
      closeDeleteConfirm();
      updateResultCount();
    });

    // ---- Item click (select) ----
    el.querySelector(".item").addEventListener("click", () => {
      updateSelected(i);
    });

    // ---- Trash / delete single ----
    trashBtn.addEventListener("click", () => {
      actionBtns.classList.add("open");
      trashBtn.style.borderColor = "var(--color-border-danger)";
    });

    cancelDeleteBtn.addEventListener("click", () => {
      actionBtns.classList.remove("open");
      trashBtn.style.borderColor = "";
    });

    confirmDeleteBtn.addEventListener("click", () => {
      RAW_DATA2.splice(rawIndex, 1);
      // Remove this index from checkboxes if present, rebuild shifted indexes
      rebuildCheckboxesAfterSplice(rawIndex);
      storageManager("update-data", "notes", RAW_DATA2);
      render(search(input.value));
    });

    // ---- Edit ----
    editBtn.addEventListener("click", () => {
      inputKey.value = resultText.dataset.title;
      inputContent.value = contentText.dataset.content;
      el.classList.add("edit");
    });

    cancelEditBtn.addEventListener("click", () => {
      el.classList.remove("edit");
    });

    confirmEditBtn.addEventListener("click", () => {
      const newTitle = inputKey.value.trim();
      const newContent = inputContent.value;
      if (!newTitle) return;
      const existing = RAW_DATA2[rawIndex];
      RAW_DATA2[rawIndex] = {
        id: existing.id,
        title: newTitle,
        content: newContent,
        tags: existing.tags || [],
      };
      storageManager("update-data", "notes", RAW_DATA2);
      render(search(input.value));
    });

    // ---- Copy ----
    copyBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(contentText.dataset.content)
        .then(() => {})
        .catch((err) => {
          console.error("Error copying to clipboard: ", err);
        });

      copyBtn.classList.add("copied");
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => copyBtn.classList.remove("copied"), 500);
    });

    // ---- Dropdown ----
    dropDown.addEventListener("click", () => el.classList.toggle("open"));
    resultText.addEventListener("dblclick", () => el.classList.toggle("open"));

    // ---- Drag ----
    resultText.addEventListener("mousedown", (e) => {
      e.preventDefault();
      holdTimer = setTimeout(() => startDrag(e, i, el), HOLD_DURATION);
    });
    resultText.addEventListener("mouseup", () => {
      clearTimeout(holdTimer);
      holdTimer = null;
    });
  });
}

/**@type {HTMLElement} */
let addNotesTag = null;

function showTagPopover(triggerEl, currentIndex) {
  // If popover already open for this same trigger, close it and stop
  if (
    addNotesTag &&
    addNotesTag._triggerEl === triggerEl &&
    addNotesTag.isConnected
  ) {
    addNotesTag.remove();
    // addNotesTag = null;
    return;
  }

  let availableTags = tags.length
    ? tags
        .map((tag) => {
          if (!RAW_DATA2[currentIndex].tags.includes(tag)) {
            return `
<div class="add-tag-row" data-tag="${escHtml(tag)}">
  <span class="add-tag-label">${escHtml(tag)}</span>
  <button class="" aria-label="Add tag ${escHtml(tag)}">
  <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
  </button>
</div>
`;
          } else {
            return "";
          }
        })
        .join("")
    : `<div class="add-tag-empty">No tags yet</div>`;

  if (availableTags == "") {
    availableTags = `<div class="add-tag-row"><span class="add-tag-label">No Available Tags To Add</span></div>`;
  }

  // Otherwise close whatever's open and open a new one
  if (addNotesTag) {
    addNotesTag.remove();
    addNotesTag.innerHTML = availableTags;
    const rect = triggerEl.getBoundingClientRect();
    addNotesTag.style.position = "absolute";
    addNotesTag.style.top = `${rect.bottom + 4}px`;
    addNotesTag.style.right = `${window.innerWidth - rect.right}px`;
    addNotesTag.style.zIndex = "9999";
    addNotesTag._rawIndex = currentIndex;
    addNotesTag._triggerEl = triggerEl;
    document.body.appendChild(addNotesTag);
    return;
  }

  const popover = document.createElement("div");
  popover.className = "add-tag-btn-popover";
  popover.innerHTML = availableTags;

  // popover.textContent = "testing here";
  document.body.appendChild(popover);

  const rect = triggerEl.getBoundingClientRect();

  popover.style.position = "absolute";
  popover.style.top = `${rect.bottom + 4}px`;
  popover.style.right = `${window.innerWidth - rect.right}px`;
  popover.style.zIndex = "9999";

  popover._triggerEl = triggerEl; // remember who opened this
  popover._rawIndex = currentIndex;
  addNotesTag = popover;

  addNotesTag.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-tag-row button");
    if (!btn) return;
    const row = btn.closest(".add-tag-row");
    const tag = row?.dataset.tag;
    RAW_DATA2[addNotesTag._rawIndex].tags.push(tag);
    storageManager("update-data", "notes", RAW_DATA2);
    row.remove();
    render(search(input.value));
  });

  return popover;
}

function handleAddTagToNote(tag, tagBtn) {
  if (tagBtn.dataset.pending === "true") return; // already processing
  tagBtn.dataset.pending = "true";

  // your actual logic here — sync or async
  addTagToNoteData(tag, tagBtn).finally(() => {
    delete tagBtn.dataset.pending;
  });
}

// TODO: better way to trigger showtag will refactor
// document.addEventListener("click", (e) => {
//   if (!addNotesTag) return;
//   if (
//     e.target.closest(".add-tag-btn-popover") ||
//     e.target.closest(".add-tag-btn")
//   )
//     return;
//   addNotesTag.remove();
//   addNotesTag = null;
// });

/**
 * After splicing at `removedIndex`, any checkboxes referencing higher
 * indexes need to shift down by 1.
 */
function rebuildCheckboxesAfterSplice(removedIndex) {
  const updated = new Set();
  for (const idx of checkboxes) {
    if (idx < removedIndex) updated.add(idx);
    else if (idx > removedIndex) updated.add(idx - 1);
    // idx === removedIndex is dropped (item no longer exists)
  }
  checkboxes.clear();
  for (const idx of updated) checkboxes.add(idx);
}

// =============================================================
// Delete mode — select all
// =============================================================

function toggleSelectAll() {
  selectAll = !selectAll;
  closeDeleteConfirm();

  const allCheckboxes = document.querySelectorAll(".item-checkbox");
  checkboxes.clear();

  allCheckboxes.forEach((cb) => {
    cb.checked = selectAll;
    if (selectAll) {
      checkboxes.add(Number(cb.dataset.rawIndex));
    }
  });

  syncSelectAllButton();
  updateResultCount();
}

function closeDeleteConfirm() {
  actionBtnsSelectDelete.classList.remove("open");
  deleteConfirmBtn.style.borderColor = "";
}

// Attach once — remove+add prevents duplicates on re-render
function bindSelectAllListener() {
  selectToDelete.removeEventListener("click", toggleSelectAll);
  selectToDelete.addEventListener("click", toggleSelectAll);
}

// =============================================================
// Drag and drop
// =============================================================

const overlay = document.createElement("div");
overlay.style.cssText =
  "display:none;position:fixed;inset:0;cursor:grabbing;z-index:99999";
document.body.appendChild(overlay);

let dragIdx = null;
let hoverIdx = null;
let ghostEl = null;
let offsetX = 0;
let offsetY = 0;
let itemHeight = 0;

function startDrag(e, idx, liEl) {
  dragIdx = idx;
  hoverIdx = idx;
  resultsEl
    .querySelectorAll(".itemContainer")
    .forEach((el) => el.classList.remove("open"));

  itemHeight = liEl.querySelector(".item").offsetHeight;
  overlay.style.display = "block";

  const rect = liEl.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  ghostEl = document.createElement("div");
  ghostEl.className = "drag-ghost-el";
  ghostEl.style.cssText = `height:${itemHeight}px;width:${liEl.offsetWidth}px;left:${e.clientX - offsetX}px;top:${e.clientY - offsetY}px`;
  ghostEl.innerHTML = liEl.cloneNode(true).innerHTML;
  document.body.appendChild(ghostEl);

  liEl.classList.add("is-dragging");

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  if (!ghostEl) return;
  ghostEl.style.left = `${e.clientX - offsetX}px`;
  ghostEl.style.top = `${e.clientY - offsetY}px`;

  const relY = e.clientY - resultsEl.getBoundingClientRect().top;
  const newHover = Math.max(
    0,
    Math.min(visibleResults.length - 1, Math.floor(relY / itemHeight)),
  );
  if (newHover !== hoverIdx) {
    hoverIdx = newHover;
    applyDragTransforms(dragIdx, hoverIdx);
  }
}

function onMouseUp() {
  clearTimeout(holdTimer);
  overlay.style.display = "none";
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);

  if (dragIdx !== null && hoverIdx !== null && dragIdx !== hoverIdx) {
    const [moved] = RAW_DATA2.splice(dragIdx, 1);
    RAW_DATA2.splice(hoverIdx, 0, moved);
    storageManager("update-data", "notes", RAW_DATA2);
  }

  snapBack(ghostEl, resultsEl.children[hoverIdx]);
  if (resultsEl.children[hoverIdx]) {
    resultsEl.children[hoverIdx].classList.remove("is-dragging");
  }
  dragIdx = null;
  hoverIdx = null;
}

function snapBack(source, target) {
  if (!source || !target) {
    if (source) source.remove();
    return;
  }
  const to = target.getBoundingClientRect();
  const dy =
    resultsEl.offsetTop +
    hoverIdx * itemHeight -
    source.getBoundingClientRect().top;

  const anim = source.animate(
    [
      { transform: "translate(0,0)" },
      {
        transform: `translate(${to.left - source.getBoundingClientRect().left}px, ${dy}px)`,
      },
    ],
    {
      duration: GHOST_SNAPBACK_MS,
      easing: "cubic-bezier(0.34,1.56,0.64,1)",
      fill: "forwards",
    },
  );

  anim.onfinish = () => {
    source.remove();
    ghostEl = null;
    setTimeout(() => render(search(input.value)), 50);
  };
}

function applyDragTransforms(from, to) {
  const lis = document.querySelectorAll(".itemContainer");
  const order = RAW_DATA2.map((_, i) => i);
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);

  lis.forEach((li, origIdx) => {
    if (origIdx === from) {
      li.style.transform = "";
      return;
    }
    const shift = order.indexOf(origIdx) - origIdx;
    li.style.transform =
      shift !== 0 ? `translateY(${shift * itemHeight}px)` : "";
  });
}

// =============================================================
// Add note
// =============================================================

function createAddBox() {
  const el = document.createElement("div");
  el.className = "itemContainer edit";
  el.innerHTML = `
    <div class="item">
      <input class="input-key" placeholder="Title"/>
    </div>
    <div class="itemContent">
      <textarea class="input-content" placeholder="Content"></textarea>
    </div>
    <div class="edit-btns">
      <button class="btn confirm-btn" aria-label="Save">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
        stroke="var(--color-text-success)" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2.5,8 6.5,12 13.5,4"/>
        </svg>
      </button>
      <button class="btn cancel-btn" aria-label="Cancel">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11"/>
        <line x1="11" y1="1" x2="1" y2="11"/>
        </svg>
      </button>
    </div>
    `;

  el.querySelector(".confirm-btn").addEventListener("click", () => {
    const title = el.querySelector(".input-key").value.trim();
    const content = el.querySelector(".input-content").value;
    if (!title) return;
    RAW_DATA2.push({ id: generateId(), title, content, tags: [] });
    storageManager("update-data", "notes", RAW_DATA2);
    closeAddBox();
    render(search(input.value));
  });

  el.querySelector(".cancel-btn").addEventListener("click", closeAddBox);
  return el;
}

function closeAddBox() {
  if (addBox) {
    addBox.remove();
    addBox = null;
  }
}

// =============================================================
// Delete mode
// =============================================================

function initDeleteMode() {
  deleteEl.addEventListener("click", () => {
    deleteMode = !deleteMode;
    deleteEl.classList.toggle("active", deleteMode);
    addEl.style.display = deleteMode ? "none" : "flex";
    deleteGroupEl.classList.toggle("active", deleteMode);
    checkboxes.clear();
    selectAll = false;
    render(search(input.value));
    bindSelectAllListener();
  });

  deleteConfirmBtn.addEventListener("click", () => {
    deleteConfirmBtn.style.borderColor = "var(--color-border-danger)";
    actionBtnsSelectDelete.classList.add("open");
  });

  confirmDeleteSelectedBtn.addEventListener("click", () => {
    closeDeleteConfirm();
    if (checkboxes.size === 0) return;
    const deleted = checkboxes.size;
    // Filter out checked items (checkboxes stores RAW_DATA2 indexes)
    RAW_DATA2 = RAW_DATA2.filter((_, i) => !checkboxes.has(i));
    checkboxes.clear();
    selectAll = false;
    storageManager("update-data", "notes", RAW_DATA2);
    render(search(input.value));
    closeDeleteConfirm();
    numberOfResults.textContent = `${deleted} notes deleted`;
  });

  cancelDeleteSelectBtn.addEventListener("click", closeDeleteConfirm);
}

// =============================================================
// Keyboard shortcuts
// =============================================================

function intializeKeyMaps() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "/") {
      showHotKeys();
    }

    if (e.ctrlKey && e.key === "a") {
      if (!addEl || addBox) return;
      addBox = createAddBox();
      resultsEl.prepend(addBox);
    }

    if (e.ctrlKey && e.key === "q") input.focus();

    if (e.key === "Escape" || (e.ctrlKey && e.key === "q")) {
      window.parent.postMessage({ action: "hide-iframe" }, "*");
    }

    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "j")) {
      if (tagSelecteOn) {
        let newIndex = Math.min(
          selectedTagIndex + 1,
          tagDropDown.children.length,
        );
        tagDropDown.children[selectedTagIndex].classList.remove("selected");
        tagDropDown.children[newIndex].classList.add("selected");
        selectedTagIndex = newIndex;
      } else {
        e.preventDefault();
        let newIndex = Math.min(selectedIndex + 1, visibleResults.length - 1);
        updateSelected(newIndex);
      }
    }

    if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "k")) {
      if (tagSelecteOn) {
        let newIndex = Math.max(selectedTagIndex - 1, 0);
        tagDropDown.children[selectedTagIndex].classList.remove("selected");
        tagDropDown.children[newIndex].classList.add("selected");
        selectedTagIndex = newIndex;
      } else {
        e.preventDefault();
        let newIndex = Math.max(selectedIndex - 1, 0);
        updateSelected(newIndex);
      }
    }

    if (e.key === "Enter") {
      if (tagSelecteOn) {
        const selectedTag = tagDropDown.children[selectedTagIndex]?.textContent;
        activeTags.push(selectedTag);
        tagDropDown.classList.remove("active");
        input.value = "";
        console.log(activeTags);
        const tagsBoxes = activeTags
          .map((value, i) => {
            return `
      <div class="filter-pill">
          <button data-tag="${value}" class="filter-remove" aria-label="Remove filter">×</button>
          <span class="filter-text">${value}</span>
      </div>
    `;
          })
          .join("");

        currentTagsBox.innerHTML = tagsBoxes;
        render(search(input.value));
      } else {
        resultsEl.children[selectedIndex]?.classList.toggle("open");
      }
    }

    if (e.ctrlKey && e.key === "c") {
      const item = visibleResults[selectedIndex];
      if (!item) return;
      navigator.clipboard
        .writeText(item.content)
        .then(() => {})
        .catch((err) => {
          console.error("Error copying to clipboard: ", err);
        });

      const copyBtn =
        resultsEl.children[selectedIndex]?.querySelector(".copy-btn");
      if (copyBtn) {
        copyBtn.classList.add("copied");
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => copyBtn.classList.remove("copied"), 500);
      }
    }
  });

  closeButton?.addEventListener("click", () => {
    window.parent.postMessage({ action: "hide-iframe" }, "*");
  });
}

// =============================================================
// Search input
// =============================================================

function initSearch() {
  input.addEventListener(
    "input",
    debounce(() => {
      if (input.value[0] === "/") {
        selectedTagIndex = 0;
        tagSelecteOn = true;
        tagDropDown.classList.add("active");
        displayTags(searchTags(input.value.slice(1)));
      } else {
        tagDropDown.classList.remove("active");
        tagSelecteOn = false;
        displayTags([]);
        render(search(input.value));
      }
      requestAnimationFrame(() => {
        bindSelectAllListener();

        // Re-check boxes if selectAll is active
        if (selectAll) {
          const allCbs = document.querySelectorAll(".item-checkbox");
          checkboxes.clear();
          allCbs.forEach((cb) => {
            cb.checked = true;
            checkboxes.add(Number(cb.dataset.rawIndex));
          });
          updateResultCount();
        }

        if (addBox) closeAddBox();
      });
    }, 10),
  );
}

// =============================================================
// Add button
// =============================================================

function initAddButton() {
  addEl.addEventListener("click", () => {
    if (addBox) return;
    addBox = createAddBox();
    resultsEl.prepend(addBox);
  });
}

// =============================================================
// settings
// =============================================================

function showHotKeys() {
  defaultOverlayContainer.classList.toggle("hidden");
  hotkeyOverlayContainer.classList.toggle("hidden");
}
showSettingsButton.addEventListener("click", showSettings);
function showSettings() {
  defaultOverlayContainer.classList.add("hidden");
  hotkeyOverlayContainer.classList.add("hidden");
  settingOverlayContainer.classList.remove("hidden");
  new_personal_settings = JSON.parse(JSON.stringify(personal_settings));
  document.querySelectorAll(".ff-hl-swatch").forEach((el) => {
    el.classList.remove("selected");
    if (el.dataset.color === new_personal_settings["highlightColor"]) {
      el.classList.add("selected");
    }
  });
}

function initColorPicker() {
  document.querySelectorAll(".ff-hl-swatch").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".ff-hl-swatch")
        .forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");
      saveSettingsButton.style.display = "block";
      new_personal_settings["highlightColor"] = el.dataset.color;
    });
  });
}

returnFromSettingsButton.addEventListener("click", closeSettings);
function closeSettings() {
  defaultOverlayContainer.classList.remove("hidden");
  hotkeyOverlayContainer.classList.add("hidden");
  settingOverlayContainer.classList.add("hidden");
  saveSettingsButton.style.display = "none";
  render(search(input.value));
}

function injectMatchStyle(color) {
  let el = document.getElementById("match-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "match-style";
    document.head.appendChild(el);
  }
  const c = colors[color];
  el.textContent = `
      .match { background: ${c.bg}; color: ${c.text}; border-radius: 2px; padding: 0 1px; }
    `;
}

saveSettingsButton.addEventListener("click", () => {
  if (!actionBtnsSettings.classList.contains("open")) {
    actionBtnsSettings.classList.add("open");
  }
});

confirmSettingsButton.addEventListener("click", () => {
  actionBtnsSettings.classList.remove("open");
  storageManager("update-data", "personal_settings", new_personal_settings);
  personal_settings = JSON.parse(JSON.stringify(new_personal_settings));
  saveSettingsButton.style.display = "none";
});

cancelSettingsButton.addEventListener("click", () => {
  actionBtnsSettings.classList.remove("open");
});

// =============================================================
// Messaging / init
// =============================================================

function storageManager(action, key, data) {
  if (action === "update-data") {
    window.parent.postMessage({ action, key, data }, "*");
  }
}

function postMessageToParent(action, data) {
  window.parent.postMessage({ action, data }, "*");
}

function intializeApp() {
  window.addEventListener("message", (event) => {
    if (event.data.type === "FROM_CONTENT") {
      input.focus();
    }
    if (event.data.action === "initializeIframe") {
      RAW_DATA2 = event.data.notes;
      personal_settings = event.data.personal_settings;
      tags = event.data.tags;
      console.log("tags", tags);
      render(search(input.value));
      displayProjectTags(tags);
      intializeKeyMaps();
      initSearch();
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    window.parent.postMessage({ action: "iframeReady" }, "*");
  });
}

// =============================================================
// Boot
// =============================================================
initAddButton();
initDeleteMode();
intializeApp();
initColorPicker();

function resetData() {
  resetButton.addEventListener("click", () => {
    tags = ["one", "two", "there"];
    RAW_DATA2 = [
      { id: generateId(), title: "example", content: "example", tags: [] },
      { id: generateId(), title: "example1", content: "example1", tags: [] },
      {
        id: generateId(),
        title: "example2",
        content: "a second example variant",
        tags: [],
      },
      { id: generateId(), title: "Hello", content: "Hello world", tags: [] },
      { id: generateId(), title: "hello", content: "hello there", tags: [] },
      {
        id: generateId(),
        title: "helllo",
        content: "typo test - extra l",
        tags: [],
      },
      {
        id: generateId(),
        title: "Hallo",
        content: "German greeting",
        tags: [],
      },
      {
        id: generateId(),
        title: "javascript snippet",
        content: 'const x = () => console.log("test")',
        tags: ["javascript"],
      },
      {
        id: generateId(),
        title: "js snippet",
        content: "short alias for the above",
        tags: ["javascript"],
      },
      {
        id: generateId(),
        title: "meeting notes",
        content: "Discussed Q3 roadmap and budget",
        tags: ["work"],
      },
      {
        id: generateId(),
        title: "grocery list",
        content: "milk, eggs, bread, coffee",
        tags: [],
      },
      {
        id: generateId(),
        title: "todo",
        content: "finish fuzzy search implementation",
        tags: ["work"],
      },
      {
        id: generateId(),
        title: "password reset",
        content: "security question flow notes",
        tags: [],
      },
      {
        id: generateId(),
        title: "quick brown fox",
        content: "jumps over the lazy dog",
        tags: [],
      },
      {
        id: generateId(),
        title: "api key",
        content: "sk-test-1234567890abcdef",
        tags: [],
      },
      { id: generateId(), title: "", content: "empty key edge case", tags: [] },
      {
        id: generateId(),
        title: "a",
        content: "single character key",
        tags: [],
      },
      {
        id: generateId(),
        title:
          "very long key name that goes on for a while to test truncation behavior",
        content:
          "long value too, this one also has a lot of text to see how it wraps or truncates in the UI when rendered",
        tags: [],
      },
    ];
    personal_settings = {
      highlightColor: "amber",
      height: 700,
      width: 500,
      top: 5,
      left: 5,
    };
    storageManager("update-data", "notes", RAW_DATA2);
    storageManager("update-data", "personal_settings", personal_settings);
    storageManager("update-data", "tags", tags);
    render(search(input.value));
  });
}

resetData();
handleTagDelete();

resultsEl.addEventListener("click", deleteTagsFromNote);
