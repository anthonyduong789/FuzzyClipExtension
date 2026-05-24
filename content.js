// Top Bar
const wrapper = document.createElement('div');
wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 5px;
      right: 5px;
      min-height: 700px;
      width: 500px;
      border-radius: 10px;
      z-index: 10000;
      will-change: transform;
      transition: transform 0.6s linear(0, 0.08, 0.52, 1.1, 0.98, 1);
  `;

const topBar = document.createElement('div');
topBar.style.cssText = `
  position: relative;   /* taken out of flow */
  top: 0px;
  left: 0px;
  height: 30px;
  z-index: 1;
  background-color: #f4f1eb;
  border-radius: 10px 10px 0 0;
  cursor: grab;
`;


topBar.innerHTML = `
  <div style="
    width: 40px;
    height: 4px;
    background: rgba(0,0,0,0.25);
    border-radius: 2px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 50%;
    margin-top: -2px;
  "></div>
`;

const iframe = document.createElement('iframe');
const test = "content.js file exposed"
async function intializeIframe() {
  // iframe.style.cssText = `
  //     display: none;
  //     position: fixed;
  //     top: 5px;
  //     right: 5px;
  //     min-height: 700px;
  //     min-width: 500px;
  //     border-radius: 10px;
  //     // width: 300px;
  //     z-index: 10000;
  // `;

  iframe.style.cssText = `
    flex: 1;
  `


  // Point it to your extension's HTML file
  iframe.src = chrome.runtime.getURL('fuzzy.html');

  wrapper.appendChild(topBar);
  wrapper.appendChild(iframe);


  // Inject it into the page
  // document.documentElement.appendChild(iframe);
  document.body.appendChild(wrapper);
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
    switch (event.data.action) {
      case 'hide-iframe':
        iframe.style.display = 'none';
        break;
      case 'update-data':
        storeData(event.data.key, event.data.data)
        loadAllData()
      case 'copy-to-clipboard':
        navigator.clipboard.writeText(event.data.data.text).then(() => {
          console.log('Text copied to clipboard');
        }).catch(err => {
          console.error('Error copying to clipboard: ', err);
        });

      default:
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
    // Example: Accessing specific keys from the result

    return allData;
  } catch (error) {
    console.error("Error loading from local storage:", error);
    return {};
  }
}




let offsetX, offsetY;


function makeDraggable(e) {
  const rect = wrapper.getBoundingClientRect();
  console.log("Wrapper rect:", rect);
  offsetX = e.clientX - rect.left;;
  offsetY = e.clientY - rect.top;

  // Clear right/bottom so left/top take full control
  wrapper.style.right = 'unset';
  iframe.style.pointerEvents = 'none';


  wrapper.style.left = `${e.clientX - offsetX}px`;
  wrapper.style.top = `${e.clientY - offsetY}px`;
  document.body.style.userSelect = 'none';
  topBar.style.cursor = 'grabbing';
  


  console.log("Mouse down on top bar, starting drag with offsets:", offsetX, offsetY);
  window.addEventListener('mousemove', onTopBarMouseMove);
  window.addEventListener('mouseup', onTopBarMouseUp);

}


function onTopBarMouseMove(e) {
  wrapper.style.left = `${e.clientX - offsetX}px`;
  wrapper.style.top = `${e.clientY - offsetY}px`;

}

function onTopBarMouseUp(e) {
  topBar.style.cursor = 'grab';
  document.body.style.userSelect = 'auto';
  iframe.style.pointerEvents = 'auto';
  window.removeEventListener('mousemove', onTopBarMouseMove);
  window.removeEventListener('mouseup', onTopBarMouseUp);
}


topBar.addEventListener('mousedown', (e) => {
  makeDraggable(e);
});


