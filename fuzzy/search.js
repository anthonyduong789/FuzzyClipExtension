// search.js
export function fzfMatch(pattern, str) {
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

export function levenshteinMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let bestScore = -Infinity,
    bestPositions = [];

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
  return bestScore === -Infinity
    ? { matched: false }
    : { matched: true, score: bestScore, positions: bestPositions };
}

function trigrams(s) {
  const set = new Set();
  const padded = " " + s + " ";
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

export function trigramMatch(pattern, str) {
  if (!pattern) return { matched: true, score: 0, positions: [] };
  if (pattern.length < 2) return fzfMatch(pattern, str);
  const p = pattern.toLowerCase(),
    s = str.toLowerCase();
  const pGrams = trigrams(p),
    sGrams = trigrams(s);
  const intersection = [...pGrams].filter((g) => sGrams.has(g)).length;
  const sim = (2 * intersection) / (pGrams.size + sGrams.size);
  if (sim < 0.1) return { matched: false };
  return {
    matched: true,
    score: sim * 100 - s.length * 0.05,
    positions: subsequencePositions(p, s),
  };
}

export const algos = {
  fzf: { fn: fzfMatch, label: "fzf sequential" },
  levenshtein: { fn: levenshteinMatch, label: "levenshtein distance" },
  trigram: { fn: trigramMatch, label: "trigram similarity" },
};

export function searchNotes(query, notes, algoName) {
  const algo = algos[algoName].fn;
  const results = [];
  const trimmed = query.trim();

  for (let i = 0; i < notes.length; i++) {
    const res = algo(trimmed, notes[i].title);
    if (res.matched) {
      results.push({
        ...notes[i],
        score: res.score,
        positions: res.positions,
        rawIndex: i,
      });
    }
  }
  if (trimmed) results.sort((a, b) => b.score - a.score);
  return results.slice(0, 200);
}

export function searchTags(query, tags, algoName) {
  const algo = algos[algoName].fn;
  const results = [];
  const trimmed = query.trim();
  for (let i = 0; i < tags.length; i++) {
    const res = algo(trimmed, tags[i]);
    if (res.matched) results.push({ tag: tags[i], score: res.score });
  }
  if (trimmed) results.sort((a, b) => b.score - a.score);
  return results;
}
