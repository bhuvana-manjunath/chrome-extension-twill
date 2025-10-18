
//2024 Cranford Tech Limited

let url = "https://app.withtwill.com/version-test/chrome-extension-v1";
let width = "320px";
let height = "680px";

//uncomment next 3 lines to open the iframe in full screen modal on page load
// chrome.runtime.sendMessage({ type: "openIframeSidebar", url: url, width: width }, function (response) {
// });


//************************************************************************************************************* */
//Main Code. Don't change anything below this line unless you know what you are doing
//************************************************************************************************************* */

// Create a rounded floating button in the bottom right corner and inject into the DOM
let button = document.createElement("button");
button.style.position = "fixed";
button.style.top = "200px";
button.style.right = "20px";
button.style.zIndex = "99999999999";
button.style.borderRadius = "50%"; // Makes the button round
button.style.width = "50px"; // Circle width
button.style.height = "50px"; // Circle height
button.style.padding = "0"; // Adjust padding to 0 for alignment
button.style.backgroundImage = "url('" + chrome.runtime.getURL('images/128x128.png') + "')";
button.style.backgroundSize = "cover"; // Ensure the image covers the entire button
button.style.backgroundPosition = "center"; // Center the background image
button.style.border = "none";
button.style.cursor = "pointer";
button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)"; // More prominent shadow
document.body.appendChild(button);


var isOpened = false;

// Track URL changes (LinkedIn is a Single Page Application)
let currentUrl = window.location.href;
let navigatedFromHome = false; // Track if user navigated from home to profile

// Function to check if current page is a LinkedIn profile page
function isProfilePage() {
    const pathname = window.location.pathname;
    // Only match main profile pages, not sub-pages like recent-activity, details, etc.
    // Pattern: /in/username/ or /in/username (with optional trailing slash)
    const profilePattern = /^\/in\/[^\/]+\/?$/;
    return profilePattern.test(pathname);
}

// Function to check if current page is LinkedIn home
function isHomePage() {
    const pathname = window.location.pathname;
    // LinkedIn home page patterns
    return pathname === '/' || pathname === '/feed/' || pathname === '/mynetwork/' || pathname === '/jobs/' || pathname === '/messaging/';
}

// Function to show/hide button based on page type
function updateButtonVisibility() {
    if (isProfilePage()) {
        button.style.display = "block";
    } else {
        button.style.display = "none";
    }
}

// Function to completely remove modal from DOM (not just hide it)
function destroyModal() {
    const floatingModal = document.getElementById("chrls-floating-modal");
    const sidebarModal = document.getElementById("chrls-sidebar-modal");
    const fullModal = document.getElementById("chrls-full-modal");
    const dataPopup = document.getElementById("chrls-data-popup");
    
    if (floatingModal) {
        floatingModal.remove();
    }
    if (sidebarModal) {
        sidebarModal.remove();
    }
    if (fullModal) {
        fullModal.remove();
    }
    if (dataPopup) {
        dataPopup.remove();
    }
}

