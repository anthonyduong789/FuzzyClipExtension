// events.js
/** @import { AppState, DomRefs } from "./type.js" */

import {
  debounce,
  storageManager,
  generateId,
  escHtml,
  postMessageToParent,
} from "./utils.js";
import { searchNotes, searchTags } from "./search.js";
import {
  render,
  displayTags,
  displayProjectTags,
  updateSelected,
  updateResultCount,
  showHotKeys,
  returnToDefaultOverlay,
} from "./view.js";

import { createAddBox } from "./templates.js";

import { HOLD_DURATION, GHOST_SNAPBACK_MS } from "./state.js";

function triggerRender(state, domRefs) {
  render(
    searchNotes(domRefs.input.value, state.notes, state.ui.currentAlgo),
    state,
    domRefs,
    attachItemListeners(state, domRefs),
  );
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function initSearch(state, domRefs) {
  domRefs.input.addEventListener(
    "input",
    debounce(
      (e) => {
        if (e.target.value === "?") return;
        if (e.target.value[0] === "/") {
          state.ui.selectedTagIndex = 0;
          state.ui.tagSelectOn = true;
          domRefs.tagDropDown.classList.add("active");
          displayTags(
            searchTags(
              e.target.value.slice(1),
              state.tags,
              state.ui.currentAlgo,
            ),
            state,
            domRefs,
          );
        } else {
          domRefs.tagDropDown.classList.remove("active");
          state.ui.tagSelectOn = false;
          displayTags([], state, domRefs);
          state.ui.selectedIndex = 0;
          triggerRender(state, domRefs);
        }
      },
      10,
      state,
    ),
  );
}

/**
 * Handles drag and drop calculations.
 * @param {HTMLElement} triggerEl
 * @param {number} currentIndex
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function initDeleteMode(state, domRefs) {
  domRefs.deleteConfirmBtn.addEventListener("click", () => {
    domRefs.deleteConfirmBtn.style.borderColor = "var(--color-border-danger)";
    domRefs.actionBtnsSelectDelete.classList.add("open");
  });

  domRefs.deleteEl.addEventListener("click", () => {
    state.ui.deleteMode = !state.ui.deleteMode;
    domRefs.deleteEl.classList.toggle("active", state.ui.deleteMode);
    domRefs.tagPopup.classList.remove("open");
    domRefs.addNotesButton.style.display = state.ui.deleteMode
      ? "none"
      : "flex";
    domRefs.deleteGroupEl.classList.toggle("active", state.ui.deleteMode);
    state.ui.checkboxes.clear();
    state.ui.selectAll = false;
    triggerRender(state, domRefs);
  });

  domRefs.selectToDelete.addEventListener("click", () => {
    resetDeleteSelectedElementsBtn(domRefs);
    state.ui.selectAll = !state.ui.selectAll;
    const allCbs = domRefs.resultsEl.querySelectorAll(".item-checkbox");
    state.ui.checkboxes.clear();
    allCbs.forEach((cb) => {
      cb.checked = state.ui.selectAll;
      if (state.ui.selectAll)
        state.ui.checkboxes.add(Number(cb.dataset.rawIndex));
    });
    triggerRender(state, domRefs);
  });

  domRefs.confirmDeleteSelectedBtn.addEventListener("click", () => {
    if (state.ui.checkboxes.size === 0) return;
    const deleted = state.ui.checkboxes.size;
    state.notes = state.notes.filter((_, i) => !state.ui.checkboxes.has(i));
    state.ui.checkboxes.clear();
    state.ui.selectAll = false;
    storageManager("update-data", "notes", state.notes);
    resetDeleteSelectedElementsBtn(domRefs);
    triggerRender(state, domRefs);
    domRefs.numberOfResults.textContent = `${deleted} notes deleted`;
  });

  domRefs.cancelDeleteSelectBtn.addEventListener("click", () => {
    resetDeleteSelectedElementsBtn(domRefs);
  });
}

/**
 * Handles drag and drop calculations.
 * @param {HTMLElement} triggerEl
 * @param {number} currentIndex
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function showTagPopover(triggerEl, currentIndex, state, domRefs) {
  // If popover already open for this same trigger, close it and stop
  if (
    domRefs.addNotesTag &&
    domRefs.addNotesTag._triggerEl === triggerEl &&
    domRefs.addNotesTag.isConnected
  ) {
    domRefs.addNotesTag.remove();
    // domRefs.addNotesTag = null;
    return;
  }

  let availableTags = state.tags.length
    ? state.tags
        .map((tag) => {
          if (!state.notes[currentIndex].tags.includes(tag)) {
            return `
      <div class="add-tag-row" data-tag="${escHtml(tag)}">
        <span class="add-tag-label">${escHtml(tag)}</span>
        <button class="" aria-label="Add tag ${escHtml(tag)}">
        <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      `;
          } else {
            return "";
          }
        })
        .join("")
    : `<div class="add-tag-empty">No tags yet</div>`;

  if (availableTags == "") {
    availableTags = `<div class="add-tag-row"><span class="add-tag-label">No Available Tags To Add</span></div>`;
  }

  // Otherwise close whatever's open and open a new one
  if (domRefs.addNotesTag) {
    domRefs.addNotesTag.remove();
    domRefs.addNotesTag.innerHTML = availableTags;
    const rect = triggerEl.getBoundingClientRect();
    domRefs.addNotesTag.style.position = "absolute";
    domRefs.addNotesTag.style.top = `${rect.bottom + 4}px`;
    domRefs.addNotesTag.style.right = `${window.innerWidth - rect.right}px`;
    domRefs.addNotesTag.style.zIndex = "9999";
    domRefs.addNotesTag._rawIndex = currentIndex;
    domRefs.addNotesTag._triggerEl = triggerEl;
    document.body.appendChild(domRefs.addNotesTag);
    return;
  }

  const popover = document.createElement("div");
  popover.className = "add-tag-btn-popover";
  popover.innerHTML = availableTags;

  // popover.textContent = "testing here";
  document.body.appendChild(popover);

  const rect = triggerEl.getBoundingClientRect();

  popover.style.position = "absolute";
  popover.style.top = `${rect.bottom + 4}px`;
  popover.style.right = `${window.innerWidth - rect.right}px`;
  popover.style.zIndex = "9999";

  popover._triggerEl = triggerEl; // remember who opened this
  popover._rawIndex = currentIndex;
  domRefs.addNotesTag = popover;

  domRefs.addNotesTag.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-tag-row button");
    if (!btn) return;
    const row = btn.closest(".add-tag-row");
    const tag = row?.dataset.tag;
    state.notes[domRefs.addNotesTag._rawIndex].tags.push(tag);
    storageManager("update-data", "notes", state.notes);
    row.remove();
    let oldSelectedIndex = state.ui.selectedIndex;
    triggerRender(state, domRefs);
  });

  closeOnClickOutside(domRefs.addNotesTag, () => {
    domRefs.addNotesTag.remove();
    domRefs.addNotesTag = null;
  });

  return popover;
}

/**
 * Handles buttons of item Container.
 * @param {HTMLElement} triggerEl
 * @param {number} currentIndex
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function attachItemListeners(state, domRefs) {
  domRefs._itemlistenerController?.abort();
  const controller = new AbortController();
  domRefs._itemlistenerController = controller;

  domRefs.resultsEl.addEventListener(
    "click",
    (e) => {
      console.log(e.target);
      /** @type {HTMLElement}*/
      const itemContainer = e.target.closest(".itemContainer");
      if (!itemContainer) return;

      const actionBtns = itemContainer.querySelector(".action-btns");
      /**@type {HTMLButtonElement | null | HTMLElement} */
      const button = e.target.closest("[data-action]");
      const trashBtn = itemContainer.querySelector(".trash-btn");
      const resultText = itemContainer.querySelector(".resultText");
      const contentText = itemContainer.querySelector(".contentText");
      const rawIndex = Number(itemContainer.dataset.rawIndex);
      const index = [...domRefs.resultsEl.children].indexOf(itemContainer);

      // edit mode input
      const inputKey = itemContainer.querySelector(".input-key");
      const inputContent = itemContainer.querySelector(".input-content");

      console.log(index);
      // Read the action directly from the attribute!
      if (!itemContainer.classList.contains("selected")) {
        if (button?.dataset?.action != "dropDown") {
          updateSelected(index, domRefs, state);
        }
      }

      console.log(button, "new button");
      if (!button) return;
      const action = button.dataset.action;
      switch (action) {
        case "copyContent":
          navigator.clipboard
            .writeText(contentText.dataset.content)
            .then(() => {})
            .catch((err) => {
              console.error("Error copying to clipboard: ", err);
            });

          button.classList.add("copied");
          clearTimeout(state.timers.copy);
          state.timers.copy = setTimeout(
            () => button.classList.remove("copied"),
            500,
          );
          break;
        case "showTagPopover":
          showTagPopover(button, rawIndex, state, domRefs);
          break;
        case "trashBtn":
          actionBtns.classList.add("open");
          button.style.borderColor = "var(--color-border-danger)";
          break;
        case "confirmDeleteNote":
          console.log("confirmDeleteNote");
          state.notes.splice(rawIndex, 1);
          storageManager("update-data", "notes", state.notes);
          triggerRender(state, domRefs);
          break;
        case "cancelDeleteNote":
          actionBtns.classList.remove("open");
          trashBtn.style.borderColor = "";
          break;
        case "dropDown":
          itemContainer.classList.toggle("open");
          console.log("dropDown", itemContainer);
          break;
        case "startEditModeItem":
          inputKey.value = resultText.dataset.title;
          inputContent.value = contentText.dataset.content;
          itemContainer.classList.add("edit");
          break;
        case "confirmEditBtn":
          const newTitle = inputKey.value.trim();
          const newContent = inputContent.value;
          if (!newTitle) return;
          const existing = state.notes[rawIndex];
          state.notes[rawIndex] = {
            id: existing.id,
            title: newTitle,
            content: newContent,
            tags: existing.tags || [],
          };
          storageManager("update-data", "notes", state.notes);
          triggerRender(state, domRefs);
          break;
        case "cancelEditBtn":
          itemContainer.classList.remove("edit");
          break;
        case "deleteTagFromNote":
          const row = button.closest(".ff-badge-x");
          const tag = button.dataset.tag;
          state.notes[rawIndex].tags = state.notes[rawIndex].tags.filter(
            (t) => t !== tag,
          );
          storageManager("update-data", "notes", state.notes);
          row.remove();

          triggerRender(state, domRefs);
          break;
        case "toggleCheckboxDeleteMode":
          if (button.checked) {
            state.ui.checkboxes.add(rawIndex);
            close;
          } else {
            state.ui.checkboxes.delete(rawIndex);
          }
          resetDeleteSelectedElementsBtn(domRefs);
          updateResultCount(state, domRefs);
          break;
      }
    },
    { signal: controller.signal },
  );
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function resetDeleteSelectedElementsBtn(domRefs) {
  domRefs.actionBtnsSelectDelete.classList.remove("open");
  domRefs.deleteConfirmBtn.style.borderColor = "";
}

