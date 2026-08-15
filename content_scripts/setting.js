// ============================================================
// APPLY PERSONAL SETTINGS
// ============================================================

function applyPersonalSettings() {
    // ----------------------------------------------------------
    // UI visibility
    // ----------------------------------------------------------

    if (personal_settings.hide_ui !== undefined) {
        if (personal_settings.hide_ui == false) {
            topBar.style.opacity = 1;
        } else {
            topBar.style.opacity = 0;
        }
    }


    // ----------------------------------------------------------
    // Size
    // ----------------------------------------------------------

    if (
        personal_settings.height !== undefined &&
        personal_settings.width !== undefined
    ) {
        console.log(
            "wrapper style height before clamp",
            wrapper.style.height,
        );

        console.log(
            "wrapper style width before clamp",
            wrapper.style.width,
        );

        wrapper.style.height =
            `${clampHeight(personal_settings.height)}px`;

        wrapper.style.width =
            `${clampWidth(personal_settings.width)}px`;

        console.log(
            "wrapper style height after clamp",
            wrapper.style.height,
        );

        console.log(
            "wrapper style width after clamp",
            wrapper.style.width,
        );
    } else {
        wrapper.style.height =
            `${clampHeight(700)}px`;

        wrapper.style.width =
            `${clampWidth(500)}px`;

        console.log(
            "No height or width setting found, defaulting to 700px x 500px",
        );
    }


    // ----------------------------------------------------------
    // Position
    // ----------------------------------------------------------

    if (
        personal_settings.top !== undefined &&
        personal_settings.left !== undefined
    ) {
        console.log(
            "wrapper style height before clamp position",
            wrapper.style.height,
        );

        console.log(
            "wrapper style width before clamp positon",
            wrapper.style.width,
        );

        setWrapperPosition(
            personal_settings.left,
            personal_settings.top,
        );

        console.log(
            "wrapper style height AFTER clamp position",
            wrapper.style.height,
        );

        console.log(
            "wrapper style width AFTER clamp positon",
            wrapper.style.width,
        );
    } else {
        setWrapperPosition(5, 5);

        console.log(
            "No top or left setting found, defaulting to 5px",
        );
    }
}


// ============================================================
// POSITION / SIZE HELPERS
// ============================================================

/**
 * Clamp a requested position to the viewport.
 *
 * @param {number} left
 * @param {number} top
 * @returns {{left: number, top: number}}
 */

function clampPosition(left, top) {
    const maxLeft =
        Math.max(
            4,
            window.innerWidth -
            personal_settings.width -
            2,
        );

    const maxTop =
        Math.max(
            2,
            window.innerHeight -
            personal_settings.height -
            2,
        );

    console.log(
        "Max left:",
        maxLeft,
        "Max top:",
        maxTop,
    );


    return {
        left: Math.min(
            Math.max(0, left),
            maxLeft,
        ),

        top: Math.min(
            Math.max(0, top),
            maxTop,
        ),
    };
}

// ------------------------------------------------------------
// Set wrapper position
// ------------------------------------------------------------

function setWrapperPosition(left, top) {
    const pos =
        clampPosition(left, top);

    wrapper.style.left =
        `${pos.left}px`;

    wrapper.style.top =
        `${pos.top}px`;

    console.log(
        wrapper.style.left,
        wrapper.style.top,
    );
}


// ------------------------------------------------------------
// Clamp height
// ------------------------------------------------------------

function clampHeight(newHeight) {
    return Math.min(
        Math.max(
            MIN_H,
            newHeight,
        ),
        window.innerHeight - 10,
    );
}


// ------------------------------------------------------------
// Clamp width
// ------------------------------------------------------------

function clampWidth(newWidth) {
    return Math.min(
        Math.max(
            MIN_W,
            newWidth,
        ),
        window.innerWidth - 5,
    );
}