const iframe = document.createElement('iframe');
const test = "content.js file exposed"



function intializeIframe() {
  iframe.style.cssText = `
      display: none;
      position: fixed;
      top: 5px;
      right: 5px;
      min-height: 700px;
      min-width: 500px;
      border-radius: 10px;
      // width: 300px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      opacity: 0.97; /* 0 = fully transparent, 1 = fully visible */
  `;
  // Point it to your extension's HTML file
  iframe.src = chrome.runtime.getURL('fuzzy.html');
  // Inject it into the page
  document.documentElement.appendChild(iframe);
}

function handlMessages() {
  // ✅ Listen on window, not iframe.contentWindow
  window.addEventListener('message', (event) => {
    if (!event.origin.startsWith('chrome-extension://')) return;
    console.log('[content.js] received:', event.data);
    switch (event.data.action) {
      case 'hide-iframe':
        console.log("message triggered")
        iframe.style.display = 'none';
        break;

      default:
        console.log('no hide frame');
        break;
    }
  });
}
function handleKeyMaps() {
  // removes toggles it to remove the element
  document.addEventListener('keydown', function (event) {
    if (iframe) {
      if (event.ctrlKey && event.key === 'q') {
        console.log("Ctrl q triggered", iframe.style.display)
        if (iframe.style.display == 'none') {
          iframe.style.display = 'block';
          iframe.focus();
            iframe.contentWindow.postMessage({ type: "FROM_CONTENT", data: "world" }, "*")

        } else {
          iframe.style.display = 'none';
        }
      }
    }
  })
}

intializeIframe();
handlMessages();
handleKeyMaps();





