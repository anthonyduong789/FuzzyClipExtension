/** @import { Bookmark, Note, Tag} from "../type" */



// ============================================================
// STORAGE 
// responsible for loading in data 
// ============================================================

function storeData(key, value) {
  chrome.storage.sync.set(
    {
      [key]: value,
    },
    () => {
      console.log("Saved!");
    },
  );
}

async function loadData(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

async function loadAllData() {
  try {
    // Await the actual storage object.
    const allData = await chrome.storage.sync.get(null);

    return allData;
  } catch (error) {
    console.error("Error loading from local storage:", error);

    return {};
  }
}



/**
 * Requests the user's bookmarks from the background scipt
 * 
 * @returns {Promise<Bookmark[]>}
 * A promise that resolves to an array of bookmark nodes
 * @throws {Error} If the background scipt request fails
 */
async function requestBookmarks() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getBookMarks" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      console.log("resolve", response.bookmarks)
      resolve(response.bookmarks);
      return true;
    });
  });
}