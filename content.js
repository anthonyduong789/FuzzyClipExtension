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

function fuzzySearch(query, list) {
  const lowerQuery = query.toLowerCase();

}

function LevdistScore(s, t){


}






