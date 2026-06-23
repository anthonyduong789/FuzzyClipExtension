// =============================================================
// State
// google storage
// notes = RAW_DATA2-> [{}, {}, {}]
// personal_settings = {"highlight color": "selectedColor"}
// 
// =============================================================

let RAW_DATA2 = [
  { key: 'example', value: 'example' },
  { key: 'example1', value: 'example1' },
];

let personal_settings = { "highlightColor": "amber" };
let new_personal_settings = {};

let visibleResults = [];
let currentAlgo = 'fzf';
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
  amber: { bg: '#fde68a', text: '#92400e', activeBg: '#854d0e', activeText: '#fef3c7' },
  green: { bg: '#bbf7d0', text: '#14532d', activeBg: '#166534', activeText: '#dcfce7' },
  blue: { bg: '#bfdbfe', text: '#1e3a8a', activeBg: '#1e40af', activeText: '#dbeafe' },
  pink: { bg: '#fce7f3', text: '#831843', activeBg: '#9d174d', activeText: '#fce7f3' },
  coral: { bg: '#fed7aa', text: '#7c2d12', activeBg: '#9a3412', activeText: '#ffedd5' },
};

let selectedColor = 'amber';
// =============================================================
// DOM refs
// =============================================================

const closeButton = document.getElementById('closeInjected');
const input = document.getElementById('search-input');
const resultsEl = document.getElementById('results');
const addEl = document.getElementById('addNotesButton');
const numberOfResults = document.getElementById('ff-count');
const deleteEl = document.getElementById('deleteNotesButton');
const deleteGroupEl = document.getElementById('deleteGroup');
const selectToDelete = document.getElementById('selectAllDeleteMode');
const deleteConfirmBtn = document.getElementById('deleteSelectedElements');
const actionBtnsSelectDelete = document.getElementById('actionBtnsSelectDelete');
const cancelDeleteSelectBtn = document.getElementById('cancelDeleteSelectBtn');
const confirmDeleteSelectedBtn = document.getElementById('confirmDeleteSelected');

const defaultOverlayContainer = document.getElementById('default-overlay');
const hotkeyOverlayContainer = document.getElementById('hotkey-overlay');

// settings elements
const settingOverlayContainer = document.getElementById('setting-overlay');
const showSettingsButton = document.getElementById('showSettings');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const actionBtnsSettings = document.getElementById('actionBtnsSettings');
const confirmSettingsButton = document.getElementById('confirmSettingsButton');
const cancelSettingsButton = document.getElementById('cancelSettingsButton');
const returnFromSettingsButton = document.getElementById('returnFromSettings');



// =============================================================
// Utils
// =============================================================

/** Escape HTML for safe insertion into templates */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Highlight matched character positions in a string */
function highlight(str, positions) {
  if (!positions || positions.length === 0) return escHtml(str);
  const posSet = new Set(positions);
  return str
    .split('')
    .map((c, i) => (posSet.has(i) ? `<mark class="match">${escHtml(c)}</mark>` : escHtml(c)))
    .join('');
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

function fzfMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let pi = 0, si = 0;
  const positions = [];

  while (pi < p.length && si < s.length) {
    if (p[pi] === s[si]) { positions.push(si); pi++; }
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
    if (pos > 0 && '/._- '.includes(str[pos - 1])) score += 10;
    if (str[pos] === str[pos].toUpperCase() && str[pos] !== str[pos].toLowerCase()) score += 8;
    score -= pos * 0.5;
  }
  score -= str.length * 0.1;
  return { matched: true, score, positions };
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
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
    if (p[pi] === s[si]) { positions.push(si); pi++; }
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
  const padded = ' ' + s + ' ';
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
  fzf: { fn: fzfMatch, label: 'fzf sequential' },
  levenshtein: { fn: levenshteinMatch, label: 'levenshtein distance' },
  trigram: { fn: trigramMatch, label: 'trigram similarity' },
};

// =============================================================
// Search
// =============================================================

/**
 * Search RAW_DATA2 with the active algorithm.
 * Returns results with a stable `rawIndex` pointing to the item's
 * position in RAW_DATA2 at the time of the search.
 */
