let height = 700, width = 500
let position = { left: 0, top: 0 }
let personal_settings = { "highlightColor": "amber", height: 700, width: 500, top: 5, left: 5 };

// Top Bar
const wrapper = document.createElement('div');
wrapper.style.cssText = `
      display: none;
      flex-direction: column;
      position: fixed;
      height: 700px;
      width: 500px;
      border-radius: 10px;
      z-index: 10000;
      will-change: transform;
      transition: transform 0.6s linear(0, 0.08, 0.52, 1.1, 0.98, 1);
  `;
wrapper.classList.add('wrapper');

const topBar = document.createElement('div');
topBar.style.cssText = `
  display: flex;
  height: 20px;
  background-color: rgb(244, 241, 235);
  border-radius: 10px 10px 0px 0px;
  cursor: grab;
  justify-content: center;
  align-items: center;
`;
topBar.innerHTML = `
  <div style="
    width: 40px;
    height: 4px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 2px;
  "></div>
`;

// Iframe
const iframe = document.createElement('iframe');
const test = "content.js file exposed"
async function initializeIframe() {
  iframe.style.cssText = `
    all: unset;
    flex-grow: 1;
    background: #f4f1eb;
    border-radius: 0px 0px 10px 10px;
  `;
  iframe.src = chrome.runtime.getURL('fuzzy.html');
  wrapper.appendChild(topBar);
  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
  const results = await loadAllData(); // resolved before listener is even registered
  let notes = []
  if (results.notes !== undefined) {
    notes = results.notes
  }
  if (results.personal_settings) personal_settings = results.personal_settings
  if (personal_settings.height !== undefined && personal_settings.width !== undefined) {
    wrapper.style.height = `${clampHeight(personal_settings.height)}px`;
    wrapper.style.width = `${clampWidth(personal_settings.width)}px`;
  }
  else {
    wrapper.style.height = `${clampHeight(700)}px`;
    wrapper.style.width = `${clampWidth(500)}px`
    console.log('No height or width setting found, defaulting to 700px x 500px');
  }
  if (personal_settings.top !== undefined && personal_settings.left !== undefined) {
    let pos = clampPosition(personal_settings.left, personal_settings.top);
    setWrapperPosition(pos.left, pos.top);
  }
  else {
    setWrapperPosition(5, 5);
    console.log("No top or left setting found, defaulting to 5px");
  }







  window.addEventListener('message', async (event) => {
    if (event.data?.action !== 'iframeReady') return;
    if (event.data.action === 'iframeReady') {
      iframe.contentWindow.postMessage(
        { action: 'initializeIframe', notes, personal_settings },
        '*'
      );
    }
  });
}

// resize left
const resizeLeftBar = document.createElement('div');
resizeLeftBar.style.cssText = `
position: absolute;
bottom: 22px;
left: -2px;
width: 10px;
height: 100%;
cursor: ew-resize;
border-radius: 10px;
`;
resizeLeftBar.classList.add('handle-e');
wrapper.appendChild(resizeLeftBar);

// resize bottom
const resizeBottomBar = document.createElement('div');
resizeBottomBar.style.cssText = `
position: absolute;
bottom: -2px;
left: 22px;
width: 100%;
height: 10px;
cursor: ns-resize;
border-radius: 10px;
`;
resizeBottomBar.classList.add('handle-s');
wrapper.appendChild(resizeBottomBar);

// resize left corner
const resizeLeftBottomBar = document.createElement('div');
resizeLeftBottomBar.style.cssText = `
position: absolute;
bottom: -2px;
left: -2px;
width: 25px;
height: 25px;
cursor: nesw-resize;
/* border-radius: 10px; */
clip-path: polygon(25% 0, 25% 75%, 100% 75%, 100% 100%, 0 100%, 0 0);
`;
resizeLeftBottomBar.classList.add('handle-se');
wrapper.appendChild(resizeLeftBottomBar);



makeHandle(resizeLeftBar, true, false);
makeHandle(resizeBottomBar, false, true);
makeHandle(resizeLeftBottomBar, true, true);


function handlMessages() {
  // ✅ Listen on window, not iframe.contentWindow
  window.addEventListener('message', (event) => {
    if (!event.origin.startsWith('chrome-extension://')) return;
    switch (event.data.action) {
      case 'hide-iframe':
        wrapper.style.display = 'none';
        break;
      case 'update-data':
        storeData(event.data.key, event.data.data)
        loadAllData()
      case 'copy-to-clipboard':
        navigator.clipboard.writeText(event.data.data.text).then(() => {
        }).catch(err => {
          console.error('Error copying to clipboard: ', err);
        });

      default:
        break;
    }
  });
}


function toggleIframe() {
  if (wrapper.style.display == 'none') {
    wrapper.style.display = 'flex';
    iframe.focus();
    iframe.contentWindow.postMessage({ type: "FROM_CONTENT", data: "world" }, "*")
  } else {
    wrapper.style.display = 'none';
  }
}

function handleKeyMaps() {
  // removes toggles it to remove the element
  document.addEventListener('keydown', function (event) {
    if (wrapper) {
      if (event.ctrlKey && event.key === 'q') {
        toggleIframe();
      }
    }
  })
}
initializeIframe();
handlMessages();
handleKeyMaps();
function storeData(key, value) {
  chrome.storage.local.set({ [key]: value }, () => {
    console.log('Saved!')
  })
}