// export function attachItemListeners(state, domRefs) {
//   domRefs.resultsEl.addEventListener("click", (e) => {
//     const itemContainer = e.target.closest(".itemContainer");
//     const rawIndex = Number(itemContainer.dataset.rawIndex)
//     const tagBtn = itemContainer.querySelector(".add-tag-btn");
//     item
//     if (e.target.classList.contains('.item')) {
//       up
//     }

//     console.log(itemContainer);

//   });

//   domRefs.resultsEl.querySelectorAll(".itemContainer").forEach((el, i) => {
//     const rawIndex = Number(el.dataset.rawIndex);
//     const tagBtn = el.querySelector(".add-tag-btn");

//     el.querySelector(".item-checkbox")?.addEventListener("click", (e) => {
//       e.target.checked
//         ? state.ui.checkboxes.add(rawIndex)
//         : state.ui.checkboxes.delete(rawIndex);
//       domRefs.numberOfResults.innerText = `${state.ui.checkboxes.size} selected`;
//     });

//     el.querySelector(".item").addEventListener("click", () =>
//       updateSelected(i, domRefs, state),
//     );

//     el.querySelector(".confirmDeleteBtn")?.addEventListener("click", () => {
//       state.notes.splice(rawIndex, 1);
//       storageManager("update-data", "notes", state.notes);
//       triggerRender(state, domRefs);
//     });

