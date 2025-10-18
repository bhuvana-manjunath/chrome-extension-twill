//2024 Cranford Tech Limited

var isPopupVisible = false;

//************************************************************************************************************* */
//SETUP
//************************************************************************************************************* */

//1. Define the default action when clicking the extension icon. Uncomment one of the following options and make sure the other two are commented out.

//SIDE BAR
///uncomment and adjust the next 4 lines below when the default action when clicking extension icon is to open the sidebar. Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left.
// chrome.action.onClicked.addListener(() => {
//     openIframeSidebar("https://charles-chrome-extension-demo.bubbleapps.io/version-test/popup", "400px");
// });
// isPopupVisible = false;

// FLOATTNG MODAL
// uncomment and adjust the next 4 lines below when the default action when clicking extension icon is to open the floating modal.Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
chrome.action.onClicked.addListener(() => {
    openFloatingModal("https://app.withtwill.com/version-test/chrome-extension-v1", "660px", "320px");
});
isPopupVisible = false;

//FULL SCREEN MODAL
//uncomment and adjust the next 4 lines below when the default action when clicking extension icon is to open the full screen modal. Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
// chrome.action.onClicked.addListener(() => {
//     openIframeModal("https://charles-chrome-extension-demo.bubbleapps.io/popup");
// });
// isPopupVisible = false;


// ALTERNATIVELY IF YOU WANT THE SIDEBAR (OR ANY OTHER ACTION) TO OPEN ONLY DIRECTYL ON SPECIFIC PAGES, UNCOMMENT THE FOLLOWING CODE AND ADJUST THE URL
isPopupVisible = false;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && !isPopupVisible) {
        const url = new URL(tab.url);
        if (url.hostname === 'buildwithcharles.io') {
            // openIframeSidebar("https://app.withtwill.com/version-test/chrome-extension-v1", "400px");
                openFloatingModal("https://app.withtwill.com/version-test/chrome-extension-v1", "400px", "400px");
            //     openIframeModal("https://charles-chrome-extension-demo.bubbleapps.io/popup");
            isPopupVisible = true;
        }
    }
});



// 2. Adjust the URL in lines 13, 19, or 25 to point to your Bubble app. Start the URL with https:://…


//3. Define the page that will open when the extesion is installed / uninstalled. Uncomment the lines below and replace the URL with the URL you want to open on install / uninstall

// Open a page on install. comment / uncomment the lines below and replace the URL with the URL you want to open on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: "https://buildwithcharles.io/welcome" });
    }
});

// // open a page on uninstall. uncomment the line below and replace the URL with the URL you want to open on uninstall
// chrome.runtime.setUninstallURL("https://buildwithcharles.io/welcome");


//************************************************************************************************************* */
//Main Code. Don't change anything below this line unless you know what you are doing
//************************************************************************************************************* */


// Define the available message handlers
const messageHandlers = {
    openIframeSidebar: (request) => openIframeSidebar(request.url, request.width),
    openIframeModal: (request) => openIframeModal(request.url),
    openFloatingModal: (request) => openFloatingModal(request.url, request.height, request.width),
    captureScreenshot: (request) => captureScreenshot(request),
    setBadgeTextAndColor: (request) => setBadgeTextAndColor(request.text, request.color),
    setIcon: (request) => setIcon(request.path),
};

// Message listener for handling messages from popup.js and content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Get the appropriate handler based on the request type
    const handler = messageHandlers[request.type];

    // Execute the handler if it exists
    if (handler) {
        handler(request);
        sendResponse({ status: "done", handler: request.type });
    } else {
        sendResponse({ status: "error", message: "Unknown request type" });
    }

});

// Define utility functions for injecting CSS and executing scripts
const functions = {
    // Function to inject CSS and execute a script in a specific tab
    injectCSSAndExecuteScript: (tabId, cssFiles, jsFiles, callback) => {
        // Insert the CSS files
        chrome.scripting.insertCSS({ target: { tabId }, files: cssFiles }, () => {
            // Execute the script files after CSS insertion is complete
            chrome.scripting.executeScript({ target: { tabId }, files: jsFiles }, callback);
        });
    },
};