// Function to create and show data popup
function showDataPopup(data) {
    // Remove existing data popup if it exists
    const existingPopup = document.getElementById("chrls-data-popup");
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'chrls-data-popup';
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        max-width: 90vw;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999999999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e1e5e9;
        overflow: hidden;
        animation: slideDown 0.3s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        .chrls-data-popup-header {
            background: #005BAB;
            color: white;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chrls-data-popup-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: white;
        }
        .chrls-data-popup-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        .chrls-data-popup-close:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        .chrls-data-popup-content {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        .chrls-data-item {
            margin-bottom: 16px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #005BAB;
        }
        .chrls-data-item:last-child {
            margin-bottom: 0;
        }
        .chrls-data-label {
            font-size: 12px;
            font-weight: 600;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .chrls-data-value {
            font-size: 14px;
            color: #212529;
            word-break: break-word;
        }
        .chrls-data-value:empty::before {
            content: 'Not found';
            color: #999999;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
    
    // Create header
    const header = document.createElement('div');
    header.className = 'chrls-data-popup-header';
    header.innerHTML = `
        <div>
            <h3 class="chrls-data-popup-title">📊 Data to be sent to Twill</h3>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Testing Mode Only</div>
        </div>
        <button class="chrls-data-popup-close">×</button>
    `;
    
    // Add close button functionality
    const closeButton = header.querySelector('.chrls-data-popup-close');
    closeButton.addEventListener('click', () => {
        popup.remove();
    });
    
    // Create content
    const content = document.createElement('div');
    content.className = 'chrls-data-popup-content';
    
    // Add data items
    const dataItems = [
        { label: '👤 First Name', value: data.firstName },
        { label: '👤 Last Name', value: data.lastName },
        { label: '📍 Location', value: data.currentLocation },
        { label: '🏢 Current Company', value: data.currentCompany },
        { label: '💼 Title', value: data.currentTitle },
        { label: '🔗 LinkedIn URL', value: data.linkedinUrl }
    ];
    
    dataItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'chrls-data-item';
        itemDiv.innerHTML = `
            <div class="chrls-data-label">${item.label}</div>
            <div class="chrls-data-value">${item.value || ''}</div>
        `;
        content.appendChild(itemDiv);
    });
    
    // Assemble popup
    popup.appendChild(header);
    popup.appendChild(content);
    
    // Add to page
    document.body.appendChild(popup);
    
    // Close on click outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// Set initial button visibility
updateButtonVisibility();

// Also use MutationObserver to detect when profile content loads
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if we're on a profile page and content was added
            if (isProfilePage()) {
                // Check if any of the added nodes contain h1 elements
                const addedH1s = [];
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'H1') {
                            addedH1s.push(node);
                        }
                        // Also check children
                        const childH1s = node.querySelectorAll && node.querySelectorAll('h1');
                        if (childH1s) {
                            addedH1s.push(...childH1s);
                        }
                    }
                });
                
                if (addedH1s.length > 0) {
                }
                
                // Small delay to ensure content is fully rendered
                setTimeout(() => {
                    updateButtonVisibility();
                }, 100);
            }
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Listen for URL changes and close modal when navigating to a new profile
setInterval(function() {
    if (currentUrl !== window.location.href) {
        const previousUrl = currentUrl;
        currentUrl = window.location.href;
        
        // Check if user navigated from home to profile page
        const previousPath = new URL(previousUrl).pathname;
        const currentPath = new URL(currentUrl).pathname;
        
        // Reset navigation flag
        navigatedFromHome = false;
        
        // Check if previous page was home and current page is profile
        if ((previousPath === '/' || previousPath === '/feed/' || previousPath === '/mynetwork/' || previousPath === '/jobs/' || previousPath === '/messaging/') && 
            isProfilePage()) {
            navigatedFromHome = true;
        }
        
        // Update button visibility based on new page
        updateButtonVisibility();
        
        // Close and destroy modal if it's open
        if (isOpened) {
            closeModal();
            setTimeout(destroyModal, 500); // Destroy after close animation
            isOpened = false;
        }
    }
}, 500); // Check every 500ms

// Also listen to popstate events (back/forward navigation)
window.addEventListener('popstate', function() {
    // Reset navigation flag on back/forward navigation
    navigatedFromHome = false;
    
    // Update button visibility
    updateButtonVisibility();
    
    if (isOpened) {
        closeModal();
        setTimeout(destroyModal, 500); // Destroy after close animation
        isOpened = false;
    }
});

