// ============================================================
// RESIZE HANDLES
// ============================================================

function setupResizeHandles() {
    // ----------------------------------------------------------
    // Resize left
    // ----------------------------------------------------------

    const resizeLeftBar =
        document.createElement("div");

    resizeLeftBar.style.cssText = `
    position: absolute;
    bottom: 22px;
    left: -2px;
    width: 10px;
    height: 100%;
    cursor: ew-resize;
    border-radius: 10px;
  `;

    resizeLeftBar.classList.add("handle-e");

    wrapper.appendChild(resizeLeftBar);


    // ----------------------------------------------------------
    // Resize bottom
    // ----------------------------------------------------------

    const resizeBottomBar =
        document.createElement("div");

    resizeBottomBar.style.cssText = `
    position: absolute;
    bottom: -2px;
    left: 22px;
    width: 100%;
    height: 10px;
    cursor: ns-resize;
    border-radius: 10px;
  `;

    resizeBottomBar.classList.add("handle-s");

    wrapper.appendChild(resizeBottomBar);


    // ----------------------------------------------------------
    // Resize bottom-left corner
    // ----------------------------------------------------------

    const resizeLeftBottomBar =
        document.createElement("div");

    resizeLeftBottomBar.style.cssText = `
    position: absolute;
    bottom: -2px;
    left: -2px;
    width: 25px;
    height: 25px;
    cursor: nesw-resize;
    /* border-radius: 10px; */
    clip-path: polygon(
      25% 0,
      25% 75%,
      100% 75%,
      100% 100%,
      0 100%,
      0 0
    );
  `;

    resizeLeftBottomBar.classList.add("handle-se");

    wrapper.appendChild(resizeLeftBottomBar);


    // ----------------------------------------------------------
    // Attach resize behavior
    // ----------------------------------------------------------

    makeHandle(
        resizeLeftBar,
        true,
        false,
    );

    makeHandle(
        resizeBottomBar,
        false,
        true,
    );

    makeHandle(
        resizeLeftBottomBar,
        true,
        true,
    );
}

// ============================================================
// RESIZING
// ============================================================

function makeHandle(
    element,
    resizeW,
    resizeH,
) {
    // This listener is permanent.
    //
    // The pointermove and pointerup listeners created inside
    // this handler are temporary and removed when resizing ends.

    element.addEventListener(
        "pointerdown",
        function handleResizeStart(event) {
            event.preventDefault();

            element.setPointerCapture(
                event.pointerId,
            );


            // ------------------------------------------------------
            // Starting values
            // ------------------------------------------------------

            const startX = event.clientX;
            const startY = event.clientY;

            const startW =
                wrapper.offsetWidth;

            const startH =
                wrapper.offsetHeight;


            // ------------------------------------------------------
            // Position
            // ------------------------------------------------------

            const wrapperRect =
                wrapper.getBoundingClientRect();

            console.log(
                `starting wrapper pos ${wrapperRect.top} ${wrapper.left}`,
            );

            startRight =
                window.innerWidth -
                wrapper.getBoundingClientRect().right;

            wrapper.style.right =
                startRight + "px";

            wrapper.style.left = "unset";


            // ------------------------------------------------------
            // Visual state
            // ------------------------------------------------------

            wrapper.style.willChange = "width";

            wrapper.classList.add("active");

            console.log(
                "starting right position:",
                startRight,
            );


            // ------------------------------------------------------
            // Temporary pointer move
            // ------------------------------------------------------

            function onMove(event) {
                if (resizeW) {
                    const newW =
                        clampWidth(
                            startW +
                            (startX - event.clientX),
                        );

                    wrapper.style.width =
                        newW + "px";

                    wrapper.style.right =
                        startRight + "px";
                }

                if (resizeH) {
                    const newH =
                        clampHeight(
                            startH +
                            (event.clientY - startY),
                        );

                    console.log(
                        "New height:",
                        newH,
                        "min height:",
                        MIN_H,
                    );

                    wrapper.style.height =
                        newH + "px";
                }
            }


            // ------------------------------------------------------
            // Resize complete
            // ------------------------------------------------------

            function onUp() {
                // Remove temporary listeners first.
                //
                // This makes sure repeated resizing doesn't leave
                // old pointermove/pointerup handlers behind.

                element.removeEventListener(
                    "pointermove",
                    onMove,
                );

                element.removeEventListener(
                    "pointerup",
                    onUp,
                );


                // ----------------------------------------------------
                // Restore visual state
                // ----------------------------------------------------

                wrapper.style.willChange = "auto";

                wrapper.classList.remove("active");


                // ----------------------------------------------------
                // Save new dimensions
                // ----------------------------------------------------

                const rect =
                    wrapper.getBoundingClientRect();

                console.log(
                    "new left",
                    rect.left,
                );

                console.log(
                    "new top",
                    rect.top,
                );


                personal_settings.height =
                    Number(
                        String(wrapper.style.height)
                            .replace(/[^\d.-]/g, ""),
                    );

                personal_settings.width =
                    Number(
                        String(wrapper.style.width)
                            .replace(/[^\d.-]/g, ""),
                    );

                personal_settings.top =
                    rect.top;

                personal_settings.left =
                    rect.left;


                console.log(
                    "storing personal_settings",
                    personal_settings,
                );


                storeData(
                    "personal_settings",
                    personal_settings,
                );
            }


            // ------------------------------------------------------
            // Register temporary resize listeners
            // ------------------------------------------------------

            element.addEventListener(
                "pointermove",
                onMove,
            );

            element.addEventListener(
                "pointerup",
                onUp,
            );
        },
    );
}