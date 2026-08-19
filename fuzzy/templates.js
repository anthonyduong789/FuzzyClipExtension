// templates.js
// containers the data action
// assigns actions to buttons that is used in attachItemListeners

import { escHtml, highlight } from "./utils.js";

export const dropDownIconHTML = (action) =>
  `<button class="DropDownIcon" data-action="${action}"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button>`;
export const copyIconHTML = (action) =>
  `<div class="copy-group"><button class="copy-btn" title="Copy to clipboard" data-action="${action}"><svg class="icon icon-copy" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><svg class="icon icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button></div>`;
export const confirmEditBtnsHtml = (confirm, cancel) =>
  `<div class="edit-btns">
    <button class="btn confirm-btn" aria-label="Save edit"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-action="${confirm}"><polyline points="2.5,8 6.5,12 13.5,4"/></svg>
    </button>

    <button class="btn cancel-btn cancelEditBtn" aria-label="Cancel edit" data-action="${cancel}"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
    </button>
  </div>`;
export const editIconHtml = (action) =>
  `<div class="edit-group">
    <button class="edit-btn btn" data-action="${action}">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81 3.23 11.33a.25.25 0 0 0-.064.108l-.618 2.162 2.162-.618a.25.25 0 0 0 .108-.064L11.19 6.25z" fill="#ffffff"/>
      </svg>
    </button>
  </div>`;
export const deleteBtnsHTML = (trashBtn, confirm, cancel) =>
  `<div class="delete-group">
    <button class="btn trash-btn" aria-label="Delete" data-action="${trashBtn}">
      <svg class="trash-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,5 15,5"/><path d="M6 5V3.5A0.5 0.5 0 0 1 6.5 3h5a0.5 0.5 0 0 1 0.5 0.5V5"/>
      <rect x="4" y="5" width="10" height="10" rx="1.5"/><line x1="7" y1="8" x2="7" y2="12"/><line x1="11" y1="8" x2="11" y2="12"/></svg>
    </button>

<div class="action-btns">
  <button class="btn confirm-btn confirmDeleteBtn" aria-label="Confirm delete" data-action="${confirm}">
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="2.5,8 6.5,12 13.5,4"/></svg>
  </button>
  <button class="btn cancel-btn cancelDeleteBtn" aria-label="Cancel delete" data-action="${cancel}">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round">
    <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
  </button>
</div>


</div>`;
export const addTagsBtnHtml = (action) =>
  `<div class="add-tag-btn-container" data-action="${action}"><button class="add-tag-btn"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#000000" viewBox="0 0 256 256"><path d="M246.66,123.56,201,55.13A15.94,15.94,0,0,0,187.72,48H40A16,16,0,0,0,24,64V192a16,16,0,0,0,16,16H187.72A16,16,0,0,0,201,200.88l45.63-68.44A8,8,0,0,0,246.66,123.56ZM187.72,192H40V64H187.72l42.66,64Z"></path></svg></button></div>`;

export function tagsOnNoteHtml(tags, rawIndex, action) {
  if (!tags || tags.length === 0) return "";
  return `<div class="tags-group">${tags
    .map(
      (t) =>
        `<div class="ff-badge-x"><span>${escHtml(t)}</span><button class="tags-group-button" data-raw-index="${rawIndex}" data-tag="${escHtml(t)}" aria-label="Remove tag" data-action="${action}">&#x2715;</button></div>`,
    )
    .join("")}</div>`;
}

export function checkBoxHtml(activeClass, rawIndex, action, isChecked) {
  return `
      <div class="checkbox-group ${activeClass}">
        <input type="checkbox" class="item-checkbox" data-raw-index="${rawIndex}" data-action="${action}" ${isChecked}/>
      </div>
  `;
}

export function resultItemHTML(r, i, state) {
  const isChecked = state.ui.checkboxes.has(r.rawIndex) ? "checked" : "";
  const activeClass = state.ui.deleteMode ? "active" : "";
  return `
    <div class="itemContainer" data-raw-index="${r.rawIndex}">
      <div class="itemAndTagBox">
        <div class="item">
        ${checkBoxHtml(activeClass, r.rawIndex, "toggleCheckboxDeleteMode", isChecked)}
        <input class="input-key"/>
        <span class="resultText" data-raw-index="${r.rawIndex}" data-id="${escHtml(r.id)}" data-title="${escHtml(r.title)}">
          ${highlight(r.title, r.positions)} 
        </span>
        <div class="showOnSelectBtns">${editIconHtml("startEditModeItem")}${deleteBtnsHTML("trashBtn", "confirmDeleteNote", "cancelDeleteNote")}${addTagsBtnHtml("showTagPopover")}</div>
        ${copyIconHTML("copyContent")}${dropDownIconHTML("dropDown")}
        </div>
        ${tagsOnNoteHtml(r.tags, r.rawIndex, "deleteTagFromNote")}  
      </div>
      <div class="itemContent">
        <textarea class="input-content"></textarea>
        <p class="contentText" data-content="${escHtml(r.content)}">${escHtml(r.content)}</p>
      </div>
      ${confirmEditBtnsHtml("confirmEditBtn", "cancelEditBtn")}
    </div>`;
}

export function projectTagItemHtml(tag) {
  return `
    <div class="item-row" data-id="${escHtml(tag)}">
      <span class="item-label">${escHtml(tag)}</span>
      <input class="tag-edit"/>
      <div class="tagButtons">
        <button class="icon-btn edit-btn" data-action="start-edit" title="Edit">✎</button>
        <button class="icon-btn delete-btn" data-action="start-delete" title="Delete">🗑</button>
      </div>
      <div class="action-btns">
        <button class="btn confirmTagEditBtn" data-action="confirm" aria-label="Confirm">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5,8 6.5,12 13.5,4" /></svg>
        </button>
        <button class="btn cancelTagEditBtn" data-action="cancel" aria-label="Cancel">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" /></svg>
        </button>
      </div>
    </div>`;
}
