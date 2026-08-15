// ============================================================
// STORAGE
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
        chrome.storage.sync.get(
            key,
            (result) => {
                resolve(result[key]);
            },
        );
    });
}


async function loadAllData() {
    try {
        // Await the actual storage object.
        const allData =
            await chrome.storage.sync.get(null);

        return allData;
    } catch (error) {
        console.error(
            "Error loading from local storage:",
            error,
        );

        return {};
    }
}