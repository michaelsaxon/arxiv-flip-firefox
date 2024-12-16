const commandName = 'swap-abs';
const DEFAULT_DOMAINS = [
  'twitter.com',
  'x.com',
  'scholar.google.com',
  'news.ycombinator.com',
  'reddit.com'
];

// Shortcut-related functions (kept from original script)
async function updateUI() {
  let commands = await browser.commands.getAll();
  for (command of commands) {
    if (command.name === commandName) {
      document.querySelector('#shortcut').value = command.shortcut;
    }
  }
  
  // Load whitelisted domains
  const savedDomains = await browser.storage.sync.get('whitelistedDomains');
  document.querySelector('#whitelistDomains').value = 
    (savedDomains.whitelistedDomains || DEFAULT_DOMAINS).join('\n');

  // Load AlphaXiv toggle state
  const { alphaxivMode } = await browser.storage.sync.get('alphaxivMode');
  document.querySelector('#alphaxivToggle').checked = !!alphaxivMode;
}

async function updateShortcut() {
  await browser.commands.update({
    name: commandName,
    shortcut: document.querySelector('#shortcut').value
  });
}

async function resetShortcut() {
  await browser.commands.reset(commandName);
  updateUI();
}

// Whitelist-related functions
async function saveWhitelist() {
  const domainsInput = document.querySelector('#whitelistDomains').value;
  const domains = domainsInput.split('\n')
    .map(domain => domain.trim())
    .filter(domain => domain.length > 0);
  
  await browser.storage.sync.set({ whitelistedDomains: domains });
  
  // Show status message
  const status = document.querySelector('#status');
  status.textContent = 'Domains saved successfully!';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

async function resetWhitelist() {
  await browser.storage.sync.set({ whitelistedDomains: DEFAULT_DOMAINS });
  updateUI();
  
  // Show status message
  const status = document.querySelector('#status');
  status.textContent = 'Domains reset to default!';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

// AlphaXiv toggle handler
async function handleAlphaxivToggle() {
  const isAlphaxivMode = document.querySelector('#alphaxivToggle').checked;
  
  await browser.storage.sync.set({ 
    alphaxivMode: isAlphaxivMode 
  });
  
  // Show status message
  const status = document.querySelector('#status');
  status.textContent = isAlphaxivMode 
    ? 'AlphaXiv mode enabled!' 
    : 'AlphaXiv mode disabled!';
  setTimeout(() => { status.textContent = ''; }, 2000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', updateUI);
document.querySelector('#update').addEventListener('click', updateShortcut);
document.querySelector('#reset').addEventListener('click', resetShortcut);
document.querySelector('#saveWhitelist').addEventListener('click', saveWhitelist);
document.querySelector('#resetWhitelist').addEventListener('click', resetWhitelist);
document.querySelector('#alphaxivToggle').addEventListener('change', handleAlphaxivToggle);
