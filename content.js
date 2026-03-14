const iframe = document.createElement('iframe');
const test = "content.js file exposed"
let html;
let isInjected = false;
let currentAlgo = 'fzf';
let visibleResults = [];
const RAW_DATA = [
  "src/components/Button.tsx", "src/components/Modal.tsx", "src/components/Dropdown.tsx",
  "src/components/Tooltip.tsx", "src/components/Spinner.tsx", "src/components/Avatar.tsx",
  "src/components/Badge.tsx", "src/components/Card.tsx", "src/components/Input.tsx",
  "src/components/Table.tsx", "src/hooks/useAuth.ts", "src/hooks/useDebounce.ts",
  "src/hooks/useLocalStorage.ts", "src/hooks/useFetch.ts", "src/hooks/useClickOutside.ts",
  "src/hooks/useWindowSize.ts", "src/hooks/useTheme.ts", "src/hooks/useForm.ts",
  "src/utils/formatDate.ts", "src/utils/formatCurrency.ts", "src/utils/debounce.ts",
  "src/utils/throttle.ts", "src/utils/deepClone.ts", "src/utils/parseJSON.ts",
  "src/utils/validateEmail.ts", "src/utils/slugify.ts", "src/utils/capitalize.ts",
  "src/api/auth.ts", "src/api/users.ts", "src/api/posts.ts", "src/api/comments.ts",
  "src/api/search.ts", "src/api/upload.ts", "src/api/notifications.ts",
  "src/pages/Home.tsx", "src/pages/Login.tsx", "src/pages/Register.tsx",
  "src/pages/Dashboard.tsx", "src/pages/Profile.tsx", "src/pages/Settings.tsx",
  "src/pages/NotFound.tsx", "src/pages/Forbidden.tsx", "src/pages/Search.tsx",
  "src/store/authSlice.ts", "src/store/uiSlice.ts", "src/store/userSlice.ts",
  "src/store/postSlice.ts", "src/store/index.ts", "src/store/middleware.ts",
  "tests/unit/Button.test.tsx", "tests/unit/Modal.test.tsx", "tests/unit/useAuth.test.ts",
  "tests/unit/formatDate.test.ts", "tests/unit/validateEmail.test.ts",
  "tests/e2e/login.spec.ts", "tests/e2e/dashboard.spec.ts", "tests/e2e/search.spec.ts",
  "config/webpack.config.js", "config/jest.config.js", "config/tsconfig.json",
  "config/eslint.config.js", "config/prettier.config.js", "config/babel.config.js",
  ".github/workflows/ci.yml", ".github/workflows/deploy.yml", ".github/CODEOWNERS",
  "scripts/build.sh", "scripts/seed.js", "scripts/migrate.js", "scripts/lint.sh",
  "docs/API.md", "docs/CONTRIBUTING.md", "docs/CHANGELOG.md", "docs/ARCHITECTURE.md",
  "docker/Dockerfile", "docker/docker-compose.yml", "docker/nginx.conf",
  "src/middleware/auth.ts", "src/middleware/logging.ts", "src/middleware/rateLimit.ts",
  "src/types/User.ts", "src/types/Post.ts", "src/types/Comment.ts", "src/types/Api.ts",
  "src/constants/routes.ts", "src/constants/config.ts", "src/constants/errors.ts",
  "src/styles/globals.css", "src/styles/variables.css", "src/styles/mixins.css",
  "src/styles/components.css", "src/styles/animations.css", "src/styles/dark.css",
  "public/index.html", "public/favicon.ico", "public/robots.txt", "public/manifest.json",
  "src/lib/axios.ts", "src/lib/firebase.ts", "src/lib/sentry.ts", "src/lib/analytics.ts",
  "src/context/AuthContext.tsx", "src/context/ThemeContext.tsx", "src/context/CartContext.tsx",
  "src/services/EmailService.ts", "src/services/StorageService.ts", "src/services/CacheService.ts",
  "src/workers/ImageWorker.ts", "src/workers/DataWorker.ts", "src/workers/SyncWorker.ts",
  // more filler
  "src/components/NavigationBar.tsx", "src/components/SidePanel.tsx", "src/components/Footer.tsx",
  "src/components/Header.tsx", "src/components/SearchBar.tsx", "src/components/FileUpload.tsx",
  "src/components/DatePicker.tsx", "src/components/ColorPicker.tsx", "src/components/RichEditor.tsx",
  "src/components/Charts/LineChart.tsx", "src/components/Charts/BarChart.tsx",
  "src/components/Charts/PieChart.tsx", "src/components/Charts/AreaChart.tsx",
  "src/hooks/useAnimation.ts", "src/hooks/useKeyboard.ts", "src/hooks/useIntersection.ts",
  "src/hooks/useMediaQuery.ts", "src/hooks/usePortal.ts", "src/hooks/useScrollLock.ts",
  "src/utils/arrayUtils.ts", "src/utils/objectUtils.ts", "src/utils/stringUtils.ts",
  "src/utils/numberUtils.ts", "src/utils/colorUtils.ts", "src/utils/domUtils.ts",
  "src/utils/cryptoUtils.ts", "src/utils/imageUtils.ts", "src/utils/fileUtils.ts",
  "src/api/webhooks.ts", "src/api/analytics.ts", "src/api/billing.ts", "src/api/admin.ts",
  "src/pages/Billing.tsx", "src/pages/Admin.tsx", "src/pages/Analytics.tsx",
  "src/pages/Help.tsx", "src/pages/Onboarding.tsx", "src/pages/Upgrade.tsx",
  "tests/integration/api.test.ts", "tests/integration/auth.test.ts",
  "src/animations/fadeIn.ts", "src/animations/slideIn.ts", "src/animations/bounce.ts",
  "src/mocks/handlers.ts", "src/mocks/db.ts", "src/mocks/server.ts",
  "src/i18n/en.json", "src/i18n/es.json", "src/i18n/fr.json", "src/i18n/de.json",
  "src/i18n/index.ts", "src/i18n/config.ts",
  "src/featureFlags/index.ts", "src/featureFlags/flags.ts",
  "src/analytics/events.ts", "src/analytics/tracker.ts",
  "src/errors/AppError.ts", "src/errors/HttpError.ts", "src/errors/ValidationError.ts",
  "src/validators/UserValidator.ts", "src/validators/PostValidator.ts",
  "src/transformers/UserTransformer.ts", "src/transformers/PostTransformer.ts",
  "src/guards/AuthGuard.tsx", "src/guards/RoleGuard.tsx", "src/guards/GuestGuard.tsx",
  "package.json", "tsconfig.json", "README.md", ".env.example", ".gitignore",
  "yarn.lock", "pnpm-lock.yaml",
  "src/components/Pagination.tsx", "src/components/Breadcrumb.tsx", "src/components/Accordion.tsx",
  "src/components/Tabs.tsx", "src/components/Progress.tsx", "src/components/Skeleton.tsx",
  "src/components/Toast.tsx", "src/components/Dialog.tsx", "src/components/Drawer.tsx",
  "src/components/Menu.tsx", "src/components/Popover.tsx", "src/components/Select.tsx",
  "src/components/Checkbox.tsx", "src/components/Radio.tsx", "src/components/Switch.tsx",
  "src/components/Slider.tsx", "src/components/Rating.tsx", "src/components/Tag.tsx",
  "src/components/Timeline.tsx", "src/components/Tree.tsx", "src/components/List.tsx",
  "src/components/Grid.tsx", "src/components/Stack.tsx", "src/components/Flex.tsx",
  "src/components/Container.tsx", "src/components/Divider.tsx", "src/components/Text.tsx",
  "src/components/Heading.tsx", "src/components/Link.tsx", "src/components/Icon.tsx",
  "src/components/Image.tsx", "src/components/Video.tsx", "src/components/Audio.tsx",
  "src/components/Code.tsx", "src/components/Pre.tsx", "src/components/Kbd.tsx",
  "src/components/Mark.tsx", "src/components/Quote.tsx", "src/components/Cite.tsx",
];

