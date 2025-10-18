
//2024 Cranford Tech Limited

let url = "https://app.withtwill.com/version-test/chrome-extension-v1";
let width = "320px";
let height = "660px";

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

// Function to check if current page is a LinkedIn profile page
function isProfilePage() {
    const pathname = window.location.pathname;
    // Only match main profile pages, not sub-pages like recent-activity, details, etc.
    // Pattern: /in/username/ or /in/username (with optional trailing slash)
    const profilePattern = /^\/in\/[^\/]+\/?$/;
    return profilePattern.test(pathname);
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
    
    if (floatingModal) {
        floatingModal.remove();
    }
    if (sidebarModal) {
        sidebarModal.remove();
    }
    if (fullModal) {
        fullModal.remove();
    }
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
        
        currentUrl = window.location.href;
        
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

// Function to extract additional LinkedIn profile data
function extractLinkedInProfileData() {
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
        const profileData = extractLinkedInProfileData();
        
        // Show alert with extracted data
        const alertMessage = `📊 Extracted Data\n\n` +
            `👤 First Name\n${firstName || 'Not found'}\n\n` +
            `👤 Last Name\n${lastName || 'Not found'}\n\n` +
            `📍 Location\n${profileData.currentLocation || 'Not found'}\n\n` +
            `🏢 Current Company\n${profileData.currentCompany || 'Not found'}\n\n` +
            `💼 Title\n${profileData.currentTitle || 'Not found'}\n\n` +
            `🔗 LinkedIn URL\n${profileData.linkedinUrl || 'Not found'}`;
        
        alert(alertMessage);
        
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



