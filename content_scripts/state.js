// ============================================================
// STATE
// ============================================================

let height = 700;
let width = 500;

let position = {
  left: 0,
  top: 0,
};

let personal_settings = {
  highlightColor: "amber",
  height: 700,
  width: 500,
  top: 5,
  left: 5,
  hide_ui: false,
  start_on_bookmarkmode: false,
};

let notes = [];
let tags = [];
let bookmarks = [];

let offsetX;
let offsetY;

let startRight;

const MIN_W = 160;
const MIN_H = 90;
