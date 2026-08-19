// main.js
import { createInitialState } from "./state.js";
import {
  initSearch,
  initDeleteMode,
  attachItemListeners,
  initSettings,
  initEventListeners,
  closeIframe,
} from "./events.js";
import { searchNotes } from "./search.js";
import { render, displayProjectTags } from "./view.js";

function getDomRefs() {
  return {
    input: document.getElementById("search-input"),
    closeIframe: document.getElementById("closeInjected"),
    resultsEl: document.getElementById("results"),
    _itemlistenerController: null,
    addEl: document.getElementById("addNotesButton"),
    numberOfResults: document.getElementById("ff-count"),
    deleteEl: document.getElementById("deleteNotesButton"),
    deleteGroupEl: document.getElementById("deleteGroup"),
    selectToDelete: document.getElementById("selectAllDeleteMode"),
    deleteConfirmBtn: document.getElementById("deleteSelectedElements"),
    actionBtnsSelectDelete: document.getElementById("actionBtnsSelectDelete"),
    cancelDeleteSelectBtn: document.getElementById("cancelDeleteSelectBtn"),
    confirmDeleteSelectedBtn: document.getElementById("confirmDeleteSelected"),
    defaultOverlayContainer: document.getElementById("default-overlay"),
    hotkeyOverlayContainer: document.getElementById("hotkey-overlay"),
    settingOverlayContainer: document.getElementById("setting-overlay"),
    showSettingsButton: document.getElementById("showSettings"),
    showKeyMapsButton: document.getElementById("showKeymaps"),
    saveSettingsButton: document.getElementById("saveSettingsButton"),
    returnFromSettingsButton: document.getElementById("returnFromSettings"),
    returnFromKeymapsButton: document.getElementById("returnFromKeymaps"),
    tagDropDown: document.getElementById("tagDropdown"),
    toggleProjectTags: document.getElementById("toggleProjectTags"),
    tagPopup: document.getElementById("popover"),
    currentTagsBox: document.getElementById("tagsAdded"),
    listProjectTags: document.getElementById("itemList"),
    addTagInput: document.getElementById("addTagInput"),
    addInputTagError: document.getElementById("tagError"),
    confirmTagInput: document.getElementById("confirmAddTagButton"),
    switchUI: document.getElementById("toggleUIButton"),
    switchUISettings: document.getElementById("toggle_hide_ui_settings"),
    addNotesTag: null,
    resetButton: document.getElementById("resetData"),
  };
}

function initializeApp() {
  const domRefs = getDomRefs();
  let state = createInitialState(); // fallback initialization

  window.addEventListener("message", (event) => {
    if (event.data.type === "TOGGLE_IFRAME") {
      domRefs.input.focus();
    }

    if (event.data.action === "initializeIframe") {
      state = createInitialState(
        event.data.notes,
        event.data.personal_settings,
        event.data.tags,
      );

      // Initialize App Events & Features
      initSearch(state, domRefs);
      initDeleteMode(state, domRefs);
      initSettings(state, domRefs);
      initEventListeners(state, domRefs);

      // Setup initial view UI
      displayProjectTags(state, domRefs);
      const results = searchNotes(
        domRefs.input.value,
        state.notes,
        state.ui.currentAlgo,
      );
      render(results, state, domRefs, attachItemListeners);
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    window.parent.postMessage({ action: "iframeReady" }, "*");
  });
}

initializeApp();
