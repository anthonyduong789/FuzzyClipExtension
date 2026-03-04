let html;
let isInjected = false;
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

  }
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
    if (i > 0 && positions[i] === positions[i-1] + 1) {
      consecutive++;
      score += 15 + consecutive * 5; // compounding consecutive bonus
    } else {
      consecutive = 0;
    }

    // Word boundary bonus (after / . _ - space)
    if (pos > 0 && '/._- '.includes(str[pos-1])) score += 10;

    // Uppercase start (CamelCase boundary)
    if (str[pos] === str[pos].toUpperCase() && str[pos] !== str[pos].toLowerCase()) score += 8;

    // Penalize distance
    score -= pos * 0.5;
  }

  // Penalize total length
  score -= str.length * 0.1;

  return { matched: true, score, positions };
}

function LevdistScore(query, target) {
  let dp = Array.from({ length: query }, () =>
    new Array(target).fill(0)
  );



}