function search(query) {
  const algo = algos[currentAlgo].fn;
  const results = [];
  const trimmed = query.trim();

  for (let i = 0; i < RAW_DATA2.length; i++) {
    const note = RAW_DATA2[i];
    const res = algo(trimmed, note.key);
    if (res.matched) {
      results.push({
        key: note.key,
        value: note.value,
        score: res.score,
        positions: res.positions,
        rawIndex: i,          // stable index into RAW_DATA2
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

function resultItemHTML(r, i) {
  const isChecked = checkboxes.has(r.rawIndex) ? 'checked' : '';
  return `
    <div class="itemContainer ${i === 0 ? 'selected' : ''}">
      <div class="item">
        <div class="checkbox-group ${deleteMode ? 'active' : ''}">
          <input type="checkbox" class="item-checkbox" data-raw-index="${r.rawIndex}" ${isChecked}/>
        </div>
        <input class="input-key"/>
        <span class="resultText"
          data-raw-index="${r.rawIndex}"
          data-key="${escHtml(r.key)}"
        >${highlight(r.key, r.positions)}</span>
        ${copyIconHTML()}
        <div class="edit-group">
          <button class="edit-btn btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81 3.23 11.33a.25.25 0 0 0-.064.108l-.618 2.162 2.162-.618a.25.25 0 0 0 .108-.064L11.19 6.25z" fill="#ffffff"/>
            </svg>
          </button>
        </div>
        ${deleteBtnsHTML()}
        ${dropDownIconHTML()}
      </div>
      <div class="itemContent">
        <textarea class="input-content"></textarea>
        <p class="contentText" data-content="${escHtml(r.value)}">${escHtml(r.value)}</p>
      </div>
      ${editBtnsHTML()}
    </div>`;
}

// =============================================================
// Render
// =============================================================

function render(results) {
  visibleResults = results;
  selectedIndex = 0;
  injectMatchStyle(personal_settings.highlightColor);
  resultsEl.innerHTML = results.map(resultItemHTML).join('');
  updateResultCount();
  attachItemListeners();
  syncSelectAllButton();
}

function updateResultCount() {
  numberOfResults.innerText = deleteMode
    ? `${checkboxes.size} selected`
    : `${visibleResults.length} results`;
}

function syncSelectAllButton() {
  selectToDelete.textContent = selectAll ? 'Deselect All' : 'Select All';
}

function updateSelected() {
  resultsEl.querySelectorAll('.itemContainer').forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
  });
  const sel = resultsEl.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

// =============================================================
// Item-level listeners (attached per render)
// =============================================================

function attachItemListeners() {
  resultsEl.querySelectorAll('.itemContainer').forEach((el, i) => {
    const checkBox = el.querySelector('.item-checkbox');
    const resultText = el.querySelector('.resultText');
    const contentText = el.querySelector('.contentText');
    const inputKey = el.querySelector('.input-key');
    const inputContent = el.querySelector('.input-content');
    const copyBtn = el.querySelector('.copy-btn');
    const trashBtn = el.querySelector('.trash-btn');
    const actionBtns = el.querySelector('.action-btns');
    const cancelDeleteBtn = el.querySelector('.cancelDeleteBtn');
    const confirmDeleteBtn = el.querySelector('.confirmDeleteBtn');
    const cancelEditBtn = el.querySelector('.cancelEditBtn');
    const confirmEditBtn = el.querySelector('.edit-btns').querySelector('.confirm-btn');
    const editBtn = el.querySelector('.edit-btn');
    const dropDown = el.querySelector('.DropDownIcon');
    const rawIndex = Number(resultText.dataset.rawIndex);

    // ---- Checkbox ----
    checkBox.addEventListener('click', () => {
      if (checkBox.checked) {
        checkboxes.add(rawIndex);
      } else {
        checkboxes.delete(rawIndex);
      }
      closeDeleteConfirm();
      updateResultCount();
    });

    // ---- Item click (select) ----
    el.querySelector('.item').addEventListener('click', () => {
      selectedIndex = i;
      updateSelected();
    });

    // ---- Trash / delete single ----
    trashBtn.addEventListener('click', () => {
      actionBtns.classList.add('open');
      trashBtn.style.borderColor = 'var(--color-border-danger)';
    });

    cancelDeleteBtn.addEventListener('click', () => {
      actionBtns.classList.remove('open');
      trashBtn.style.borderColor = '';
    });

    confirmDeleteBtn.addEventListener('click', () => {
      RAW_DATA2.splice(rawIndex, 1);
      // Remove this index from checkboxes if present, rebuild shifted indexes
      rebuildCheckboxesAfterSplice(rawIndex);
      storageManager('update-data', 'notes', RAW_DATA2);
      render(search(input.value));
    });

    // ---- Edit ----
    editBtn.addEventListener('click', () => {
      inputKey.value = resultText.dataset.key;
      inputContent.value = contentText.dataset.content;
      el.classList.add('edit');
    });

    cancelEditBtn.addEventListener('click', () => {
      el.classList.remove('edit');
    });

    console.log(confirmEditBtn);
    confirmEditBtn.addEventListener('click', () => {
      const newKey = inputKey.value.trim();
      const newValue = inputContent.value;
      if (!newKey) return;
      RAW_DATA2[rawIndex] = { key: newKey, value: newValue };
      storageManager('update-data', 'notes', RAW_DATA2);
      console.log("updated-data");
      render(search(input.value));
    });

    // ---- Copy ----
    copyBtn.addEventListener('click', () => {
      postMessageToParent('copy-to-clipboard', { text: contentText.dataset.content });
      copyBtn.classList.add('copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => copyBtn.classList.remove('copied'), 500);
    });

    // ---- Dropdown ----
    dropDown.addEventListener('click', () => el.classList.toggle('open'));
    resultText.addEventListener('dblclick', () => el.classList.toggle('open'));

    // ---- Drag ----
    resultText.addEventListener('mousedown', (e) => {
      e.preventDefault();
      holdTimer = setTimeout(() => startDrag(e, i, el), HOLD_DURATION);
    });
    resultText.addEventListener('mouseup', () => {
      clearTimeout(holdTimer);
      holdTimer = null;
    });
  });
}

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

  const allCheckboxes = document.querySelectorAll('.item-checkbox');
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
  actionBtnsSelectDelete.classList.remove('open');
  deleteConfirmBtn.style.borderColor = '';
}

// Attach once — remove+add prevents duplicates on re-render
function bindSelectAllListener() {
  selectToDelete.removeEventListener('click', toggleSelectAll);
  selectToDelete.addEventListener('click', toggleSelectAll);
}

// =============================================================
// Drag and drop
// =============================================================

const overlay = document.createElement('div');
overlay.style.cssText = 'display:none;position:fixed;inset:0;cursor:grabbing;z-index:99999';
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
  resultsEl.querySelectorAll('.itemContainer').forEach((el) => el.classList.remove('open'));

  itemHeight = liEl.querySelector('.item').offsetHeight;
  overlay.style.display = 'block';

  const rect = liEl.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  ghostEl = document.createElement('div');
  ghostEl.className = 'drag-ghost-el';
  ghostEl.style.cssText = `height:${itemHeight}px;width:${liEl.offsetWidth}px;left:${e.clientX - offsetX}px;top:${e.clientY - offsetY}px`;
  ghostEl.innerHTML = liEl.cloneNode(true).innerHTML;
  document.body.appendChild(ghostEl);

  liEl.classList.add('is-dragging');

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!ghostEl) return;
  ghostEl.style.left = `${e.clientX - offsetX}px`;
  ghostEl.style.top = `${e.clientY - offsetY}px`;

  const relY = e.clientY - resultsEl.getBoundingClientRect().top;
  const newHover = Math.max(0, Math.min(visibleResults.length - 1, Math.floor(relY / itemHeight)));
  if (newHover !== hoverIdx) {
    hoverIdx = newHover;
    applyDragTransforms(dragIdx, hoverIdx);
  }
}

function onMouseUp() {
  clearTimeout(holdTimer);
  overlay.style.display = 'none';
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  if (dragIdx !== null && hoverIdx !== null && dragIdx !== hoverIdx) {
    const [moved] = RAW_DATA2.splice(dragIdx, 1);
    RAW_DATA2.splice(hoverIdx, 0, moved);
    storageManager('update-data', 'notes', RAW_DATA2);
  }

  snapBack(ghostEl, resultsEl.children[hoverIdx]);
  if (resultsEl.children[hoverIdx]) {
    resultsEl.children[hoverIdx].classList.remove('is-dragging');
  }
  dragIdx = null;
  hoverIdx = null;
}

function snapBack(source, target) {
  if (!source || !target) { if (source) source.remove(); return; }
  const to = target.getBoundingClientRect();
  const dy = resultsEl.offsetTop + hoverIdx * itemHeight - source.getBoundingClientRect().top;

  const anim = source.animate([
    { transform: 'translate(0,0)' },
    { transform: `translate(${to.left - source.getBoundingClientRect().left}px, ${dy}px)` },
  ], { duration: GHOST_SNAPBACK_MS, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });

  anim.onfinish = () => {
    source.remove();
    ghostEl = null;
    setTimeout(() => render(search(input.value)), 50);
  };
}

function applyDragTransforms(from, to) {
  const lis = document.querySelectorAll('.itemContainer');
  const order = RAW_DATA2.map((_, i) => i);
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);

  lis.forEach((li, origIdx) => {
    if (origIdx === from) { li.style.transform = ''; return; }
    const shift = order.indexOf(origIdx) - origIdx;
    li.style.transform = shift !== 0 ? `translateY(${shift * itemHeight}px)` : '';
  });
}

// =============================================================
// Add note
// =============================================================

function createAddBox() {
  const el = document.createElement('div');
  el.className = 'itemContainer edit';
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

  el.querySelector('.confirm-btn').addEventListener('click', () => {
    const key = el.querySelector('.input-key').value.trim();
    const value = el.querySelector('.input-content').value;
    if (!key) return;
    RAW_DATA2.push({ key, value });
    storageManager('update-data', 'notes', RAW_DATA2);
    closeAddBox();
    render(search(input.value));
  });

  el.querySelector('.cancel-btn').addEventListener('click', closeAddBox);
  return el;
}

function closeAddBox() {
  if (addBox) { addBox.remove(); addBox = null; }
}

// =============================================================
// Delete mode
// =============================================================

function initDeleteMode() {
  deleteEl.addEventListener('click', () => {
    deleteMode = !deleteMode;
    deleteEl.classList.toggle('active', deleteMode);
    addEl.style.display = deleteMode ? 'none' : 'flex';
    deleteGroupEl.classList.toggle('active', deleteMode);
    checkboxes.clear();
    selectAll = false;
    render(search(input.value));
    bindSelectAllListener();
  });

  deleteConfirmBtn.addEventListener('click', () => {
    deleteConfirmBtn.style.borderColor = 'var(--color-border-danger)';
    actionBtnsSelectDelete.classList.add('open');
  });

  confirmDeleteSelectedBtn.addEventListener('click', () => {
    if (checkboxes.size === 0) return;
    const deleted = checkboxes.size;
    // Filter out checked items (checkboxes stores RAW_DATA2 indexes)
    RAW_DATA2 = RAW_DATA2.filter((_, i) => !checkboxes.has(i));
    checkboxes.clear();
    selectAll = false;
    storageManager('update-data', 'notes', RAW_DATA2);
    render(search(input.value));
    closeDeleteConfirm();
    numberOfResults.textContent = `${deleted} notes deleted`;
  });

  cancelDeleteSelectBtn.addEventListener('click', closeDeleteConfirm);
}

// =============================================================
// Keyboard shortcuts
// =============================================================

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '?') {
      showHotKeys();
    }

    if (e.ctrlKey && e.key === 'a') {
      if (!addEl || addBox) return;
      addBox = createAddBox();
      resultsEl.prepend(addBox);
    }

    if (e.ctrlKey && e.key === 'q') input.focus();

    if (e.key === 'Escape') {
      window.parent.postMessage({ action: 'hide-iframe' }, '*');
    }

    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, visibleResults.length - 1);
      updateSelected();
    }

    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelected();
    }

    if (e.key === 'Enter') {
      resultsEl.children[selectedIndex]?.classList.toggle('open');
    }

    if (e.ctrlKey && e.key === 'c') {
      const item = visibleResults[selectedIndex];
      if (!item) return;
      postMessageToParent('copy-to-clipboard', { text: item.value });
      const copyBtn = resultsEl.children[selectedIndex]?.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => copyBtn.classList.remove('copied'), 500);
      }
    }
  });

  closeButton?.addEventListener('click', () => {
    window.parent.postMessage({ action: 'hide-iframe' }, '*');
  });
}