//     el.querySelector(".copy-btn")?.addEventListener("click", () => {
//       const content = el.querySelector(".contentText").dataset.content;
//       navigator.clipboard.writeText(content).catch(console.error);
//     });

//     // Tag Removal from Note
//     el.querySelector(".tags-group")?.addEventListener("click", (e) => {
//       const btn = e.target.closest(".tags-group-button");
//       if (!btn) return;
//       state.notes[rawIndex].tags = state.notes[rawIndex].tags.filter(
//         (t) => t !== btn.dataset.tag,
//       );
//       storageManager("update-data", "notes", state.notes);
//       e.target.closest(".ff-badge-x").remove();
//     });
//     tagBtn.addEventListener("click", (el) => {
//       showTagPopover(tagBtn, rawIndex, state, domRefs);
//     });
//   });
// }

// =============================================================
// applies intial settings of project
// =============================================================

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function initSettings(state, domRefs) {
  settingColorPicker(state, domRefs);
  settingMinmalUI(state, domRefs);
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function saveSettings(state, domRefs) {
  domRefs.saveSettingsButton.addEventListener("click", () => {
    storageManager("update-data", "personal_settings", state.newSettings);
    state.settings = JSON.parse(JSON.stringify(state.newSettings));
    domRefs.saveSettingsButton.style.display = "none";
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function settingColorPicker(state, domRefs) {
  document.querySelectorAll(".ff-hl-swatch").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".ff-hl-swatch")
        .forEach((s) => s.classList.remove("selected"));
      el.classList.add("selected");

      domRefs.saveSettingsButton.style.display = "block";
      state.newSettings.highlightColor = el.dataset.color;
    });
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function settingMinmalUI(state, domRefs) {
  if (state.settings.hide_ui) {
    document.body.classList.add("minmal");
    domRefs.switchUI.checked = state.settings.hide_ui;
    if (domRefs.switchUI.checked) {
      document.body.classList.add("minmal");
    }
    domRefs.switchUISettings.checked = state.settings.hide_ui;
  }
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function initSettingsEvents(state, domRefs) {
  domRefs.showSettingsButton.addEventListener("click", () => {
    domRefs.defaultOverlayContainer.classList.add("hidden");
    domRefs.hotkeyOverlayContainer.classList.add("hidden");
    domRefs.settingOverlayContainer.classList.remove("hidden");
    state.newSettings = JSON.parse(JSON.stringify(state.settings));
    document.querySelectorAll(".ff-hl-swatch").forEach((el) => {
      el.classList.remove("selected");
      if (el.dataset.color === state.newSettings.highlightColor) {
        el.classList.add("selected");
      }
    });
  });

  domRefs.returnFromSettingsButton.addEventListener("click", () =>
    returnToDefaultOverlay(domRefs),
  );
  domRefs.returnFromKeymapsButton.addEventListener("click", () =>
    returnToDefaultOverlay(domRefs),
  );
  domRefs.showKeyMapsButton.addEventListener("click", () =>
    showHotKeys(domRefs),
  );

  domRefs.switchUISettings.addEventListener("change", (e) => {
    if (e.target.checked) {
      state.newSettings.hide_ui = true;
    } else {
      state.newSettings.hide_ui = false;
    }
    domRefs.saveSettingsButton.style.display = "block";
  });

  saveSettings(state, domRefs);
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function initKeyMaps(state, domRefs) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "?") {
      showHotKeys();
    }

    if (e.ctrlKey && e.key === "m") {
      if (
        domRefs.defaultOverlayContainer.classList.contains("hidden") ||
        state.ui.deleteMode
      ) {
        console.log("skip toggling ctrl + m");
        e.preventDefault();
        return;
      }
      document.body.classList.toggle("minmal");
      window.parent.postMessage({ action: "minmal-ui" }, "*");
      domRefs.switchUI.checked = !domRefs.switchUI.checked;
    }

    if (e.ctrlKey && e.key === "i") domRefs.input.focus();

    if (e.ctrlKey && e.key === "/") {
      state.activeTags = [];
      domRefs.currentTagsBox.innerHTML = "";
      triggerRender(state, domRefs);
    }
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "j")) {
      e.preventDefault();
      if (state.ui.tagSelectOn) {
        let newIndex = Math.min(
          state.ui.selectedTagIndex + 1,
          domRefs.tagDropDown.children.length - 1,
        );
        console.log("new tag Index", newIndex);
        console.log(
          "tagDropDown children",
          domRefs.tagDropDown.children.length,
        );
        domRefs.tagDropDown.children[
          state.ui.selectedTagIndex
        ].classList.remove("selected");
        domRefs.tagDropDown.children[newIndex].classList.add("selected");
        state.ui.selectedTagIndex = newIndex;
      } else {
        updateSelected(
          Math.min(state.ui.selectedIndex + 1, state.ui.visibleResults - 1),
          domRefs,
          state,
        );
      }
    }

    if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "k")) {
      e.preventDefault();
      if (state.ui.tagSelectOn) {
        let newIndex = Math.max(state.ui.selectedTagIndex - 1, 0);
        domRefs.tagDropDown.children[
          state.ui.selectedTagIndex
        ].classList.remove("selected");
        domRefs.tagDropDown.children[newIndex].classList.add("selected");
        state.ui.selectedTagIndex = newIndex;
      } else {
        let newIndex = Math.max(state.ui.selectedIndex - 1, 0);
        updateSelected(Math.max(state.ui.selectedIndex - 1, 0), domRefs, state);
      }
    }

    if (e.ctrlKey && e.key === "c") {
      const content =
        domRefs.resultsEl.children[state.ui.selectedIndex].querySelector(
          ".contentText",
        ).dataset.content;

      if (!content) return;
      navigator.clipboard
        .writeText(content)
        .then(() => {})
        .catch((err) => {
          console.error("Error copying to clipboard: ", err);
        });

      const copyBtn =
        domRefs.resultsEl.children[state.ui.selectedIndex]?.querySelector(
          ".copy-btn",
        );
      if (copyBtn) {
        copyBtn.classList.add("copied");
        clearTimeout(state.timers.copy);
        state.timers.copy = setTimeout(
          () => copyBtn.classList.remove("copied"),
          500,
        );
      }
    }

    if (e.key === "Enter") {
      if (state.ui.tagSelectOn) {
        state.activeTags.push(
          domRefs.tagDropDown.children[state.ui.selectedTagIndex]?.textContent,
        );

        domRefs.tagDropDown.classList.remove("active");
        domRefs.input.value = "";
        const tagsBoxes = state.activeTags
          .map((value, i) => {
            return `
          <div class="filter-pill">
              <button data-tag="${value}" class="filter-remove" aria-label="Remove filter">×</button>
              <span class="filter-text">${value}</span>
          </div>
        `;
          })
          .join("");

        domRefs.currentTagsBox.innerHTML = tagsBoxes;
        triggerRender(state, domRefs);
        state.ui.tagSelectOn = false;
      } else {
        domRefs.resultsEl.children[state.ui.selectedIndex]?.classList.toggle(
          "open",
        );
      }
    }

    if (e.key === "Escape" || (e.ctrlKey && e.key === "q")) {
      window.parent.postMessage({ action: "hide-iframe" }, "*");
    }

    // IF addBox is still open keyboard shortcut to add the element
    if (e.ctrlKey && e.key === "y" && state.ui.addBox) {
      const title = state.ui.addBox.querySelector(".input-key").value.trim();
      const content = state.ui.addBox.querySelector(".input-content").value;
      if (!title) return;
      state.notes.push({ id: generateId(), title, content, tags: [] });
      storageManager("update-data", "notes", state.notes);
      if (state.ui.addBox) {
        state.ui.addBox.remove();
        state.ui.addBox = null;
      }
      triggerRender(state, domRefs);
    }

    if (e.ctrlKey && e.key === "x" && state.ui.addBox) {
      console.log("prevent default");
      e.preventDefault();
      if (state.ui.addBox) {
        state.ui.addBox.remove();
        state.ui.addBox = null;
      }
    }

    if (e.ctrlKey && e.key === "a") {
      createNewNote(state, domRefs);
    }
  });
}