// Function: open iframe in Sidebar
function openIframeSidebar(url, width) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        functions.injectCSSAndExecuteScript(tab.id, ["files/modal.css"], ["files/modal.js"], () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: openSidebar,
                args: [url, width],
            });
        });
        // Send message to the popup to close it if it's active
        isPopupVisible ? chrome.runtime.sendMessage({ type: 'closePopup' }) : null;
    });
}

// Function: open iframe in floating Modal
function openFloatingModal(url, height, width) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        functions.injectCSSAndExecuteScript(tab.id, ["files/modal.css"], ["files/modal.js"], () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: openFloating,
                args: [url, height, width],
            });
        });
        // Send message to the popup to close it if it's active
        isPopupVisible ? chrome.runtime.sendMessage({ type: 'closePopup' }) : null;
    });
}

// Function: open iframe in full screen Modal
function openIframeModal(url) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        functions.injectCSSAndExecuteScript(tab.id, ["files/modal.css"], ["files/modal.js"], () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: openModal,
                args: [url],
            });
        });
        // Send message to the popup to close it if it's active
        isPopupVisible ? chrome.runtime.sendMessage({ type: 'closePopup' }) : null;
    });
}

//open Sidebar: injection function
function openSidebar(url, width) {
    // Check if sidebar is already in the DOM
    var existingSidebar = document.getElementById("chrls-sidebar-modal");
    if (!existingSidebar) {
        //create sidebar elements
        var chrlsSidebarModal = document.createElement("div");
        chrlsSidebarModal.id = "chrls-sidebar-modal";
        chrlsSidebarModal.style.width = width;
        chrlsSidebarModal.style.right = "-" + width;

        var chrlsSidebarContent = document.createElement("iframe");
        chrlsSidebarContent.id = "chrls-iframe";
        chrlsSidebarContent.src = url;
        // chrlsSidebarContent.style.display = 'none';
        //allow microphone access
        chrlsSidebarContent.allow = "microphone";

        chrlsSidebarModal.appendChild(chrlsSidebarContent);

        // Create the spinner element
        var spinnerContainer = document.createElement("div");
        spinnerContainer.className = "loading-animation";
        spinnerContainer.id = "chrls-loading-animation";
        var spinner = document.createElement("div");
        spinner.className = "chrls-spinner";
        spinnerContainer.appendChild(spinner);
        chrlsSidebarModal.appendChild(spinnerContainer);

        //add sidebar to DOM 
        document.body.appendChild(chrlsSidebarModal);

        // Hide loader and show the iframe when it is fully loaded
        var loadingAnimation = document.getElementById('chrls-loading-animation');
        var iframe = document.getElementById('chrls-iframe');
        iframe.addEventListener('load', function () {
            loadingAnimation.style.display = 'none';
            iframe.style.display = 'block';
        });

        //adding ability to manually resize sidebar
        let isResizing = false;

        document.addEventListener('mousedown', (e) => {
            const sidebar = document.getElementById("chrls-sidebar-modal");
            if (e.target === sidebar && e.clientX < sidebar.getBoundingClientRect().left + 10) {
                isResizing = true;
                document.addEventListener('mousemove', handleResize);

                // Disable pointer events for everything else
                document.body.style.pointerEvents = 'none';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.removeEventListener('mousemove', handleResize);

                // Re-enable pointer events
                document.body.style.pointerEvents = '';
            }
        });

        function handleResize(e) {
            const sidebar = document.getElementById("chrls-sidebar-modal");
            const sidebarRight = window.innerWidth - e.clientX;
            sidebar.style.width = `${sidebarRight}px`;
        }


    }

    //use animation to show sidebar
    var chrlsSidebarModal = document.getElementById("chrls-sidebar-modal");
    // Position the sidebar right outside the screen on the right side
    chrlsSidebarModal.style.right = "-" + chrlsSidebarModal.clientWidth + "px";
    setTimeout(function () {
        chrlsSidebarModal.style.transform = "translateX(-" + chrlsSidebarModal.clientWidth + "px)";
    }
        , 200);
};


