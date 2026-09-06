chrome.action.onClicked.addListener((tab) => {
    // tab.id is the active tab the user clicked the icon while on
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
});

// If these names occur as top-level bookmark names, then they are not included in the names of
// bookmark folders.
const ignoredTopLevelBookmarks = {
    "Other Bookmarks": true,
    "Mobile Bookmarks": true,
    "Bookmarks Bar": true,
};

const folderSeparator = "/";
class BookmarkCompleter {
    constructor() {
        this.bookmarks = []
    }
    async refresh() {
        // In case refresh() is called multiple times before chrome.bookmarks.getTree() completes, only
        // call chrome.bookmarks.getTree() once.
        if (this.bookmarksTreePromise) {
            await this.bookmarksTreePromise;
            console.log("already bookmarksTreePromise")
            return;
        }
        this.bookmarksTreePromise = await chrome.bookmarks.getTree();

        const bookmarksTree = await this.bookmarksTreePromise;
        this.bookmarks = this.traverseBookmarks(bookmarksTree)
            .filter((b) => b.url != null);
        this.bookmarksTreePromise = null;
        console.log("refresh called")
    }


    // Traverses the bookmark hierarchy, and returns a flattened list of all bookmarks.
    traverseBookmarks(bookmarks) {
        const results = [];
        for (const folder of bookmarks) {
            this.traverseBookmarksRecursive(folder, results);
        }
        return results;
    }

    // Recursive helper for `traverseBookmarks`.
    traverseBookmarksRecursive(bookmark, results, parent) {
        if (parent == null) {
            parent = { pathAndTitle: "" };
        }
        if (
            bookmark.title &&
            !((parent.pathAndTitle === "") && ignoredTopLevelBookmarks[bookmark.title])
        ) {
            bookmark.pathAndTitle = parent.pathAndTitle + folderSeparator + bookmark.title;
        } else {
            bookmark.pathAndTitle = parent.pathAndTitle;
        }
        results.push(bookmark);
        if (bookmark.children) {
            for (const child of bookmark.children) {
                this.traverseBookmarksRecursive(child, results, bookmark);
            }
        }
    }

}


let bookmarkNode;
if (!bookmarkNode) {
    bookmarkNode = new BookmarkCompleter
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received from:", sender.id);

    if (message.action === "getBookMarks") {

        // Synchronous response
        console.log("received getBookmarks action")
        if (bookmarkNode.bookmarks.length == 0) {

            console.log("refreshing available bookmarks")
            bookmarkNode.refresh().then(() => {
                console.log("Sending response", bookmarkNode.bookmarks)
                sendResponse({ bookmarks: bookmarkNode.bookmarks });
            })

        }
        else {
            console.log("already bookmarks")
            sendResponse({ bookmarks: bookmarkNode.bookmarks });
        }
        return true; // <-- required for async sendResponse

    }
});