// =============================================================
// tag popup to add
// =============================================================

/**
 * Handles drag and drop calculations.
 * @param {Event} e
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function handleConfirmAddTag(e, state, domRefs) {
  console.log(domRefs.addTagInput.value);
  const newTag = domRefs.addTagInput.value;

  if (newTag.includes(" ") || newTag.includes("/") || newTag.length == 0) {
    domRefs.addInputTagError.innerText = "Invalid Input";
    domRefs.addTagInput.classList.add("invalid");
    domRefs.addInputTagError.classList.add("visible");
    setTimeout(() => {
      if (domRefs.addTagInput) {
        domRefs.addTagInput.classList.remove("invalid");
        domRefs.addInputTagError.classList.remove("visible");
      }
    }, 1500);
    // tag needs to be unique for other functions to work
  } else if (state.tags.includes(escHtml(newTag))) {
    domRefs.addInputTagError.innerText = "Already have Tag";
    domRefs.addTagInput.classList.add("invalid");
    domRefs.addInputTagError.classList.add("visible");
    setTimeout(() => {
      if (domRefs.addTagInput) {
        domRefs.addTagInput.classList.remove("invalid");
        domRefs.addInputTagError.classList.remove("visible");
      }
    }, 1500);
  } else {
    state.tags.push(newTag);
    domRefs.addTagInput.value = "";
    storageManager("update-data", "tags", state.tags);
    displayProjectTags(state, domRefs);
  }
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function handleTagManagement(state, domRefs) {
  //
  domRefs.toggleProjectTags.addEventListener("click", () => {
    domRefs.tagPopup.classList.toggle("open");

    if (domRefs.tagPopup.classList.contains("open")) {
      closeOnClickOutside(domRefs.tagPopup, () => {
        domRefs.tagPopup.classList.remove("open");
      });
    }
  });

  domRefs.listProjectTags.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    //fix
    const action = btn.dataset.action;
    const row = btn.closest(".item-row");
    const id = row.dataset.id;
    const actionBtns = row?.querySelector(".action-btns");
    switch (action) {
      case "start-delete":
        row.dataset.mode = "delete";
        row.classList.add("delete");
        actionBtns.classList.add("open");
        break;

      case "start-edit":
        row.dataset.mode = "edit";
        actionBtns.classList.add("open");
        row.querySelector(".tag-edit").value = id;
        row.classList.add("edit");
        break;

      case "confirm":
        if (row.dataset.mode === "delete") {
          // confirmDeleteTag(row, id);
          state.tags = state.tags.filter((tag) => tag !== id);
          storageManager("update-data", "tags", state.tags);
          for (let step = 0; step < state.notes.length; step++) {
            if (state.notes[step].tags.includes(id)) {
              state.notes[step].tags = state.notes[step].tags.filter(
                (tag) => tag !== id,
              );
            }
          }
          storageManager("update-data", "notes", state.notes);
          triggerRender(state, domRefs);
          row.remove();
        } else if (row.dataset.mode === "edit") {
          const newTagValue = row.querySelector(".tag-edit").value.trim();
          row.classList.remove("edit");

          // no-op if empty or unchanged
          if (!newTagValue || newTagValue === id) return;

          // guard against duplicate tag names
          if (state.tags.includes(newTagValue)) {
            // optionally surface this to the user instead of silently bailing
            console.warn(`Tag "${newTagValue}" already exists`);
            return;
          }
          state.tags = state.tags.map((tag) =>
            tag === id ? newTagValue : tag,
          );
          storageManager("update-data", "tags", state.tags);
          row.dataset.id = newTagValue;
          const label = row.querySelector(".item-label");
          if (label) {
            // replace all old tag with new tag notes
            for (const note of state.notes) {
              let index = note.tags.indexOf(label.textContent);

              if (index !== -1) {
                note.tags[index] = newTagValue;
              }
            }
            label.textContent = newTagValue;
          }
          storageManager("update-data", "notes", state.notes);
          triggerRender(state, domRefs);

          actionBtns.classList.remove("open");
        }
        row.dataset.mode = "";
        break;

      case "cancel":
        actionBtns.classList.remove("open");
        if (row.dataset.mode === "edit") {
          row.classList.remove("edit");
        } else if (row.dataset.mode === "delete") {
          row.classList.remove("delete");
        }

        row.dataset.mode = "";
        break;
    }
  });

  domRefs.confirmTagInput.removeEventListener("click", handleConfirmAddTag);

  domRefs.confirmTagInput.addEventListener("click", (e) =>
    handleConfirmAddTag(e, state, domRefs),
  );
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */

