// Whitelist initialization and storage
let WHITELISTED_DOMAINS = [
  'twitter.com',
  'x.com',
  'news.ycombinator.com',
  'reddit.com',
  't.co',
  'bsky.app'
];

let TARGET_DOMAINS = [
  'arxiv.org',
  'alphaxiv.org'
];

// Load configurations from storage
let ALPHAXIV_MODE = false;

// Load whitelisted domains from storage
browser.storage.sync.get('whitelistedDomains').then((result) => {
  WHITELISTED_DOMAINS = result.whitelistedDomains || WHITELISTED_DOMAINS;
});

// Load AlphaXiv mode from storage
browser.storage.sync.get('alphaxivMode').then((result) => {
  ALPHAXIV_MODE = !!result.alphaxivMode;
});

// Listen for changes in storage
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.whitelistedDomains) {
      WHITELISTED_DOMAINS = changes.whitelistedDomains.newValue;
    }
    if (changes.alphaxivMode) {
      ALPHAXIV_MODE = changes.alphaxivMode.newValue;
    }
  }
});

// Function to check if the URL is from a whitelisted domain
function isWhitelistedDomain(url) {
  return WHITELISTED_DOMAINS.some(domain => url.includes(domain));
}

// Function to check if the URL is from a whitelisted domain
function isArxivOrAlphaxiv(url) {
  return TARGET_DOMAINS.some(domain => url.includes(domain));
}

// Function to extract arXiv ID from various URL formats
function extractArxivId(url) {
  // Hugging Face paper URL
  const huggingFaceMatch = url.match(/huggingface\.co\/papers\/(\d+\.\d+)/);
  if (huggingFaceMatch) {
    return huggingFaceMatch[1];
  }

  // arXiv PDF URL
  const pdfMatch = url.match(/arxiv\.org\/pdf\/(\d+\.\d+)/);
  if (pdfMatch) {
    return pdfMatch[1];
  }

  // arXiv HTML URL
  const htmlMatch = url.match(/arxiv\.org\/html\/(\d+\.\d+)/);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // arXiv abs URL
  const absMatch = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
  if (absMatch) {
    return absMatch[1];
  }

  // AlphaXiv PDF URL
  const alphaXivPdfMatch = url.match(/alphaxiv\.org\/pdf\/(\d+\.\d+)\.pdf/);
  if (alphaXivPdfMatch) {
    return alphaXivPdfMatch[1];
  }

  // AlphaXiv abs URL
  const alphaXivAbsMatch = url.match(/alphaxiv\.org\/abs\/(\d+\.\d+)/);
  if (alphaXivAbsMatch) {
    return alphaXivAbsMatch[1];
  }

  return null;
}

// Function to generate target URL based on mode and current URL
// this should only be used for the toggling
function generateTargetUrl(arxivId, currentUrl) {
  if (ALPHAXIV_MODE) {
    // In AlphaXiv mode
    if (currentUrl.includes('arxiv.org/abs/')) {
      return `https://alphaxiv.org/abs/${arxivId}`;
    } else if (currentUrl.includes('arxiv.org/pdf/')) {
      return `https://alphaxiv.org/abs/${arxivId}`;
    } else if (currentUrl.includes('alphaxiv.org/abs/')) {
      return `https://arxiv.org/pdf/${arxivId}`;
    }
  } else {
    // In normal arXiv mode
    if (currentUrl.includes('arxiv.org/abs/')) {
      return `https://arxiv.org/pdf/${arxivId}`;
    } else if (currentUrl.includes('arxiv.org/pdf/')) {
      return `https://arxiv.org/abs/${arxivId}`;
    }
  }
  return null;
}


// Listener for webRequest to intercept and redirect links
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = details.url;
    if ( url.includes('/abs/') ) {
      return null;
    }
    // Check if it's from a whitelisted domain
    if (isWhitelistedDomain(details.originUrl)) {
      // Extract arXiv ID from Hugging Face or other links
      const arxivId = extractArxivId(url);
      
      if (arxivId) {
        // Redirect to appropriate abs page based on mode
        const absLink = ALPHAXIV_MODE 
          ? `https://alphaxiv.org/abs/${arxivId}`
          : `https://arxiv.org/abs/${arxivId}`;
	/*console.log('Attempting to redirect:', {
	  originalUrl: url,
	  arxivId: arxivId,
	  redirectUrl: absLink
	});*/
        return { redirectUrl: absLink, requestHeaders: [ { name : 'Referer', value: url }, { name: 'Origin', value: url } ] };
      }
    }
    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Hotkey command listener
browser.commands.onCommand.addListener((command) => {
  if (command === 'swap-abs') {
    let current = browser.tabs.query({active: true, currentWindow: true});
    
    function onGot(tabInfo) {
      const url = tabInfo[0].url;
      const id = tabInfo[0].id;
      
      // Extract arXiv ID
      const arxivId = extractArxivId(url);
      
      if (arxivId) {
        // Generate target URL based on current mode
        const newUrl = generateTargetUrl(arxivId, url);
        
        if (newUrl) {
          browser.tabs.update(id, {url: newUrl});
        }
      }
    }
    
    function onError(error) {
      console.log(`Error: ${error}`);
    }
    
    current.then(onGot, onError);
  }
});

// Command registration
browser.commands.getAll().then((commands) => {
  // Check if the command is already registered
  const swapAbsCommand = commands.find(cmd => cmd.name === 'swap-abs');

  if (!swapAbsCommand) {
    // Register the command if it doesn't exist
    browser.commands.create({
      name: 'swap-abs',
      description: 'Toggle between arXiv PDF and abs pages',
      suggested_key: { default: 'Ctrl+Shift+U' }
    });
  }
});