async function loadData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
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

/**
 * 
 * @param {number} left - raw number for left position
 * @param {number} top  raw number for top position
 * @returns {left: number, top: number}
 */
function clampPosition(left, top) {
  const maxLeft = Math.max(4, window.innerWidth - personal_settings.width - 2);
  const maxTop = Math.max(2, window.innerHeight - personal_settings.height - 2);
  console.log("Max left:", maxLeft, "Max top:", maxTop);

  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
}



function setWrapperPosition(left, top) {
  const pos = clampPosition(left, top);
  wrapper.style.left = `${pos.left}px`;
  wrapper.style.top = `${pos.top}px`;
  console.log(wrapper.style.left, wrapper.style.top);
}

function clampHeight(newHeight) {
  return Math.min(Math.max(MIN_H, newHeight), window.innerHeight - 10)
}

function clampWidth(newWidth) {
  return Math.min(Math.max(MIN_W, newWidth), window.innerWidth - 5)
}

function makeDraggable(e) {
  const rect = wrapper.getBoundingClientRect();
  console.log("Wrapper rect:", rect);
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  // Clear right/bottom so left/top take full control
  wrapper.style.right = 'unset';
  iframe.style.pointerEvents = 'none';

  setWrapperPosition(e.clientX - offsetX, e.clientY - offsetY);
  document.body.style.userSelect = 'none';
  topBar.style.cursor = 'grabbing';

  console.log("Mouse down on top bar, starting drag with offsets:", offsetX, offsetY);
  window.addEventListener('mousemove', onTopBarMouseMove);
  window.addEventListener('mouseup', onTopBarMouseUp);
}

function onTopBarMouseMove(e) {
  setWrapperPosition(e.clientX - offsetX, e.clientY - offsetY);
}

function onTopBarMouseUp(e) {
  topBar.style.cursor = 'grab';
  document.body.style.userSelect = 'auto';
  iframe.style.pointerEvents = 'auto';
  personal_settings.top = Number(String(wrapper.style.top).replace(/[^\d.-]/g, ""));
  personal_settings.left = Number(String(wrapper.style.left).replace(/[^\d.-]/g, ""))

  console.log("storing personal_settings", personal_settings);
  storeData('personal_settings', personal_settings);
  window.removeEventListener('mousemove', onTopBarMouseMove);
  window.removeEventListener('mouseup', onTopBarMouseUp);
}
const MIN_W = 160, MIN_H = 90;
let startRight;
function makeHandle(el, resizeW, resizeH) {
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    // el.classList.add('active');
    // wrapper.classList.add('active');

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = wrapper.offsetWidth;
    const startH = wrapper.offsetHeight;
    // const startRight = window.innerWidth - wrapper.getBoundingClientRect().right; // distance from right edge of viewport

    let wrapperRect = wrapper.getBoundingClientRect();
    console.log(`starting wrapper pos ${wrapperRect.top} ${wrapper.left}`)
    startRight = window.innerWidth - wrapper.getBoundingClientRect().right; // distance from right edge of viewport
    wrapper.style.right = startRight + 'px'
    wrapper.style.left = 'unset'; // 👈 clear any left value

    wrapper.style.willChange = 'width';
    wrapper.classList.add('active');
    console.log("starting right position:", startRight);

    function onMove(e) {
      if (resizeW) {
        // const newW = Math.max(MIN_W, startW + (e.clientX - startX));
        const newW = clampWidth(startW + (startX - e.clientX))
        wrapper.style.width = newW + 'px';
        wrapper.style.right = startRight + 'px'
      }
      if (resizeH) {
        const newH = clampHeight(startH + (e.clientY - startY))
        console.log("New height:", newH, "min height:", MIN_H);
        wrapper.style.height = newH + 'px';
      }
    }

    function onUp() {
      // el.classList.remove('active');
      // wrapper.classList.remove('active');

      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      // pointerup
      wrapper.style.willChange = 'auto';
      wrapper.classList.remove('active');
      const rect = wrapper.getBoundingClientRect();
      console.log("new left", rect.left)
      console.log("new top", rect.top)
      personal_settings.height = Number(String(wrapper.style.height).replace(/[^\d.-]/g, ""));
      personal_settings.width = Number(String(wrapper.style.width).replace(/[^\d.-]/g, ""));
      personal_settings.top = rect.top
      personal_settings.left = rect.left
      console.log("storing personal_settings", personal_settings);
      storeData('personal_settings', personal_settings);
    }

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  });
}
topBar.addEventListener('mousedown', (e) => {
  makeDraggable(e);
});


window.addEventListener("resize", () => {
  setWrapperPosition(personal_settings.left, personal_settings.top);
  let newH = clampHeight(wrapper.offsetHeight)
  let newW = clampWidth(wrapper.offsetWidth)
  wrapper.style.height = `${newH}px`
  wrapper.style.width = `${newW}px`

});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_PANEL") {
    if (wrapper) {
      toggleIframe();
    }
  }
});


