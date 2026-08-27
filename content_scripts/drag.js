// ============================================================
// DRAGGING
// ============================================================

function makeDraggable(event) {
    const rect =
        wrapper.getBoundingClientRect();

    console.log(
        "Wrapper rect:",
        rect,
    );

    offsetX =
        event.clientX - rect.left;

    offsetY =
        event.clientY - rect.top;


    // Clear right/bottom so left/top take full control.
    wrapper.style.right = "unset";

    iframe.style.pointerEvents = "none";


    setWrapperPosition(
        event.clientX - offsetX,
        event.clientY - offsetY,
    );

    document.body.style.userSelect = "none";

    topBar.style.cursor = "grabbing";


    console.log(
        "Mouse down on top bar, starting drag with offsets:",
        offsetX,
        offsetY,
    );


    // ----------------------------------------------------------
    // Temporary drag listeners
    // ----------------------------------------------------------
    //
    // These listeners only exist while dragging.
    // They are removed in onTopBarMouseUp().
    // ----------------------------------------------------------

    window.addEventListener(
        "pointermove",
        onTopBarMouseMove,
    );

    window.addEventListener(
        "pointerup",
        onTopBarMouseUp,
    );

    window.addEventListener(
        "blur",
        onTopBarMouseUp,
    );

    document.addEventListener(
        "visibilitychange",
        documentNoLongerVisible,
    );

    window.addEventListener(
        "mouseleave",
        mouseLeftWindow,
    );
}

// ============================================================
// DRAGGING - POINTER MOVE
// ============================================================

function onTopBarMouseMove(event) {
    if (!event) {
        return;
    }

    // Primary button/touch is no longer down.
    if (event.buttons !== 1) {
        onTopBarMouseUp();
        return;
    }

    setWrapperPosition(
        event.clientX - offsetX,
        event.clientY - offsetY,
    );
}

// ============================================================
// DRAGGING - POINTER UP
// ============================================================

function onTopBarMouseUp() {
    topBar.style.cursor = "grab";

    document.body.style.userSelect = "auto";

    iframe.style.pointerEvents = "auto";


    // ----------------------------------------------------------
    // Save position
    // ----------------------------------------------------------

    personal_settings.top = Number(
        String(wrapper.style.top)
            .replace(/[^\d.-]/g, ""),
    );

    personal_settings.left = Number(
        String(wrapper.style.left)
            .replace(/[^\d.-]/g, ""),
    );


    storeData(
        "personal_settings",
        personal_settings,
    );


    // ----------------------------------------------------------
    // Remove temporary drag listeners
    // ----------------------------------------------------------

    window.removeEventListener(
        "pointermove",
        onTopBarMouseMove,
    );

    window.removeEventListener(
        "pointerup",
        onTopBarMouseUp,
    );

    window.removeEventListener(
        "blur",
        onTopBarMouseUp,
    );

    document.removeEventListener(
        "visibilitychange",
        documentNoLongerVisible,
    );

    window.removeEventListener(
        "mouseleave",
        mouseLeftWindow,
    );
}

// ============================================================
// DRAGGING - MOUSE LEAVES WINDOW
// ============================================================

function mouseLeftWindow(event) {
    if (event.relatedTarget === null) {
        onTopBarMouseMove(event);
    }
}

// ============================================================
// DRAGGING - DOCUMENT HIDDEN
// ============================================================

function documentNoLongerVisible() {
    if (document.hidden) {
        onTopBarMouseUp();
    }
}