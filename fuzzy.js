// UI
const closeButton = document.getElementById('closeInjected');
const input = document.getElementById('search-input');
const resultsEl = document.getElementById('results');
const addEl = document.getElementById('addNotesButton')
let visibleResults;
let currentAlgo = 'fzf';
let selectedIndex = 0;
/**
 * Search Logic
 */
const algos = {
  fzf: { fn: fzfMatch, label: 'fzf sequential', desc: '<strong>fzf-style:</strong> Characters must appear in order (subsequence match). Rewards consecutive runs, prefix matches, and word-boundary hits. Fast and forgiving — the classic fuzzy feel.' },
  levenshtein: { fn: levenshteinMatch, label: 'levenshtein distance', desc: '<strong>Levenshtein:</strong> Measures edit distance (insertions, deletions, substitutions) between pattern and substrings. More typo-tolerant; works even when characters are out of order.' },
  trigram: { fn: trigramMatch, label: 'trigram similarity', desc: '<strong>Trigram:</strong> Splits strings into 3-character chunks and measures overlap (Sørensen–Dice). Great for longer strings, spell-correction, and partial matches across word boundaries.' },
};
let RAW_DATA1 = {};
/**
 * Search Logic
 */

/**
* Renders the given result list in the UI.
* @param {object[]} result - Array of {str, score, positions}
*/
function highlight(str, positions) {
  if (!positions || positions.length === 0) return escHtml(str);
  const posSet = new Set(positions);
  return str.split('').map((c, i) =>
    posSet.has(i) ? `<mark>${escHtml(c)}</mark>` : escHtml(c)
  ).join('');
}
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Executes a search query against a dataset using a dynamically selected algorithm.
 * * @process
 * 1. **Initialization**: Normalizes the input query by trimming whitespace and 
 * retrieves the active search function (`fn`) based on the `currentAlgo` index.
 * 2. **Iteration**: Uses `Object.entries()` to loop through the `RAW_DATA1` object, 
 * treating each key as the searchable text.
 * 3. **Matching**: For every entry, the selected algorithm compares the query 
 * against the key. If a match is found, it captures the score and hit positions.
 * 4. **Collection**: Results are pushed into an array as objects containing the 
 * original key, its associated value, and metadata (score/positions).
 * 5. **Ranking**: The results array is sorted in descending order based on the 
 * `score` (highest relevance first).
 * 6. **Limitation**: Returns only the top 200 matches to optimize performance.
 *
 * @param {string} query - The search term or pattern provided by the user.
 * @returns {Array<Object>} An array of up to 200 result objects containing:
 * {string} key - The matched property name.
 * {string} value - The data associated with that key.
 * {number} score - Relevance score calculated by the algorithm.
 * {Array<number>} positions - Indices of where the match occurred.
 */

function search(query) {
  // assigns the funciton that is being implemented
  const algo = algos[currentAlgo].fn;

  // if (!query.trim()) {
  //   return RAW_DATA.slice(0, 200).map(s => ({ str: s, score: 0, positions: [] }));
  // }
  query = query.trim();
  const results = [];
  for (const [key, value] of Object.entries(RAW_DATA1)) {
    const res = algo(query, key);
    if (res.matched) results.push({ key: key, value: value, score: res.score, positions: res.positions });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 200);
}



/**
 * Renders the search results in the UI.
 * @param {Array<Object>} results - Order of elements based on matching algorithm
 * object containing:
 * {string} key - The matched property name.
 * {string} value - The data associated with that key.
 * {number} score - Relevance score calculated by the algorithm.
 * {Array<number>} positions - Indices of where the match occurred.
 */
