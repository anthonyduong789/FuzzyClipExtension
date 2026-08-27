// ============================================================
// DOM ELEMENTS
// ============================================================

// Top Bar
const wrapper = document.createElement("div");

wrapper.style.cssText = `
  display: none;
  flex-direction: column;
  position: fixed;
  height: 700px;
  width: 500px;
  border-radius: 10px;
  z-index: 2147483647;
  will-change: transform;
  transition: transform 0.6s linear(0, 0.08, 0.52, 1.1, 0.98, 1);
`;

wrapper.classList.add("wrapper");


// ------------------------------------------------------------
// Top Bar
// ------------------------------------------------------------

const topBar = document.createElement("div");

topBar.style.cssText = `
  margin-top: 5px;
  display: flex;
  width: calc(100% - 20px);
  margin-left: 8px;
  height: 20px;
  background-color: rgb(244, 241, 235);
  border-radius: 10px 10px 0px 0px;
  cursor: grab;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.8);
`;

topBar.innerHTML = `
  <div style="
    width: 40px;
    height: 4px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 2px;
  "></div>
`;


// ------------------------------------------------------------
// Iframe
// ------------------------------------------------------------

const iframe = document.createElement("iframe");

iframe.allow = "clipboard-read; clipboard-write";