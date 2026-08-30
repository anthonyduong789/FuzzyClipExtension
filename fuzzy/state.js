// state.js
export const HOLD_DURATION = 400;
export const GHOST_SNAPBACK_MS = 300;

export const colors = {
  amber: {
    bg: "#fde68a",
    text: "#92400e",
    activeBg: "#854d0e",
    activeText: "#fef3c7",
  },
  green: {
    bg: "#bbf7d0",
    text: "#14532d",
    activeBg: "#166534",
    activeText: "#dcfce7",
  },
  blue: {
    bg: "#bfdbfe",
    text: "#1e3a8a",
    activeBg: "#1e40af",
    activeText: "#dbeafe",
  },
  pink: {
    bg: "#fce7f3",
    text: "#831843",
    activeBg: "#9d174d",
    activeText: "#fce7f3",
  },
  coral: {
    bg: "#fed7aa",
    text: "#7c2d12",
    activeBg: "#9a3412",
    activeText: "#ffedd5",
  },
};

export function createInitialState(
  initialNotes = [],
  initialSettings = {},
  initialTags = [],
) {
  return {
    notes: initialNotes,
    settings: {
      highlightColor: "amber",
      height: 700,
      width: 500,
      top: 5,
      left: 5,
      hide_ui: false,
      ...initialSettings,
    },
    newSettings: {},
    tags: initialTags,
    activeTags: [],
    ui: {
      currentAlgo: "fzf",
      selectedIndex: 0,
      visibleResults: 0,
      deleteMode: false,
      selectAll: false,
      checkboxes: new Set(),
      selectedColor: "amber",
      tagSelectOn: false,
      selectedTagIndex: 0,
      addBox: null,
      addNotesTag: null,
    },
    timers: {
      debounce: null,
      copy: null,
      hold: null,
      selectOpen: null,
    },
    drag: {
      indicator: null,
      dragId: null,
      dragEl: null,
      ghostEl: null,
      offsetX: 0,
      offsetY: 0,
      // scroll logic
      SCROLL_ZONE: 80,
      MAX_SPEED: 5,
      autoScrollRaf: null,
      lastClientY: 0,
    },
  };
}