// Function to remove emojis from text
function removeEmojis(text) {
    if (!text) return text;
    
    // Unicode ranges for emojis and symbols
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0F5}]|[\u{1F200}-\u{1F2FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu;
    
    return text.replace(emojiRegex, '').trim();
}

// Function to convert name from all caps to sentence case
function convertToSentenceCase(name) {
    if (!name) return name;
    
    // Check if the name is in all caps (excluding single letters and common abbreviations)
    const words = name.split(' ');
    const isAllCaps = words.every(word => 
        word.length <= 1 || // Single letters are fine
        word === word.toUpperCase() // All other words should be uppercase to be considered "all caps"
    );
    
    if (isAllCaps) {
        // Convert to sentence case: first letter of each word capitalized, rest lowercase
        return words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    
    return name; // Return original if not all caps
}

// Function to wait for experience section content to load
function waitForExperienceContent(timeout = 3000) {
    return new Promise((resolve) => {
        const experienceAnchor = document.querySelector('#experience');
        if (!experienceAnchor) {
            resolve(false);
            return;
        }
        
        const experienceSection = experienceAnchor.closest('section');
        if (!experienceSection) {
            resolve(false);
            return;
        }
        
        // Check if experience content is already loaded
        const firstExperience = experienceSection.querySelector('.artdeco-list__item');
        if (firstExperience) {
            resolve(true);
            return;
        }
        
        // Set up MutationObserver to watch for experience content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes contain experience items
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Check if this node or its children contain experience items
                            const experienceItems = node.querySelectorAll && node.querySelectorAll('.artdeco-list__item');
                            if (experienceItems && experienceItems.length > 0) {
                                observer.disconnect();
                                resolve(true);
                                return;
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the experience section
        observer.observe(experienceSection, {
            childList: true,
            subtree: true
        });
        
        // Timeout after specified time
        setTimeout(() => {
            observer.disconnect();
            resolve(false);
        }, timeout);
    });
}

// Function to extract additional LinkedIn profile data
async function extractLinkedInProfileData() {
    const profileData = {
        linkedinUrl: window.location.href,
        currentCompany: "",
        currentTitle: "",
        currentLocation: ""
    };
    
    // Extract location from profile header (not experience section)
    const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words');
    if (locationElement) {
        profileData.currentLocation = locationElement.textContent.trim();
    }
    
    // Wait for experience section content to load
    const experienceLoaded = await waitForExperienceContent();
    
    if (experienceLoaded) {
        // Try to find the most recent/current experience entry
        const experienceAnchor = document.querySelector('#experience');
        const experienceSection = experienceAnchor ? experienceAnchor.closest('section') : null;
        if (experienceSection) {
            // Look for the first experience entry (most recent)
            const firstExperience = experienceSection.querySelector('.artdeco-list__item');
            if (firstExperience) {
                // Check if this is a nested structure (company with multiple roles)
                // Look for job titles in sub-components to determine if it's truly multiple roles
                const subTitleElement = firstExperience.querySelector('.pvs-entity__sub-components .hoverable-link-text.t-bold span[aria-hidden="true"]');
                const hasMultipleRoles = subTitleElement && subTitleElement.textContent.trim();
                
                if (hasMultipleRoles) {
                    // This is a company with multiple roles - extract company from main level
                    const companyElement = firstExperience.querySelector('.hoverable-link-text.t-bold span[aria-hidden="true"]');
                    if (companyElement) {
                        profileData.currentCompany = companyElement.textContent.trim();
                    }
                    
                    // Extract the most recent job title from sub-components
                    if (subTitleElement) {
                        profileData.currentTitle = subTitleElement.textContent.trim();
                    }
                } else {
                    // This is a single role - extract title and company normally
                    const titleElement = firstExperience.querySelector('.hoverable-link-text.t-bold span[aria-hidden="true"]');
                    if (titleElement) {
                        profileData.currentTitle = titleElement.textContent.trim();
                    }
                    
                    // Extract company name from the t-14 t-normal span
                    const companyElement = firstExperience.querySelector('.t-14.t-normal span[aria-hidden="true"]');
                    if (companyElement) {
                        // Extract company name before the "·" separator
                        let companyText = companyElement.textContent.trim();
                        if (companyText.includes('·')) {
                            companyText = companyText.split('·')[0].trim();
                        }
                        profileData.currentCompany = companyText;
                    }
                }
            }
        }
    }
    
    // Fallback selectors for company and title
    if (!profileData.currentCompany) {
        const companyFallback = document.querySelector('.t-14.t-normal span[aria-hidden="true"]');
        if (companyFallback) {
            let companyText = companyFallback.textContent.trim();
            if (companyText.includes('·')) {
                companyText = companyText.split('·')[0].trim();
            }
            profileData.currentCompany = companyText;
        }
    }
    
    if (!profileData.currentTitle) {
        const titleFallback = document.querySelector('.hoverable-link-text.t-bold span[aria-hidden="true"]');
        if (titleFallback) {
            profileData.currentTitle = titleFallback.textContent.trim();
        }
    }
    
    return profileData;
}

// Function to extract name from LinkedIn profile with retry mechanism
function extractLinkedInName(maxRetries = 3, retryDelay = 100) {
    return new Promise((resolve) => {
        let attempts = 0;
        
        function tryExtract() {
            attempts++;
            
            let fullName = "";
            let firstName = "";
            let lastName = "";
            
            // Try H1 with dynamic class names first, then title as fallback
            const selectors = [
                'h1[class*="inline"][class*="t-24"][class*="break-words"]', // Dynamic class names
                'title',                                            // Page title as fallback
            ];
            
            let nameElement = null;
            let selectorUsed = "none";
            
            // Try each selector until we find one that works
            for (let i = 0; i < selectors.length; i++) {
                nameElement = document.querySelector(selectors[i]);
                if (nameElement && nameElement.innerText.trim()) {
                    fullName = nameElement.innerText.trim();
                    
                    // Special handling for title tag - extract name from "Name | LinkedIn" format
                    if (selectors[i] === 'title' && fullName.includes('|')) {
                        fullName = fullName.split('|')[0].trim();
                        // Remove notification count like "(1)" from the beginning
                        fullName = fullName.replace(/^\(\d+\)\s*/, '');
                    }
                    
                    selectorUsed = selectors[i];
                    break;
                }
            }
            
            // If we found a name or exhausted retries, resolve
            if (fullName || attempts >= maxRetries) {
                // Parse the name
                if (fullName) {
                    // Remove everything after comma (credentials, titles, etc.)
                    fullName = fullName.split(',')[0].trim();
                    
                    // Remove emojis from the name
                    fullName = removeEmojis(fullName);
                    
                    // Convert from all caps to sentence case if needed
                    fullName = convertToSentenceCase(fullName);
                    
                    const nameParts = fullName.split(' ').filter(part => part.length > 0);
                    firstName = nameParts[0] || "";
                    lastName = nameParts.slice(1).join(' ') || "";
                }
                
                resolve({ fullName, firstName, lastName, selectorUsed, nameElement });
            } else {
                // Retry after delay
                setTimeout(tryExtract, retryDelay);
            }
        }
        
        tryExtract();
    });
}

button.onclick = async function () {
    // If user navigated from home to profile, reload the page and set flag to open modal
    if (navigatedFromHome) {
        localStorage.setItem('openModalAfterReload', 'true');
        window.location.reload();
        return;
    }
    
    if (isOpened) {
        closeModal();
        isOpened = false;
    } else {
        // Check if we need to wait for H1 elements
        const allH1s = document.querySelectorAll('h1');
        
        // If we're on a profile page but no H1 elements exist yet, wait for them to load
        if (isProfilePage() && allH1s.length === 0) {
                // Wait for H1 elements to appear
                await new Promise((resolve) => {
                    const observer = new MutationObserver((mutations) => {
                        const h1Elements = document.querySelectorAll('h1');
                        if (h1Elements.length > 0) {
                            observer.disconnect();
                            resolve();
                        }
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    
                    // Timeout after 500ms (much faster)
                    setTimeout(() => {
                        observer.disconnect();
                        resolve();
                    }, 500);
                });
            }
        
        // Extract first and last name from LinkedIn profile (with retry)
        const { fullName, firstName, lastName, selectorUsed, nameElement } = await extractLinkedInName();
        
        // Extract additional profile data
        const profileData = await extractLinkedInProfileData();
        
        // Show custom popup with extracted data
        const popupData = {
            firstName: firstName || 'Not found',
            lastName: lastName || 'Not found',
            currentLocation: profileData.currentLocation || 'Not found',
            currentCompany: profileData.currentCompany || 'Not found',
            currentTitle: profileData.currentTitle || 'Not found',
            linkedinUrl: profileData.linkedinUrl || 'Not found'
        };
        
        showDataPopup(popupData);
        
        // Build URL with parameters
        let urlWithParams = url;
        const params = new URLSearchParams();
        
        // Add name parameters
        if (firstName) params.append('firstName', firstName);
        if (lastName) params.append('lastName', lastName);
        
        // Add additional profile data
        if (profileData.linkedinUrl) params.append('linkedinUrl', profileData.linkedinUrl);
        if (profileData.currentCompany) params.append('currentCompany', profileData.currentCompany);
        if (profileData.currentTitle) params.append('currentTitle', profileData.currentTitle);
        if (profileData.currentLocation) params.append('currentLocation', profileData.currentLocation);
        
        if (params.toString()) {
            urlWithParams = url + (url.includes('?') ? '&' : '?') + params.toString();
        }
        
        
        // Send a message to background.js to open the iframe sidebar
        chrome.runtime.sendMessage({ type: "openFloatingModal", url: urlWithParams, width: width, height: height}, function (response) {
        });
        isOpened = true;
    }
};

// Check if modal should be opened after reload
if (localStorage.getItem('openModalAfterReload') === 'true') {
    localStorage.removeItem('openModalAfterReload');
    
    // Wait a bit for the page to fully load, then open the modal
    setTimeout(async () => {
        // Check if we need to wait for H1 elements
        const allH1s = document.querySelectorAll('h1');
        
        // If we're on a profile page but no H1 elements exist yet, wait for them to load
        if (isProfilePage() && allH1s.length === 0) {
            // Wait for H1 elements to appear
            await new Promise((resolve) => {
                const observer = new MutationObserver((mutations) => {
                    const h1Elements = document.querySelectorAll('h1');
                    if (h1Elements.length > 0) {
                        observer.disconnect();
                        resolve();
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                // Timeout after 500ms
                setTimeout(() => {
                    observer.disconnect();
                    resolve();
                }, 500);
            });
        }
        
        // Extract first and last name from LinkedIn profile (with retry)
        const { fullName, firstName, lastName, selectorUsed, nameElement } = await extractLinkedInName();
        
        // Extract additional profile data
        const profileData = await extractLinkedInProfileData();
        
        // Show custom popup with extracted data
        const popupData = {
            firstName: firstName || 'Not found',
            lastName: lastName || 'Not found',
            currentLocation: profileData.currentLocation || 'Not found',
            currentCompany: profileData.currentCompany || 'Not found',
            currentTitle: profileData.currentTitle || 'Not found',
            linkedinUrl: profileData.linkedinUrl || 'Not found'
        };
        
        showDataPopup(popupData);
        
        // Build URL with parameters
        let urlWithParams = url;
        const params = new URLSearchParams();
        
        // Add name parameters
        if (firstName) params.append('firstName', firstName);
        if (lastName) params.append('lastName', lastName);
        
        // Add additional profile data
        if (profileData.linkedinUrl) params.append('linkedinUrl', profileData.linkedinUrl);
        if (profileData.currentCompany) params.append('currentCompany', profileData.currentCompany);
        if (profileData.currentTitle) params.append('currentTitle', profileData.currentTitle);
        if (profileData.currentLocation) params.append('currentLocation', profileData.currentLocation);
        
        if (params.toString()) {
            urlWithParams = url + (url.includes('?') ? '&' : '?') + params.toString();
        }
        
        // Send a message to background.js to open the iframe sidebar
        chrome.runtime.sendMessage({ type: "openFloatingModal", url: urlWithParams, width: width, height: height}, function (response) {
        });
        isOpened = true;
    }, 1000); // Wait 1 second for page to fully load
}