function render(results) {
  visibleResults = results;
  selectedIndex = 0;
  resultsEl.innerHTML = results.map((r, i) => {
    return `
       <div class = 'itemContainer ${i === 0 ? 'selected' : ''}'>
        <div class="item">
            <input class="input-key"/>
            <div class="edit-btns">
              <button class="btn confirm-btn" id="confirmEditBtn" aria-label="Confirm delete">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
                stroke="var(--color-text-success)" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="2.5,8 6.5,12 13.5,4"/>
                </svg>
              </button> 
              <button class="btn cancel-btn" id="cancelEditBtn" aria-label="Cancel">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/>
                <line x1="11" y1="1" x2="1" y2="11"/>
                </svg>
              </button>
            </div>

            <span class="resultText" data-key="${r.key}">${highlight(r.key, r.positions)}</span>

            <div class="edit-group">
              <button class="edit-btn btn">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81 3.23 11.33a.25.25 0 0 0-.064.108l-.618 2.162 2.162-.618a.25.25 0 0 0 .108-.064L11.19 6.25z" fill="#ffffff"/>
                </svg>
              </button>
            </div>
            <div class="delete-group">
              <button class="btn trash-btn" id="trashBtn" aria-label="Delete">
                  <svg class="trash-icon" width="18" height="18" viewBox="0 0 18 18" fill="none"
                      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3,5 15,5"/>
                    <path d="M6 5V3.5A0.5 0.5 0 0 1 6.5 3h5a0.5 0.5 0 0 1 0.5 0.5V5"/>
                    <rect x="4" y="5" width="10" height="10" rx="1.5"/>
                    <line x1="7" y1="8" x2="7" y2="12"/>
                    <line x1="11" y1="8" x2="11" y2="12"/>
                  </svg>
              </button>
              <div class="action-btns " id="actionBtns">
                <button class="btn confirm-btn" id="confirmDeleteBtn" aria-label="Confirm delete">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
                  stroke="var(--color-text-success)" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="2.5,8 6.5,12 13.5,4"/>
                  </svg>
                </button> 
                <button class="btn cancel-btn" id="cancelDeleteBtn" aria-label="Cancel">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
                    <line x1="1" y1="1" x2="11" y2="11"/>
                    <line x1="11" y1="1" x2="1" y2="11"/>
                  </svg>
                </button>
            </div>

            </div>
            <span class="DropDownIcon">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
        <div> 
        </div>
        </div>
        <div class="itemContent">
          <input class="input-content"/>
          <p class="contentText" data-content="${r.value}">${r.value}</p>
        </div>
       </div>
        `
  }).join('');

  // Handle Mouse
  resultsEl.querySelectorAll('.itemContainer').forEach((el, i) => {
    const trash = el.querySelector('.trash-btn')
    const actions = el.querySelector('.action-btns')
    const cancelDeleteBtn = el.querySelector('#cancelDeleteBtn')
    const confirmDeleteBtn = el.querySelector('#confirmDeleteBtn')

    const cancelEditBtn = el.querySelector('#cancelEditBtn')
    const confirmEditBtn = el.querySelector('#confirmEditBtn')


    const editBtn = el.querySelector('.edit-btn')
    const resultText = el.querySelector('.resultText')
    const contentText = el.querySelector('.contentText')
    const inputKey = el.querySelector('.input-key')
    const inputContent = el.querySelector('.input-content')
    el.querySelector('.item').addEventListener('click', (e) => {
      selectedIndex = i;
      updateSelected();

    })
    function openConfirm() {
      actions.classList.add('open');
      trash.style.borderColor = 'var(--color-border-danger)';
    }
    function closeConfirm() {
      actions.classList.remove('open');
      trash.style.borderColor = '';
    }
    function editOpen() {
      inputKey.value = resultText.dataset.key
      console.log(contentText)
      inputContent.value = contentText.dataset.content 
      el.classList.toggle('edit');

    }
    el.querySelector('.trash-btn').addEventListener('click', (e) => {
      openConfirm();
      // example to delete data reset search 
      // let data = el.querySelector('.resultText').dataset.key;
      // delete RAW_DATA1[data]
      // storageManager('update-data', RAW_DATA1)
      // render(search(input.value));

    })
    cancelDeleteBtn.addEventListener('click', () => {
      closeConfirm();
    })
    confirmDeleteBtn.addEventListener('click', () => { let data = el.querySelector('.resultText').dataset.key;
      delete RAW_DATA1[data]
      storageManager('update-data', RAW_DATA1)
      render(search(input.value));
    })
    
    confirmEditBtn.addEventListener('click', () => {
      let oldKey = resultText.dataset.key
      let newKey = contentText.dataset.content
      delete RAW_DATA1[oldKey]
      RAW_DATA1[inputKey.value] = inputContent.value
      storageManager('update-data', RAW_DATA1)
      render(search(input.value));
      // resultText.dataset.key = inputKey.value
      // console.log(resultText.dataset.key)
    })

    cancelEditBtn.addEventListener('click', () => {
      let oldKey = el.querySelector('.resultText').dataset.key;
      // RAW_DATA1[inputKey.value] = 
      // delete RAW_DATA1[oldKey]
      el.classList.toggle('edit');
    })

    el.querySelector('.DropDownIcon').addEventListener('click', (e) => {
      el.classList.toggle('open');
    })
    editBtn.addEventListener('click', () => {
      editOpen();
    })
  })
}

function addNotes() {
  addEl.addEventListener('click', (e) => {
    const addBox = document.createElement('div');
    addBox.className = 'itemContainer open';
    addBox.innerHTML =
      `
      <div class="item">
        <input class="item-add-key" placeholder="Key That will be used when searching">
      </div>
      <button id="SaveButon">save button</button>
      <button id="CancelButton">cancel button</button>
      <div class="itemContent">
        <textarea class="item-add-value" name="" id=""></textarea>
      </div>
   `
    resultsEl.prepend(addBox)
    addBox.querySelector('#SaveButon').addEventListener('click', (el) => {
      RAW_DATA1[addBox.querySelector('.item-add-key').value] = addBox.querySelector('.item-add-value').value
      addBox.remove();
      render(search(input.value));
      storageManager('update-data', RAW_DATA1)
    })

    addBox.querySelector('#CancelButton').addEventListener('click', (el) => {
      addBox.remove();
    })




  });
}



