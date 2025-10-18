//2024 Cranford Tech Limited

//************************************************************************************************************* */
//Don't change anything below this line unless you know what you are doing
//************************************************************************************************************* */


//************************************************************************************************************* */
//Message passing between extension and bubble iframe
//************************************************************************************************************* */


// Add an event listener to listen for messages from the iframe (only if not already added)
if (!window.chrlsMessageListenerAdded) {
    window.addEventListener('message', handleMessage, false);
    window.chrlsMessageListenerAdded = true;
}


//post message to popup iframe (to be used in functions below)
function postMessageToPlugin(msg) {
    var msg = JSON.stringify(msg);
    //get extension iframe
    var chrlsIFrame = document.getElementById("chrls-iframe");
    
    // Check if iframe exists before accessing its properties
    if (!chrlsIFrame) {
        return;
    }
    
    chrlsIFrame.contentWindow.postMessage(msg, "*");
}


// Function to handle messages received from the iframe
function handleMessage(event) {
    const chrlsIFrame = document.getElementById("chrls-iframe");
    
    // Check if iframe exists before accessing its properties
    if (!chrlsIFrame) {
        return;
    }
    
    const iframeUrl = chrlsIFrame.src;

    // Check if the origin of the event matches the iframe's URL
    if (iframeUrl.indexOf(event.origin) === -1) {
        return;
    }

    // Ignore the event if no data is present
    if (!event.data) {
        return;
    }

    // Parse the received message
    const reqMessage = JSON.parse(event.data);

    // Define the available message actions
    const messageActions = {
        copyToClipboard: () => copyToClipboard(reqMessage.text),
        tabInfo: () => returnTabInfo(),
        elementText: () => getElementText(reqMessage.selector),
        elementHTML: () => getElementHTML(reqMessage.selector),
        showAlert: () => showAlert(reqMessage.alertText),
        openNewTab: () => openNewTab(reqMessage.url),
        writeToLocalStorage: () => {
            const storageAction = getStorageAction(reqMessage.context, 'write');
            storageAction(reqMessage.key, reqMessage.value);
        },
        readFromLocalStorage: () => {
            const storageAction = getStorageAction(reqMessage.context, 'read');
            return storageAction(reqMessage.key);
        },
        deleteFromLocalStorage: () => {
            const storageAction = getStorageAction(reqMessage.context, 'delete');
            storageAction(reqMessage.key);
        },
        clearLocalStorage: () => {
            const storageAction = getStorageAction(reqMessage.context, 'clear');
            storageAction();
        },
        fillInput: () => populateInputField(reqMessage.selector, reqMessage.value),
        clickElement: () => clickOnElement(reqMessage.selector),
        closePopup: () => closeModal(),
        captureScreenshot: () => captureScreenshot(),
        setBadgeTextAndColor: () => setBadgeTextAndColor(reqMessage.text, reqMessage.color),
        setIcon: () => setIcon(reqMessage.path),
        setElementText: () => setElementText(reqMessage.selector, reqMessage.text),
        setElementHTML: () => setElementHTML(reqMessage.selector, reqMessage.html),
        getLinkedInProfile: () => getLinkedInProfile()
    };

    // Execute the requested action if it exists in the messageActions object
    if (messageActions.hasOwnProperty(reqMessage.requestType)) {
        messageActions[reqMessage.requestType]();
    }
}

//************************************************************************************************************* */
//Functions to be called from the bubble iframe
//************************************************************************************************************* */


function captureScreenshot() {
    // set all modals to visible none 
    var chrlsSidebarModal = document.getElementById("chrls-sidebar-modal");
    if (chrlsSidebarModal) {
        chrlsSidebarModal.style.display = "none";
    }
    var chrlsFullModal = document.getElementById("chrls-full-modal");
    if (chrlsFullModal) {
        chrlsFullModal.style.display = "none";
    }
    var chrlsFloatingModal = document.getElementById("chrls-floating-modal");
    if (chrlsFloatingModal) {
        chrlsFloatingModal.style.display = "none";
    }

    // Send message to background.js to take screenshot
    chrome.runtime.sendMessage({ type: "captureScreenshot" }, (response) => {

    });
}

//functin to set badge text and color
function setBadgeTextAndColor(text, color) {
    chrome.runtime.sendMessage({ type: "setBadgeTextAndColor", text: text, color: color });
}


// function to set extension icon
function setIcon(path) {
    chrome.runtime.sendMessage({ type: "setIcon", path: path });
}