/**
 * Handles drag and drop calculations.
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function closeIframe(domRefs) {
  domRefs.closeIframe.addEventListener("click", () => {
    window.parent.postMessage({ action: "hide-iframe" }, "*");
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function switchUIBtn(state, domRefs) {
  domRefs.switchUI.addEventListener("click", (e) => {
    if (
      domRefs.defaultOverlayContainer.classList.contains("hidden") ||
      state.ui.deleteMode
    ) {
      console.log("skip");
      e.preventDefault();
      return;
    }

    if (e.target.checked) {
      document.body.classList.toggle("minmal");
      window.parent.postMessage({ action: "minmal-ui" }, "*");
    } else {
      document.body.classList.toggle("minmal");
      window.parent.postMessage({ action: "minmal-ui" }, "*");
    }
  });
}

export function initEventListeners(state, domRefs) {
  initSettingsEvents(state, domRefs);
  handleTagManagement(state, domRefs);
  initKeyMaps(state, domRefs);
  closeIframe(domRefs);
  switchUIBtn(state, domRefs);
  resetData(state, domRefs);
  handleTagDelete(state, domRefs);
  addNotesButton(state, domRefs);
  drag(state, domRefs);
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
function resetData(state, domRefs) {
  domRefs.resetButton.addEventListener("click", () => {
    state.notes = [
      { id: generateId(), title: "example", content: "example", tags: [] },
      { id: generateId(), title: "example1", content: "example1", tags: [] },
      {
        id: generateId(),
        title: "example2",
        content: "a second example variant",
        tags: [],
      },
      { id: generateId(), title: "Hello", content: "Hello world", tags: [] },
      { id: generateId(), title: "hello", content: "hello there", tags: [] },
      {
        id: generateId(),
        title: "helllo",
        content: "typo test - extra l",
        tags: [],
      },
      {
        id: generateId(),
        title: "Hallo",
        content: "German greeting",
        tags: [],
      },
      {
        id: generateId(),
        title: "javascript snippet",
        content: 'const x = () => console.log("test")',
        tags: ["javascript"],
      },
      {
        id: generateId(),
        title: "js snippet",
        content: "short alias for the above",
        tags: ["javascript"],
      },
      {
        id: generateId(),
        title: "meeting notes",
        content: "Discussed Q3 roadmap and budget",
        tags: ["work"],
      },
      {
        id: generateId(),
        title: "grocery list",
        content: "milk, eggs, bread, coffee",
        tags: [],
      },
      {
        id: generateId(),
        title: "todo",
        content: "finish fuzzy search implementation",
        tags: ["work"],
      },
      {
        id: generateId(),
        title: "password reset",
        content: "security question flow notes",
        tags: [],
      },
      {
        id: generateId(),
        title: "quick brown fox",
        content: "jumps over the lazy dog",
        tags: [],
      },
      {
        id: generateId(),
        title: "api key",
        content: "sk-test-1234567890abcdef",
        tags: [],
      },
      { id: generateId(), title: "", content: "empty key edge case", tags: [] },
      {
        id: generateId(),
        title: "a",
        content: "single character key",
        tags: [],
      },
      {
        id: generateId(),
        title:
          "very long key name that goes on for a while to test truncation behavior",
        content:
          "long value too, this one also has a lot of text to see how it wraps or truncates in the UI when rendered",
        tags: [],
      },
    ];
    state.settings = {
      highlightColor: "amber",
      height: 700,
      width: 500,
      top: 5,
      left: 5,
      hide_ui: false,
    };
    state.tags = ["work", "javascript"];
    storageManager("update-data", "notes", state.notes);
    storageManager("update-data", "personal_settings", state.settings);
    storageManager("update-data", "tags", state.tags);
    triggerRender(state, domRefs);
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function handleTagDelete(state, domRefs) {
  domRefs.currentTagsBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-remove");
    if (!btn) return;
    const pill = btn.closest(".filter-pill");
    const index = state.activeTags.indexOf(btn.dataset.tag);

    if (index !== -1) {
      state.activeTags.splice(index, 1);
    }
    pill.remove();
    triggerRender(state, domRefs);
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function addNotesButton(state, domRefs) {
  domRefs.addNotesButton.addEventListener("click", () => {
    createNewNote(state, domRefs);
  });
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function createNewNote(state, domRefs) {
  // will get rid of current addbox and reset
  if (state.ui.addBox) {
    state.ui.addBox.remove();
    state.ui.addBox = null;
  }
  state.ui.addBox = createAddBox();
  state.ui.addBox
    .querySelector(".confirm-btn")
    .addEventListener("click", () => {
      const title = state.ui.addBox.querySelector(".input-key").value.trim();
      const content = state.ui.addBox.querySelector(".input-content").value;
      if (!title) return;
      state.notes.push({ id: generateId(), title, content, tags: [] });
      storageManager("update-data", "notes", state.notes);
      if (state.ui.addBox) {
        state.ui.addBox.remove();
        state.ui.addBox = null;
      }
      triggerRender(state, domRefs);
    });
  state.ui.addBox.querySelector(".cancel-btn").addEventListener("click", () => {
    if (state.ui.addBox) {
      state.ui.addBox.remove();
      state.ui.addBox = null;
    }
  });
  domRefs.resultsEl.prepend(state.ui.addBox);
  state.ui.addBox.querySelector(".input-key").focus();
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function drag(state, domRefs) {
  domRefs.resultsEl.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".handleItemContainer");
    if (!handle) return;
    console.log(handle);
    e.preventDefault();
    const itemContainer = e.target.closest(".itemContainer");
    const itemAndTagBox = e.target.closest(".itemAndTagBox");
    const rect = itemAndTagBox.getBoundingClientRect();

    state.drag.dragEl = itemContainer;
    state.drag.dragId = itemContainer.dataset.rawIndex;

    console.log(itemContainer.dataset.rawIndex);
    console.log(state.drag.dragId);
    state.drag.offsetX = e.clientX - rect.left;
    state.drag.offsetY = e.clientY - rect.top;

    state.drag.ghostEl = makeGhost(itemAndTagBox, rect);
    state.drag.ghostEl.style.transform =
      "translate(" + rect.left + "px, " + rect.top + "px)";
    itemContainer.style.visibility = "hidden";

    document.addEventListener("pointermove", (e) => {
      handlePointerMove(e, state, domRefs);
    });
    document.addEventListener("pointerup", (e) => {
      handlePointerUp(e, state, domRefs);
    });
  });
}

export function makeGhost(item, rect) {
  const g = document.createElement("div");
  g.style.cssText =
    "position: fixed; top: 0; left: 0; width: " +
    rect.width * 0.95 +
    "px; border: 0.5px solid var(--border-strong); pointer-events: none; z-index: 100; background: #f4f1eb;";
  g.innerHTML = item.cloneNode(true).innerHTML;
  document.body.appendChild(g);
  return g;
}

function handlePointerMove(e, state, domRefs) {
  if (!state.drag.dragEl) return;
  e.preventDefault();
  moveGhost(state, e.clientX, e.clientY);
  updateDropLine(e.clientY, state, domRefs);
}

/**
 * Handles drag and drop calculations.
 * @param {MouseEvent} e
 * @param {AppState} state
 * @param {DomRefs} domRefs
 */