function updateSelected() {
  resultsEl.querySelectorAll('.itemContainer').forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
  });
  const sel = resultsEl.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

/**
Search Logic
 */
/**
 * Searches through a list of strings for a given query using a fuzzy search algorithm.
 * @param {string} query - The query to search for.
 * @param {string[]} list - The list of strings to search through.
 * @returns {object[]} - An array of objects containing the matched string and its indices in the original list.
 */

function fzfMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  const p = pattern.toLowerCase(), s = str.toLowerCase();
  let pi = 0, si = 0;
  const positions = [];

  while (pi < p.length && si < s.length) {
    if (p[pi] === s[si]) { positions.push(si); pi++; }
    si++;
  }
  if (pi < p.length) return { matched: false };

  // Scoring
  let score = 0;
  let consecutive = 0;

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];

    // Prefix bonus
    if (pos === 0) score += 20;

    // Consecutive run bonus
    if (i > 0 && positions[i] === positions[i - 1] + 1) {
      consecutive++;
      score += 15 + consecutive * 5; // compounding consecutive bonus
    } else {
      consecutive = 0;
    }

    // Word boundary bonus (after / . _ - space)
    if (pos > 0 && '/._- '.includes(str[pos - 1])) score += 10;

    // Uppercase start (CamelCase boundary)
    if (str[pos] === str[pos].toUpperCase() && str[pos] !== str[pos].toLowerCase()) score += 8;

    // Penalize distance
    score -= pos * 0.5;
  }

  // Penalize total length
  score -= str.length * 0.1;

  return { matched: true, score, positions };
}

function levenshteinMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  // Use shortest substring match
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let bestScore = -Infinity;
  let bestPositions = [];

  // Slide pattern-length window over string, find best match
  const wLen = Math.max(p.length, Math.min(p.length * 2, s.length));
  for (let start = 0; start <= s.length - p.length; start++) {
    const sub = s.slice(start, start + wLen);
    const dist = levenshtein(p, sub);
    const maxLen = Math.max(p.length, sub.length);
    const sim = 1 - dist / maxLen;
    if (sim > 0.4) {
      const sc = sim * 100 - start * 0.2;
      if (sc > bestScore) {
        bestScore = sc;
        // Approximate positions
        bestPositions = subsequencePositions(p, s, start);
      }
    }
  }

  if (bestScore === -Infinity) return { matched: false };
  return { matched: true, score: bestScore, positions: bestPositions };
}
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

// 3. Trigram similarity
function trigramMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  if (pattern.length < 2) return fzfMatch(pattern, str); // fallback for short
  const p = pattern.toLowerCase(), s = str.toLowerCase();
  const pGrams = trigrams(p), sGrams = trigrams(s);
  const intersection = [...pGrams].filter(g => sGrams.has(g)).length;
  const sim = (2 * intersection) / (pGrams.size + sGrams.size);
  if (sim < 0.1) return { matched: false };
  const positions = subsequencePositions(p, s);
  const score = sim * 100 - s.length * 0.05;
  return { matched: true, score, positions };
}

function trigrams(s) {
  const set = new Set();
  const padded = ' ' + s + ' ';
  for (let i = 0; i < padded.length - 2; i++)
    set.add(padded.slice(i, i + 3));
  return set;
}

function handleKeys() {
  let debounceTimer;
  if (closeButton) {
    document.addEventListener('keydown', function (event) {

      if ((event.ctrlKey && event.key === 'q') || (event.key === 'Escape')) {
        window.parent.postMessage({ action: 'hide-iframe' }, '*'); // sends UP to content.js
      }
      if (event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'j')) {
        console.log("ArrowDown")
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, visibleResults.length - 1)
        updateSelected()
      }

      if (event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'k')) {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0)
        updateSelected()
      }

      if (event.key === 'Enter') {
        resultsEl.children[selectedIndex].classList.toggle('open')

      }


    })
    closeButton.addEventListener('click', () => {
      window.parent.postMessage({ action: 'hide-iframe' }, '*'); // sends UP to content.js
    });
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => render(search(input.value)), 10);
    });

  }

}



/**
 * @typedef {}
 * @param {string} action 
 * @param {Object} data 
 */
function storageManager(action, data) {
  if (action === 'update-data') {
    window.parent.postMessage({ action: action, data: data }, '*')
  }


}


window.addEventListener("message", (event) => {
  // Inside iframe
  if (event.data.type === "FROM_CONTENT") {
    input.focus();
  }

  if (event.data.action === "intializeIframe") {
    RAW_DATA1 = event.data.notes
    render(search(input.value));

  }
});



render(search(''));
handleKeys();
addNotes();

// signal when the page is ready to recieve messages
window.addEventListener('DOMContentLoaded', () => {
  window.parent.postMessage({ action: 'iframeReady' }, '*');
});