// =============================================================
// Search input
// =============================================================

function initSearch() {
  input.addEventListener(
    'input',
    debounce(() => {
      render(search(input.value));
      requestAnimationFrame(() => {
        bindSelectAllListener();

        // Re-check boxes if selectAll is active
        if (selectAll) {
          const allCbs = document.querySelectorAll('.item-checkbox');
          checkboxes.clear();
          allCbs.forEach((cb) => {
            cb.checked = true;
            checkboxes.add(Number(cb.dataset.rawIndex));
          });
          updateResultCount();
        }

        if (addBox) closeAddBox();
      });
    }, 10)
  );
}

// =============================================================
// Add button
// =============================================================

function initAddButton() {
  addEl.addEventListener('click', () => {
    if (addBox) return;
    addBox = createAddBox();
    resultsEl.prepend(addBox);
  });
}



// =============================================================
// settings 
// =============================================================

function showHotKeys() {
  defaultOverlayContainer.classList.toggle('hidden');
  hotkeyOverlayContainer.classList.toggle('hidden');
}
showSettingsButton.addEventListener('click', showSettings);
function showSettings() {
  defaultOverlayContainer.classList.add('hidden');
  hotkeyOverlayContainer.classList.add('hidden');
  settingOverlayContainer.classList.remove('hidden');
  new_personal_settings = JSON.parse(JSON.stringify(personal_settings));
  document.querySelectorAll('.ff-hl-swatch').forEach(el => {
    el.classList.remove('selected');
    if (el.dataset.color === new_personal_settings["highlightColor"]) {
      el.classList.add('selected');
    }
  })


}

