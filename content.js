let html;
let isInjected = false;
let resultsEl;
// Load the file
fetch(chrome.runtime.getURL('fuzzy.html'))
  .then(response => response.text())
  .then(res => {
    html = res
    // document.getElementById('container').innerHTML = html;
  });

// inject html 
window.addEventListener('load', async () => {
  const injectedDiv = document.createElement('div');

  if (html) {

    injectedDiv.innerHTML = html
    document.body.appendChild(injectedDiv);
    const closeButton = document.getElementById('closeInjected');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        injectedDiv.remove();
      });
    }

    resultsEl = document.getElementById('results');
    console.log(resultsEl)
    /**
 * Renders the given result list in the UI.
 * @param {object[]} result - Array of {str, score, positions}
 */

    function render(results) {
      if (results.length === 0) {
        resultsEl.innerHTML = `<div class="no-results"><div class="icon">⌀</div>no matches found</div>`;
        return;
      }
    }

    render([]);


  }
  // removes toggles it to remove the element
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'q') {
      // Toggle the state of isInjected
      isInjected = !isInjected;

      if (isInjected) {
        // Append the injectedDiv if it's not already appended
        if (!document.body.contains(injectedDiv)) {
          document.body.appendChild(injectedDiv);
        }
      } else {
        // Remove the injectedDiv if it's already appended
        if (document.body.contains(injectedDiv)) {
          injectedDiv.remove();
        }
      }
    }
  })
});







function search(query) {
  // assigns the funciton that is being implemented
  const algo = algos[currentAlgo].fn;

  if (!query.trim()) {
    return RAW_DATA.slice(0, 200).map(s => ({ str: s, score: 0, positions: [] }));
  }
  const results = [];
  for (const str of RAW_DATA) {
    const res = algo(query, str);
    if (res.matched) results.push({ str, score: res.score, positions: res.positions });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 200);
}

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

const algos = {
  fzf: { fn: fzfMatch, label: 'fzf sequential', desc: '<strong>fzf-style:</strong> Characters must appear in order (subsequence match). Rewards consecutive runs, prefix matches, and word-boundary hits. Fast and forgiving — the classic fuzzy feel.' },
  levenshtein: { fn: levenshteinMatch, label: 'levenshtein distance', desc: '<strong>Levenshtein:</strong> Measures edit distance (insertions, deletions, substitutions) between pattern and substrings. More typo-tolerant; works even when characters are out of order.' },
  trigram: { fn: trigramMatch, label: 'trigram similarity', desc: '<strong>Trigram:</strong> Splits strings into 3-character chunks and measures overlap (Sørensen–Dice). Great for longer strings, spell-correction, and partial matches across word boundaries.' },
};




