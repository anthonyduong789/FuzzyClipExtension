# Logs

Instead of making the app through fuzzy.html and injecting it I'm thinking about just having a html be injected into the current page kind of like vimnium

3/14
using a iframe is basically just a picture of a page common because it essentially lets the ui

Isolation from the host page
The page you're visiting can't accidentally (or intentionally) break your extension's UI. If Vimium just injected a plain <div> into the page, the page's CSS could make it look completely wrong — wrong fonts, wrong colors, broken layout.
Style safety
Inside an iframe, the extension's CSS is sandboxed. The host page's stylesheets don't bleed in, so the UI looks consistent on every website.
Script safety
JavaScript running on the host page can't easily reach inside the iframe and tamper with it.

In order to listen to key presses need content script listens to key presses and use uses
**postMesage** to talk to iframe

[postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

**content.js**
```javascript
// Create and inject the iframe
const iframe = document.createElement('iframe');

iframe.src = chrome.runtime.getURL('panel.html');

iframe.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 220px;
  height: 100px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 2147483647;
`;

document.documentElement.appendChild(iframe);

// Listen for keypresses on the HOST page
document.addEventListener('keydown', (e) => {
  // Send the key info to the iframe via postMessage
  iframe.contentWindow.postMessage({
    action: 'keypress',
    key: e.key,
    code: e.code
  }, '*');
});
```

**panel.html**
```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: sans-serif;
        background: #1e1e1e;
        color: white;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .label {
        font-size: 11px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .key {
        font-size: 32px;
        font-weight: bold;
        color: #4f8ef7;
        min-width: 60px;
        text-align: center;
        padding: 6px 12px;
        background: #2a2a2a;
        border-radius: 6px;
        border: 1px solid #3a3a3a;
        transition: all 0.1s ease;
      }

      .key.flash {
        background: #4f8ef7;
        color: white;
      }
    </style>
  </head>
  <body>
    <div class="label">Last Key Pressed</div>
    <div class="key" id="keyDisplay">—</div>

    <script>
      const keyDisplay = document.getElementById('keyDisplay');

      // Listen for messages from the content script
      window.addEventListener('message', (e) => {
        if (e.data.action === 'keypress') {
          // Update the displayed key
          keyDisplay.textContent = e.data.key;

          // Flash animation
          keyDisplay.classList.add('flash');
          setTimeout(() => keyDisplay.classList.remove('flash'), 150);
        }
      });
    </script>
  </body>
</html>
```


```
---

## How it all connects
```
User presses key
      ↓
content.js detects it (host page)
      ↓
postMessage({ action: 'keypress', key: 'a' })
      ↓
panel.html receives message
      ↓
Updates the UI inside the iframe


## Things todo

1. [x] implement rendering of list item
2. [x] implement toggle list that shows items
3. [x] implement selector that you can move up and down items
4. [] implement resizability
5. [x] implement fold for notes that will expand
6. [] copy and past button
  notes will be key and value
  


- after search default value should be 1
- ui have a arrow / highlight pointed item