// open floating modal: injection function
function openFloating(url, height, width) {
    // Check if floating modal is already in the DOM
    var existingModal = document.getElementById("chrls-floating-modal");
    if (!existingModal) {
        //create floating modal elements
        var chrlsFloatingModal = document.createElement("div");
        chrlsFloatingModal.id = "chrls-floating-modal";
        // set width and height of the floating modal 
        chrlsFloatingModal.style.width = width;
        chrlsFloatingModal.style.height = height;

        var chrlsFloatingContent = document.createElement("iframe");
        chrlsFloatingContent.id = "chrls-iframe";
        chrlsFloatingContent.src = url;
        // chrlsFloatingContent.style.display = 'none';
        //allow microphone access
        chrlsFloatingContent.allow = "microphone";

        chrlsFloatingModal.appendChild(chrlsFloatingContent);

        // Create the spinner element
        var spinnerContainer = document.createElement("div");
        spinnerContainer.className = "loading-animation";
        spinnerContainer.id = "chrls-loading-animation";
        var spinner = document.createElement("div");
        spinner.className = "chrls-spinner";
        spinnerContainer.appendChild(spinner);
        chrlsFloatingModal.appendChild(spinnerContainer);

        //add floating modal to DOM 
        document.body.appendChild(chrlsFloatingModal);

        // Hide loader and show the iframe when it is fully loaded
        var loadingAnimation = document.getElementById('chrls-loading-animation');
        var iframe = document.getElementById('chrls-iframe');
        iframe.addEventListener('load', function () {
            loadingAnimation.style.display = 'none';
            iframe.style.display = 'block';
        });
    }
    // select floating modal from page and display block
    var chrlsFloatingModal = document.getElementById("chrls-floating-modal");
    chrlsFloatingModal.style.display = "block";
};



//open Modal: injection function
function openModal(url) {
    var existingFullModal = document.getElementById("chrls-full-modal");
    if (!existingFullModal) {

        //create modal
        document.body.style.overflow = "hidden";

        var chrlsFullModal = document.createElement("div");
        chrlsFullModal.id = "chrls-full-modal";
        chrlsFullModal.style.top = "100%";

        var chrlsFullContent = document.createElement("iframe");
        chrlsFullContent.id = "chrls-iframe";
        chrlsFullContent.src = url;
        // chrlsFullContent.style.display = 'none';
        //allow microphone access
        chrlsFullContent.allow = "microphone";

        chrlsFullModal.appendChild(chrlsFullContent);

        // Create the spinner element
        var spinnerContainer = document.createElement("div");
        spinnerContainer.className = "loading-animation";
        spinnerContainer.id = "chrls-loading-animation";
        var spinner = document.createElement("div");
        spinner.className = "chrls-spinner";
        spinnerContainer.appendChild(spinner);
        chrlsFullModal.appendChild(spinnerContainer);

        //add full to DOM 
        document.body.appendChild(chrlsFullModal);

        // Hide loader and show the iframe when it is fully loaded
        var loadingAnimation = document.getElementById('chrls-loading-animation');
        var iframe = document.getElementById('chrls-iframe');
        iframe.addEventListener('load', function () {
            loadingAnimation.style.display = 'none';
            iframe.style.display = 'block';
        });
    }

    //use animation to show full
    var chrlsFullModal = document.getElementById("chrls-full-modal");
    setTimeout(function () {
        chrlsFullModal.style.transform = "translateY(-100%)";
    }
        , 200);
};



function captureScreenshot() {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        // Send the screenshot data to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'postScreenShotToPlugin', dataUrl: dataUrl });
                // send response 
                sendResponse({ status: "done", message: "Screenshot captured" });
            } else {
            }
        });
    });
}

//functin to set badge text and color
function setBadgeTextAndColor(text, color) {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
}


// function to set extension icon
function setIcon(path) {
    chrome.action.setIcon({ path: path });
}