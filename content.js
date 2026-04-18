const iframe = document.createElement('iframe');
const test = "content.js file exposed"



async function intializeIframe() {

  iframe.style.cssText = `
      display: none;
      position: fixed;
      top: 5px;
      right: 5px;
      min-height: 700px;
      min-width: 500px;
      border-radius: 10px;
      // width: 300px;
      z-index: 10000;
  `;
  // Point it to your extension's HTML file
  iframe.src = chrome.runtime.getURL('fuzzy.html');
  // Inject it into the page
  document.documentElement.appendChild(iframe);
  const dataPromise = loadAllData();

  window.addEventListener('message', async (event) => {
    if (event.data?.action === 'iframeReady') {
      const results = await dataPromise;
      let notes = {}
      if (results.notes) {
        notes = results.notes
      }
      iframe.contentWindow.postMessage({ action: 'intializeIframe', notes: notes }, '*');
    }
  });
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
      case 'update-data':

        console.log('storing event.data.data:', event.data.data)
        storeData('notes', event.data.data)
        loadAllData()

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




function storeData(key, value) {
  chrome.storage.local.set({ [key]: value }, () => {
    console.log('Saved!')
  })
}

function loadData(key) {
  chrome.storage.local.get(key, (result) => {
    console.log(result[key])   // the value
  })
}

async function loadAllData() {
  try {
    // We MUST await here to get the actual object, 
    // otherwise we just return the pending Promise.
    const allData = await chrome.storage.local.get(null);

    console.log("All data loaded:", allData);

    // Example: Accessing specific keys from the result
    if (allData.notes) {
      console.log("Found notes:", allData.notes);
    }

    return allData;
  } catch (error) {
    console.error("Error loading from local storage:", error);
    return {};
  }
}
