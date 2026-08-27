// ============================================================
// EVENT LISTENER REGISTRATION
// ============================================================
//
// All permanent listeners should be registered here.
//
// This makes it much easier to see:
// - What listeners exist
// - Where they are registered
// - Whether something is accidentally registered twice
//
// The initialization guard at the top of the file makes sure
// this function cannot be reached twice by the same content
// script instance.
// ============================================================

function setupEventListeners() {
    // ----------------------------------------------------------
    // Window / iframe messages
    // ----------------------------------------------------------

    window.addEventListener(
        "message",
        handleWindowMessage,
    );


    // ----------------------------------------------------------
    // Keyboard shortcuts
    // ----------------------------------------------------------

    document.addEventListener(
        "keydown",
        handleKeydown,
    );


    // ----------------------------------------------------------
    // Dragging
    // ----------------------------------------------------------

    topBar.addEventListener(
        "mousedown",
        handleTopBarMouseDown,
    );


    // ----------------------------------------------------------
    // Window resize
    // ----------------------------------------------------------

    window.addEventListener(
        "resize",
        handleWindowResize,
    );


    // ----------------------------------------------------------
    // Outside click
    // ----------------------------------------------------------

    document.addEventListener(
        "click",
        handleDocumentClick,
    );


    // ----------------------------------------------------------
    // Chrome extension messages
    // ----------------------------------------------------------

    chrome.runtime.onMessage.addListener(
        handleRuntimeMessage,
    );
}


// ============================================================
// WINDOW MESSAGE HANDLER
// ============================================================
//
// Handles messages coming from the iframe.
//
// Previously there were two separate window "message"
// listeners. They are now consolidated into one listener.
// ============================================================

function handleWindowMessage(event) {
    // Ignore messages that aren't from the extension.
    if (!event.origin.startsWith("chrome-extension://")) {
        return;
    }

    switch (event.data?.action) {
        // --------------------------------------------------------
        // Iframe is ready
        // --------------------------------------------------------

        case "iframeReady":
            iframe.contentWindow.postMessage(
                {
                    action: "initializeIframe",
                    notes,
                    personal_settings,
                    tags,
                },
                "*",
            );

            break;


        // --------------------------------------------------------
        // Hide iframe
        // --------------------------------------------------------

        case "hide-iframe":
            wrapper.style.display = "none";
            break;


        // --------------------------------------------------------
        // Update stored data
        // --------------------------------------------------------

        case "update-data":
            storeData(
                event.data.key,
                event.data.data,
            );

            break;


        // --------------------------------------------------------
        // Toggle minimal UI
        // --------------------------------------------------------

        case "minmal-ui":
            console.log("minmal-ui");

            if (topBar.style.opacity == 0) {
                topBar.style.opacity = 1;
            } else {
                topBar.style.opacity = 0;
            }

            break;


        default:
            break;
    }
}


// ============================================================
// KEYBOARD HANDLER
// ============================================================

function handleKeydown(event) {
    if (!wrapper) {
        return;
    }

    if (event.ctrlKey && event.key === "q") {
        toggleIframe();
    }
}


// ============================================================
// TOP BAR MOUSE DOWN
// ============================================================

function handleTopBarMouseDown(event) {
    makeDraggable(event);
}


// ============================================================
// TOGGLE IFRAME
// ============================================================

function toggleIframe() {
    if (wrapper.style.display == "none") {
        wrapper.style.display = "flex";

        iframe.focus();

        iframe.contentWindow.postMessage(
            {
                type: "TOGGLE_IFRAME",
                data: "world",
            },
            "*",
        );
    } else {
        wrapper.style.display = "none";
    }
}


// ============================================================
// WINDOW RESIZE
// ============================================================

function handleWindowResize() {
    setWrapperPosition(
        personal_settings.left,
        personal_settings.top,
    );

    const newH = clampHeight(
        personal_settings.height,
    );

    const newW = clampWidth(
        personal_settings.width,
    );

    wrapper.style.height = `${newH}px`;
    wrapper.style.width = `${newW}px`;
}


// ============================================================
// OUTSIDE CLICK
// ============================================================

function handleDocumentClick(event) {
    // Check if popup is open AND the click is outside the popup.
    if (
        wrapper.style.display === "flex" &&
        !wrapper.contains(event.target)
    ) {
        wrapper.style.display = "none";
    }
}


// ============================================================
// CHROME RUNTIME MESSAGE
// ============================================================

function handleRuntimeMessage(
    message,
    sender,
    sendResponse,
) {
    if (message.type === "TOGGLE_PANEL") {
        if (wrapper) {
            toggleIframe();
        }
    }
}