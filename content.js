let html




// Load the file
fetch(chrome.runtime.getURL('fuzzy.html'))
  .then(response => response.text())
  .then(res => {
    console.log(res);
    html = res;
    // document.getElementById('container').innerHTML = html;
  });