let resultsEl;


iframe.style.cssText = `
      position: fixed;
      top: 5px;
      right: 5px;
      min-height: 700px;
      border-radius: 10px;
      width: 300px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      opacity: 0.97; /* 0 = fully transparent, 1 = fully visible */
  `;
// Point it to your extension's HTML file
iframe.src = chrome.runtime.getURL('fuzzy.html');
// Inject it into the page
document.documentElement.appendChild(iframe);
// ✅ Listen on window, not iframe.contentWindow
window.addEventListener('message', (event) => {
  if (!event.origin.startsWith('chrome-extension://')) return;
  console.log('[content.js] received:', event.data);
});


// inject html 
window.addEventListener('load', async () => {
  // Style it to sit in the bottom-right corner of the page



  const injectedDiv = document.createElement('div');

  if (html) {

    injectedDiv.innerHTML = html
    // Load CSS into the shadow root
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/styles.css');
    injectedDiv.appendChild(link);


    // document.body.appendChild(injectedDiv);
    const closeButton = document.getElementById('closeInjected');
    const input = document.getElementById('search-input');


    // const shadow = html.attachShadow({ mode: 'open' });



    if (closeButton) {
      closeButton.addEventListener('click', () => {
        injectedDiv.remove();
      });
    }

    resultsEl = document.getElementById('results');
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
     * Searches through the RAW_DATA array using the given algorithm
     * @param {string} query - The string to search for
     * @returns {object[]} Array of {string, score and positions}
     */
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
    function render(results) {
      if (results.length === 0) {
        resultsEl.innerHTML = `<div class="no-results"><div class="icon">⌀</div>no matches found</div>`;
        return;
      }
      resultsEl.innerHTML = results.map((r) => {

        return `
       <div class="item">
        <button class="toggle" onClick = {}>
          <span class="icon">
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
          <span class="item">${highlight(r.str, r.positions)}</span>
          
        </button>
        <div class="content">
        <p>test</p>
        </div>
      </div>
   
        
        `
      }).join('');

      const toggle = document.getElementsByClassName('toggle');
      console.log(toggle)

      for (let i = 0; i < toggle.length; i++) {
        toggle[i].onclick = function () {

          console.log(i)
        }
      }








      // if (toggle) {
      //   toggle.addEventListener('click', () => {
      //     console.log("check")
      //   });
      // }
      // else {
      //   console.log("no toggle items")
      // }
    }

    // console.log(search(''))
    render(search(''));
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => render(search(input.value)), 60);
    });




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



