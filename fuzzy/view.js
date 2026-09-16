// view.js
// helper function that helps is used toggle ui implmentes and give a 
// central places to toggle ui implements from


/** @import { AppState, DomRefs } from "../type.js" */
import {
  resultItemHTML,
  projectTagItemHtml,
  resultBookmarkHtml,
} from "./templates.js";

import {
  triggerRender,
} from "./events.js"


import { colors } from "./state.js";

export function injectMatchStyle(color) {
  let el = document.getElementById("match-style");
  if (!el) {
    el = document.createElement("style");
    el.id = "match-style";
    document.head.appendChild(el);
  }
  const c = colors[color] || colors.amber;
  el.textContent = `.match { background: ${c.bg}; color: ${c.text}; border-radius: 2px; padding: 0 1px; }`;
}

export function updateResultCount(state, domRefs) {
  domRefs.numberOfResults.innerText =
    state.mode == "deleteNotes"
      ? `${state.ui.checkboxes.size} selected`
      : `${state.ui.visibleResults} results`;
}

/**
 *
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void}
 */
export function updatedActiveTags(state, domRefs) {
  if (state.mode == "default" || state.mode == "deleteNotes") {
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
  } else if (state.mode == "bookmark") {
    domRefs.currentTagsBox.innerHTML = "";
  }
}

export function updateSelectedNote(newIndex, domRefs, state) {
  domRefs.resultsEl.children[state.ui.selectedIndex]?.classList.remove(
    "selected",
  );
  domRefs.resultsEl.children[newIndex]?.classList.add("selected");
  domRefs.resultsEl.children[state.ui.selectedIndex]?.classList.remove("open");

  clearTimeout(state.timers.selectOpen);

  const newItem = domRefs.resultsEl.children[newIndex];

  state.timers.selectOpen = setTimeout(() => {
    newItem?.classList.add("open");

    // browser will scroll into view after the height has changed for item
    const handleTransitionEnd = (e) => {
      console.log("handleTransitionEnd", e.propertyName);
      if (e.propertyName !== "height") return;

      newItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });

      newItem.removeEventListener("transitionend", handleTransitionEnd);
    };

    newItem?.addEventListener("transitionend", handleTransitionEnd);

    state.timers.selectOpen = null;
  }, 200);

  state.ui.selectedIndex = newIndex;
  const sel = domRefs.resultsEl.querySelector(".selected");
  if (sel) sel.scrollIntoView({ block: "nearest" });
}

export function updateSelelectedBookmark(newIndex, state, domRefs) {
  domRefs.resultsEl.children[state.ui.selectedIndex]?.classList.remove(
    "selected",
  );
  domRefs.resultsEl.children[newIndex]?.classList.add("selected");
  // domRefs.resultsEl.children[state.ui.selectedIndex]?.classList.remove("open");
  state.ui.selectedIndex = newIndex;
  const sel = domRefs.resultsEl.querySelector(".selected");
  if (sel) sel.scrollIntoView({ block: "nearest" });
}

export function syncSelectAllButton(state, domRefs) {
  domRefs.selectToDelete.textContent = state.ui.selectAll
    ? "Deselect All"
    : "Select All";
}

/**
 * Handles drag and drop calculations.
 * @param {Array} results // elements that where filtered by search
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @param {void} attachListenersCallback
 * @returns {void}
 */
export function render(results, state, domRefs, attachListenersCallback) {
  injectMatchStyle(state.settings.highlightColor);
  let renderHandle = true;
  if (domRefs.input.value || state.mode == "deleteNotes") {
    renderHandle = false;
  }

  if (state.mode == "default" || state.mode == "deleteNotes") {
    domRefs.resultsEl.innerHTML = results
      .map((item, index) => {
        const hasActiveTags =
          state.activeTags.length === 0 ||
          state.activeTags.every((t) =>
            state.notes[item.rawIndex].tags.includes(t),
          );
        return hasActiveTags
          ? resultItemHTML(item, index, state, renderHandle)
          : "";
      })
      .join("");
    if (attachListenersCallback) attachListenersCallback(state, domRefs);
    updateSelectedNote(state.ui.selectedIndex, domRefs, state);
  } else if (state.mode == "bookmark") {
    domRefs.resultsEl.innerHTML = results
      .map((bookmark, index) => {
        return resultBookmarkHtml(bookmark);
      })
      .join("");
    updateSelelectedBookmark(state.ui.selectedIndex, state, domRefs);
  }
  state.ui.visibleResults = domRefs.resultsEl.children.length;

  updateResultCount(state, domRefs);
  syncSelectAllButton(state, domRefs);
}

/**
 * Handles drag and drop calculations.
 * @param {Array} foundTags
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @returns {void} The new offset X
 */
export function displayTags(foundTags, state, domRefs) {
  let results = foundTags
    .map((item, i) => {
      if (state.activeTags.includes(item.tag)) return "";
      return `<div data-tag="${item.tag}" class="tag-option ${state.ui.selectedTagIndex === i ? "selected" : ""}">${item.tag}</div>`;
    })
    .join("");
  if (results === "")
    results = '<div class="tag-option">No Available Tags</div>';
  domRefs.tagDropDown.innerHTML = results;
}

export function displayProjectTags(state, domRefs) {
  domRefs.listProjectTags.innerHTML = state.tags
    .map((tag) => projectTagItemHtml(tag))
    .join("");
}

export function showHotKeys(domRefs) {
  domRefs.defaultOverlayContainer.classList.toggle("hidden");
  domRefs.hotkeyOverlayContainer.classList.toggle("hidden");
}

export function returnToDefaultOverlay(domRefs) {
  domRefs.defaultOverlayContainer.classList.remove("hidden");
  domRefs.hotkeyOverlayContainer.classList.add("hidden");
  domRefs.settingOverlayContainer.classList.add("hidden");
  domRefs.saveSettingsButton.style.display = "none";
}

/**
 * Handles drag and drop calculations.
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @param {'bookmark'|'default'} mode
 */
export function toggleBookmarkMode(state, domRefs, mode) {
  domRefs.bookmarksBtn.classList.toggle('active')
  domRefs.input.value = ''
  if (mode === undefined) {
    if (state.mode == "bookmark") {
      state.mode = "default";
      domRefs.bookmarksBtn.title = 'bookmark mode'
      domRefs.leftButtonContainer.style.display = 'flex'
    } else {
      state.mode = "bookmark";
      domRefs.bookmarksBtn.title = 'notes mode'
      domRefs.leftButtonContainer.style.display = 'none'
    }
  }

  if (mode == 'bookmark') {
    state.mode = "bookmark";
    domRefs.bookmarksBtn.title = 'notes mode'
    domRefs.leftButtonContainer.style.display = 'none'
  }

  if (mode == 'default') {
    state.mode = "default";
    domRefs.bookmarksBtn.title = 'bookmark mode'
    domRefs.leftButtonContainer.style.display = 'flex'

  }


  triggerRender(state, domRefs);
  updatedActiveTags(state, domRefs);
  domRefs.input.focus();
}


/**
 * sets up the ui elements for minaml
 * @param {AppState} state
 * @param {DomRefs} domRefs
 * @param {Boolean} minmal
 * @returns {void} The new offset X
 */
export function settingMinmalUI(state, domRefs, minmal) {
  if (minmal == true) {
    if (!document.body.classList.contains('minmal')) {
      document.body.classList.add("minmal");
    }
  }
  else {
    if (document.body.classList.contains('minmal')) {
      document.body.classList.remove("minmal");
    }
  }
  domRefs.switchUI.checked = minmal;
  domRefs.switchUISettings.checked = minmal

}