function initColorPicker() {
  document.querySelectorAll('.ff-hl-swatch').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.ff-hl-swatch').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      new_personal_settings["highlightColor"] = el.dataset.color;
    });
  });

}

returnFromSettingsButton.addEventListener('click', closeSettings);
function closeSettings() {
  defaultOverlayContainer.classList.remove('hidden');
  hotkeyOverlayContainer.classList.add('hidden');
  settingOverlayContainer.classList.add('hidden');
  render(search(input.value));
}

function injectMatchStyle(color) {
  let el = document.getElementById('match-style');
  if (!el) { el = document.createElement('style'); el.id = 'match-style'; document.head.appendChild(el); }
  const c = colors[color];
  el.textContent = `
      .match { background: ${c.bg}; color: ${c.text}; border-radius: 2px; padding: 0 1px; }
    `;
}

saveSettingsButton.addEventListener('click', () => {
  if (!actionBtnsSettings.classList.contains('open')) {
    actionBtnsSettings.classList.add('open');
  }
});

confirmSettingsButton.addEventListener('click', () => {
  actionBtnsSettings.classList.remove('open');
  storageManager('update-data', 'personal_settings', new_personal_settings);
  personal_settings = JSON.parse(JSON.stringify(new_personal_settings));
});

cancelSettingsButton.addEventListener('click', () => {
  actionBtnsSettings.classList.remove('open');
});

// =============================================================
// Messaging / init
// =============================================================

function storageManager(action, key, data) {
  if (action === 'update-data') {
    window.parent.postMessage({ action, key, data }, '*');
  }
}

function postMessageToParent(action, data) {
  window.parent.postMessage({ action, data }, '*');
}



function initMessaging() {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'FROM_CONTENT') {
      input.focus();
    }
    if (event.data.action === 'intializeIframe') {
      RAW_DATA2 = event.data.notes;
      personal_settings = event.data.personal_settings
      console.log('personal_settings', personal_settings);
      render(search(input.value));
      initKeyboard();
      initSearch();
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    window.parent.postMessage({ action: 'iframeReady' }, '*');
  });
}

// =============================================================
// Boot
// =============================================================

initAddButton();
initDeleteMode();
initMessaging();
initColorPicker();