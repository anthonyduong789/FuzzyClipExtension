/*
define the steps that are needed for exstension

1. load in all the notes from memory

2. have the ability for things to update 

3. have the ability for things search through notes using a fuzzy each model 

4. Other: 
- copy button to make things easier
- display entire noteseperate box

5. how it works 

key (this is what the fuzzy is searching): value (this is is what is going to be displayed)
 */
  const items = [
      "Application.js",
      "banana.txt",
      "apple.js",
      "Grapes.md",
      "ReadMe.md",
      "Config.json",
      "Index.html",
      "style.css",
      "main.py",
      "server.go",


    ];

    const searchInput = document.getElementById("search");
    const resultsList = document.getElementById("results");
    let activeIndex = -1;
    let currentResults = [];
    function fuzzyMatch(query, list) {
      const results = [];
      const lowerQuery = query.toLowerCase();
      // goes there the list of items and m
      for (const item of list) {
        let i = 0;
        let j = 0;
        const lowerItem = item.toLowerCase();
        const indices = [];

        while (i < lowerQuery.length && j < lowerItem.length) {
          if (lowerQuery[i] === lowerItem[j]) {
            indices.push(j);
            i++;
          }
          j++;
        }

        if (i === lowerQuery.length) {
          results.push({
            item,
            indices,
            score: lowerItem.length - lowerQuery.length
          });
        }
      }

      const threshold = 3;
      const filteredResults = results.filter(r => r.score >= threshold);

      filteredResults.sort((a, b) => b.score - a.score);
      return results;
    }

    function highlightMatch(item, indices) {
      let result = "";
      for (let i = 0; i < item.length; i++) {
        if (indices.includes(i)) {
          result += `<span class="highlight">${item[i]}</span>`;
        } else {
          result += item[i];
        }
      }
      return result;
    }

    function renderList(results) {
      resultsList.innerHTML = "";
      if (results.length === 0) {
        resultsList.innerHTML = `<li class="no-match">No matches found</li>`;
        return;
      }

      results.forEach((res, idx) => {
        const li = document.createElement("li");
        li.innerHTML = highlightMatch(res.item, res.indices);
        if (idx === activeIndex) li.classList.add("active");

        li.addEventListener("click", () => {
          alert(`You selected: ${res.item}`);
        });

        resultsList.appendChild(li);
      });
    }

    function updateResults() {
      const query = searchInput.value.trim();
      if (!query) {
        currentResults = items.map((i) => ({item: i, indices: []}));
      } else {
        currentResults = fuzzyMatch(query, items);
      }
      activeIndex = -1;
      renderList(currentResults);
    }

    searchInput.addEventListener("input", updateResults);
    searchInput.addEventListener("keydown", (e) => {
      if (!currentResults.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % currentResults.length;
        renderList(currentResults);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
        renderList(currentResults);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        const selected = currentResults[activeIndex];
        alert(`You selected: ${selected.item}`);
      }
    });

    // Initial render
    currentResults = items.map((i) => ({item: i, indices: []}));
    renderList(currentResults);



  console.log("fuzzy.js file ran")
// Open extension in new tab when browser starts