function handlePointerUp(e, state, domRefs) {
  if (!state.drag.dragEl) return;
  const cards = [
    ...domRefs.resultsEl.querySelectorAll(".itemContainer"),
  ].filter((c) => c !== state.drag.dragEl);
  let targetIndex = state.notes.length;
  let placed = false;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (e.clientY < mid) {
      const rawIndex = Number(card.dataset.rawIndex);
      targetIndex = rawIndex;
      placed = true;
      break;
    }
  }
  const fromIndex = state.drag.dragId;
  const [moved] = state.notes.splice(fromIndex, 1);
  const insertAT = placed
    ? targetIndex > fromIndex
      ? targetIndex - 1
      : targetIndex
    : state.notes.length;

  console.log("from", fromIndex, "insertAT", insertAT);
  state.notes.splice(insertAT, 0, moved);
  state.drag.dragEl = null;
  state.drag.dragId = null;

  if (state.drag.ghostEl) {
    state.drag.ghostEl.remove();
    state.drag.ghostEl = null;
  }

  triggerRender(state, domRefs);
  document.removeEventListener("pointermove", handlePointerMove);
  document.removeEventListener("pointerup", handlePointerUp);

  storageManager("update-data", "notes", state.notes);
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {number} x
 * @param {number} y
 */
function moveGhost(state, x, y) {
  // console.log(x, y);
  if (!state.drag.ghostEl) return;
  state.drag.ghostEl.style.transform =
    "translate(" +
    (x - state.drag.offsetX) +
    "px, " +
    (y - state.drag.offsetY) +
    "px)";
}

