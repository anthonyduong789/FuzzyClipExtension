// view.js
import { resultItemHTML, projectTagItemHtml } from "./templates.js";
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
  domRefs.numberOfResults.innerText = state.ui.deleteMode
    ? `${state.ui.checkboxes.size} selected`
    : `${state.ui.visibleResults} results`;
}

export function updateSelected(newIndex, domRefs, state) {
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

export function syncSelectAllButton(state, domRefs) {
  domRefs.selectToDelete.textContent = state.ui.selectAll
    ? "Deselect All"
    : "Select All";
}

export function render(results, state, domRefs, attachListenersCallback) {
  injectMatchStyle(state.settings.highlightColor);
  let renderHandle = true;
  if (domRefs.input.value || state.ui.deleteMode) {
    renderHandle = false;
  }
  console.log(renderHandle);
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

  state.ui.visibleResults = domRefs.resultsEl.children.length;
  updateResultCount(state, domRefs);
  syncSelectAllButton(state, domRefs);
  updateSelected(state.ui.selectedIndex, domRefs, state);

  if (attachListenersCallback) attachListenersCallback(state, domRefs);
}

export function displayTags(foundTags, state, domRefs) {
  let results = foundTags
    .map((item, i) => {
      if (state.activeTags.includes(item.tag)) return "";
      return `<div class="tag-option ${state.ui.selectedTagIndex === i ? "selected" : ""}">${item.tag}</div>`;
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