// Listen to messages from background.js (only add listener once)
if (!window.chrlsRuntimeListenerAdded) {
    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "postScreenShotToPlugin") {
            var msg = { returnType: "screenshot", dataUrl: request.dataUrl };
            postMessageToPlugin(msg);

            var chrlsSidebarModal = document.getElementById("chrls-sidebar-modal");
            if (chrlsSidebarModal) {
                chrlsSidebarModal.style.display = "block";
            }
            var chrlsFullModal = document.getElementById("chrls-full-modal");
            if (chrlsFullModal) {
                chrlsFullModal.style.display = "block";
            }
            var chrlsFloatingModal = document.getElementById("chrls-floating-modal");
            if (chrlsFloatingModal) {
                chrlsFloatingModal.style.display = "block";
            }
        }
    });
    window.chrlsRuntimeListenerAdded = true;
}

//helper function to get storage action
function getStorageAction(context, actionType) {
    return window.chrlsLocalStorageFunctions[context][actionType];
}

// Define the available storage functions (only if not already defined)
if (!window.chrlsLocalStorageFunctions) {
    window.chrlsLocalStorageFunctions = {
        extension: {
            write: writeToLocalStorage,
            read: readFromLocalStorage,
            delete: deleteFromLocalStorage,
            clear: clearLocalStorage
        },
        activeTab: {
            write: writeToLocalStorage,
            read: readFromLocalStorage,
            delete: deleteFromLocalStorage,
            clear: clearLocalStorage
        },
        chromeStorageLocal: {
            write: writeToChromeStorageLocal,
            read: readFromChromeStorageLocal,
            delete: deleteFromChromeStorageLocal,
            clear: clearChromeStorageLocal
        },
        chromeStorageSync: {
            write: writeToChromeStorageSync,
            read: readFromChromeStorageSync,
            delete: deleteFromChromeStorageSync,
            clear: clearChromeStorageSync
        }
    };
}


//function: close sidebar modal
function closeModal() {
    //close sidebar
    var chrlsSidebarModal = document.getElementById("chrls-sidebar-modal");
    if (chrlsSidebarModal) {
        chrlsSidebarModal.style.transition = "transform 0.8s ease";
        chrlsSidebarModal.style.transform = "translateX(" + chrlsSidebarModal.clientWidth + "px)";
        isOpened = false;
    }
    //close fullscreen modal
    var chrlsFullModal = document.getElementById("chrls-full-modal");
    if (chrlsFullModal) {
        chrlsFullModal.style.transition = "transform 0.8s ease";
        chrlsFullModal.style.transform = "translateY(100%)";
        isOpened = false;
    }
    // close floating modal
    var chrlsFloatingModal = document.getElementById("chrls-floating-modal");
    if (chrlsFloatingModal) {
        // display: none;
        chrlsFloatingModal.style.display = "none";
    }
}

//function: copy text to clipboard
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
}