/**
 * Handles drag and drop calculations.
 * @param {number} clientY
 * @param {AppState} state
 * @param {DomRefs} domRefs
 */
function updateDropLine(clientY, state, domRefs) {
  const cards = [
    ...domRefs.resultsEl.querySelectorAll(".itemContainer"),
  ].filter((c) => c !== state.drag);
  const listRect = domRefs.resultsEl.getBoundingClientRect();
  let lineTop = null;

  if (cards.length === 0) {
    getIndicator(state, domRefs).style.display = "none";
    console.log("card Length is 0");
    return;
  }

  // TODO: have updateDropLine skip if same position orginal element is alreay in
  const firstRect = cards[0].getBoundingClientRect();
  if (clientY < firstRect.top + firstRect.height / 2) {
    lineTop = Math.max(0, firstRect.top);
  } else {
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) {
        lineTop = rect.top;
        // lineTop = rect.top - listRect.top;
        break;
      }
      lineTop = rect.bottom;
      // lineTop = rect.bottom - listRect.top;
    }
  }
  const line = getIndicator(state, domRefs);
  line.style.top = lineTop + "px";
  line.style.display = "block";
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 */
function getIndicator(state, domRefs) {
  if (!state.drag.indicator || !state.drag.indicator.isConnected) {
    state.drag.indicator = document.createElement("div");
    state.drag.indicator.style.cssText =
      "position: absolute; left: 0; right: 0; height: 2px; background: var(--border-accent); pointer-events: none; display: none; z-index: 5;";
    domRefs.resultsEl.append(state.drag.indicator);
  }
  return state.drag.indicator;
}

// Utility Function

function closeOnClickOutside(el, onClose) {
  function handleClick(e) {
    if (!el.contains(e.target)) {
      onClose();
      document.removeEventListener("click", handleClick);
    }
  }
  // defer adding the listener so the click that OPENED it doesn't immediately close it
  setTimeout(() => document.addEventListener("click", handleClick), 0);

  return () => document.removeEventListener("click", handleClick);
}
