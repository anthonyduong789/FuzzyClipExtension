// types.js

/**
 * @typedef {Object} DomRefs
 * @property {HTMLInputElement} input - The search input element ("search-input")
 * @property {HTMLElement} resultsEl - The results container ("results")
 * @property {AbortController | null} _itemlistenerController
 * @property {HTMLButtonElement} addEl - The add notes button ("addNotesButton")
 * @property {HTMLElement} numberOfResults - The results count display ("ff-count")
 * @property {HTMLButtonElement} deleteEl - The delete notes button ("deleteNotesButton")
 * @property {HTMLElement} deleteGroupEl - The delete group container ("deleteGroup")
 * @property {HTMLInputElement} selectToDelete - Select all for delete mode ("selectAllDeleteMode")
 * @property {HTMLButtonElement} deleteConfirmBtn - Confirm selected deletion ("deleteSelectedElements")
 * @property {HTMLElement} actionBtnsSelectDelete - Container for delete action buttons ("actionBtnsSelectDelete")
 * @property {HTMLButtonElement} cancelDeleteSelectBtn - Cancel select delete mode ("cancelDeleteSelectBtn")
 * @property {HTMLButtonElement} confirmDeleteSelectedBtn - Confirm delete selection ("confirmDeleteSelected")
 * @property {HTMLElement} defaultOverlayContainer - The default overlay ("default-overlay")
 * @property {HTMLElement} hotkeyOverlayContainer - The hotkeys overlay ("hotkey-overlay")
 * @property {HTMLElement} settingOverlayContainer - The settings overlay ("setting-overlay")
 * @property {HTMLButtonElement} showSettingsButton - Button to show settings ("showSettings")
 * @property {HTMLButtonElement} showKeyMapsButton - Button to show keymaps ("showKeymaps")
 * @property {HTMLButtonElement} saveSettingsButton - Button to save settings ("saveSettingsButton")
 * @property {HTMLButtonElement} returnFromSettingsButton - Button to return from settings ("returnFromSettings")
 * @property {HTMLButtonElement} returnFromKeymapsButton - Button to return from keymaps ("returnFromKeymaps")
 * @property {HTMLSelectElement} tagDropDown - The tag dropdown selector ("tagDropdown")
 * @property {HTMLButtonElement} toggleProjectTags - Button to toggle tags ("toggleProjectTags")
 * @property {HTMLElement} tagPopup - The tags popover container ("popover")
 * @property {HTMLElement} currentTagsBox - Container for added tags ("tagsAdded")
 * @property {HTMLUListElement} listProjectTags - The list of project tags ("itemList")
 * @property {HTMLInputElement} addTagInput - The list of project tags ("itemList")
 * @property {HTMLElement} addInputTagError - The list of project tags ("itemList")
 * @property {HTMLUListElement} confirmTagInput - The list of project tags ("itemList")
 * @property {HTMLInputElement} switchUI - button
 * @property {HTMLInputElement} switchUISettings - button
 * @property {HTMLElement|null} addNotesTag - button
 */

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 */

/**
 * @typedef {string} Tag
 */

/**
 * @typedef {Object} AppSettings
 * @property {string} highlightColor
 * @property {number} height
 * @property {number} width
 * @property {number} top
 * @property {number} left
 * @property {boolean} hide_ui
 * @property {any} [key]
 */

/**
 * @typedef {Object} AppUI
 * @property {string} currentAlgo
 * @property {number} selectedIndex
 * @property {number} visibleResults
 * @property {boolean} deleteMode
 * @property {boolean} selectAll
 * @property {Set<string|number>} checkboxes
 * @property {string} selectedColor
 * @property {boolean} tagSelectOn
 * @property {number} selectedTagIndex
 * @property {string|HTMLElement|null} addBox
 * @property {string|HTMLElement|null} addNotesTag
 */

/**
 * @typedef {Object} AppTimers
 * @property {number|null} debounce
 * @property {number|null} copy
 * @property {number|null} hold
 * @property {number|null} selectOpen
 */

/**
 * @typedef {Object} AppDrag
 * @property {number|null} dragIdx
 * @property {number|null} hoverIdx
 * @property {HTMLElement|null} ghostEl
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} itemHeight
 */

/**
 * @typedef {Object} AppState
 * @property {Note[]} notes
 * @property {AppSettings} settings
 * @property {Partial<AppSettings>|Object} newSettings
 * @property {Tag[]} tags
 * @property {Tag[]} activeTags
 * @property {AppUI} ui
 * @property {AppTimers} timers
 * @property {AppDrag} drag
 */

export { }; // Converts file to a module