//function: get infos about current tab and post to iframe
function returnTabInfo() {
    var msg = {
        "returnType": "tabInfo",
        "url": window.location.href,
        "title": document.title
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new url to iframe
    function handleEvent1(event) {
        var msg = {
            "returnType": "tabInfo",
            "url": window.location.href,
            "title": document.title
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent1);
    window.addEventListener('click', handleEvent1);

}

//function: post selected text to iframe on selection (only add listener once)
if (!window.chrlsSelectionListenerAdded) {
    document.addEventListener('selectionchange', function () {
        var selectedText = window.getSelection().toString();
        var msg = {
            "returnType": "textSelection",
            "text": selectedText
        };
        postMessageToPlugin(msg);
    });
    window.chrlsSelectionListenerAdded = true;
}

//function: get element text and post to iframe
function getElementText(selector) {
    var element = document.querySelector(selector);
    if (!element) return;
    var elementText = element.innerText;
    var msg = {
        "returnType": "getElementText",
        "selector": selector,
        "text": elementText
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new text to iframe
    function handleEvent3(event) {
        var element = document.querySelector(selector);
        if (!element) return;
        var elementText = element.innerText;
        var msg = {
            "returnType": "getElementText",
            "selector": selector,
            "text": elementText
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent3);
    window.addEventListener('click', handleEvent3);
}

//function: get element HTML and post to iframe
function getElementHTML(selector) {
    var element = document.querySelector(selector);
    if (!element) return;
    var elementHTML = element.outerHTML;
    var msg = {
        "returnType": "getElementHTML",
        "selector": selector,
        "HTML": elementHTML
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new HTML to iframe
    function handleEvent2(event) {
        var element = document.querySelector(selector);
        if (!element) return;
        var elementHTML = element.outerHTML;
        var msg = {
            "returnType": "getElementHTML",
            "selector": selector,
            "HTML": elementHTML
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent2);
    window.addEventListener('click', handleEvent2);
}

//function: set element text
function setElementText(selector, text) {
    var element = document.querySelector(selector);
    if (!element) return;
    element.innerText = text;
}

//function: set element HTML
function setElementHTML(selector, html) {
    var element = document.querySelector(selector);
    if (!element) return;
    element.innerHTML = html;
}


//function: show alert
function showAlert(alertText) {
    alert(alertText);
}

//function: open new tab
function openNewTab(newURL) {
    if (!myUrl) {
        var myUrl = newURL;
    }
    if (myUrl.substring(0, 4) == "//s3") {
        myUrl = "https:" + myUrl;
    }
    if (myUrl.substring(0, 8) != "https://") {
        myUrl = "https://" + myUrl;
    }
    window.open(myUrl, '_blank');
}


//function: fill input field
function populateInputField(selector, value) {
    var element = document.querySelector(selector);
    if (!element) return;
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = value;
        let event = new Event('input', {
            'bubbles': true,
            'cancelable': true
        });
        element.dispatchEvent(event);
    } else {
        element.innerText = value;
    }
}


//function: click on element
function clickOnElement(selector) {
    var element = document.querySelector(selector);
    if (!element) return;
    element.click();
}


//*************************************************************************************************/
//Chrome storage functions in extension context

//write to chrome window.localStorage in extension context
function writeToLocalStorage(key, value) {
    window.localStorage.setItem(key, value)
};

//read from chrome local storage
function readFromLocalStorage(key) {
    var result = window.localStorage.getItem(key);
    var msg = {
        "returnType": "localVariable",
        "key": key,
        "value": result
    };
    postMessageToPlugin(msg);
};

//delete from chrome local storage
function deleteFromLocalStorage(key) {
    window.localStorage.removeItem(key);
};

//clear chrome local storage
function clearLocalStorage() {
    window.localStorage.clear();
}


//*************************************************************************************************/
//Chrome storage functions in chrome.storage.local context
//write to chrome.storage.local
function writeToChromeStorageLocal(key, value) {
    chrome.storage.local.set({ [key]: value });
}

//read from chrome.storage.local
function readFromChromeStorageLocal(key) {
    chrome.storage.local.get(key, function (result) {
        var msg = { returnType: "localVariable", key: key, value: result[key] };
        postMessageToPlugin(msg);
    });
}

//delete from chrome.storage.local
function deleteFromChromeStorageLocal(key) {
    chrome.storage.local.remove(key);
}

//clear chrome.storage.local
function clearChromeStorageLocal() {
    chrome.storage.local.clear();
}

//*************************************************************************************************/
//Chrome storage functions in chrome.storage.sync context
//write to chrome.storage.sync
function writeToChromeStorageSync(key, value) {
    chrome.storage.sync.set({ [key]: value });
}

//read from chrome.storage.sync
function readFromChromeStorageSync(key) {
    chrome.storage.sync.get(key, function (result) {
        var msg = { returnType: "localVariable", key: key, value: result[key] };
        postMessageToPlugin(msg);
    });
}

//delete from chrome.storage.sync
function deleteFromChromeStorageSync(key) {
    chrome.storage.sync.remove(key);
}

//clear chrome.storage.sync
function clearChromeStorageSync() {
    chrome.storage.sync.clear();
}

// Function to remove emojis from text
function removeEmojis(text) {
    if (!text) return text;
    
    // Unicode ranges for emojis and symbols
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0F5}]|[\u{1F200}-\u{1F2FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu;
    
    return text.replace(emojiRegex, '').trim();
}

//*************************************************************************************************/
//function: get LinkedIn profile data and send to iframe
function getLinkedInProfile() {
    let profileData = {
        firstName: "",
        lastName: "",
        fullName: "",
        headline: "",
        location: "",
        profileUrl: window.location.href
    };
    
    // Get full name from profile
    const nameElement = document.querySelector('h1.text-heading-xlarge');
    if (nameElement) {
        profileData.fullName = nameElement.innerText.trim();
        
        // Remove emojis from the name
        profileData.fullName = removeEmojis(profileData.fullName);
        
        const nameParts = profileData.fullName.split(' ').filter(part => part.length > 0);
        profileData.firstName = nameParts[0] || "";
        profileData.lastName = nameParts.slice(1).join(' ') || "";
    }
    
    // Get headline
    const headlineElement = document.querySelector('div.text-body-medium.break-words');
    if (headlineElement) {
        profileData.headline = headlineElement.innerText.trim();
    }
    
    // Get location
    const locationElement = document.querySelector('span.text-body-small.inline.t-black--light.break-words');
    if (locationElement) {
        profileData.location = locationElement.innerText.trim();
    }
    
    // Send profile data to Bubble iframe
    var msg = {
        "returnType": "linkedInProfile",
        "data": profileData
    };
    postMessageToPlugin(msg);
}