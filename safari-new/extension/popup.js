document.addEventListener('DOMContentLoaded', async () => {
  const setupView = document.getElementById('setup-view');
  const mainView = document.getElementById('main-view');
  const urlInput = document.getElementById('dashboard-url');
  const pwdInput = document.getElementById('dashboard-password');
  const statusMsg = document.getElementById('status-msg');
  const titleDisplay = document.getElementById('tab-title');

  // Check storage for config
  const data = await chrome.storage.local.get(['dashboardUrl', 'dashboardPassword']);

  if (!data.dashboardUrl || !data.dashboardPassword) {
    showSetup();
  } else {
    showMain(data.dashboardUrl, data.dashboardPassword);
  }

  // --- Setup Handlers ---
  document.getElementById('save-config').addEventListener('click', () => {
    let url = urlInput.value.trim();
    const pwd = pwdInput.value.trim();

    // Ensure no trailing slash for consistency
    if (url.endsWith('/')) url = url.slice(0, -1);

    if (url && pwd) {
      chrome.storage.local.set({ dashboardUrl: url, dashboardPassword: pwd }, () => {
        showMain(url, pwd);
      });
    }
  });

  document.getElementById('edit-config').addEventListener('click', () => {
    showSetup();
  });

  // --- Save Handler ---
  document.getElementById('save-bookmark').addEventListener('click', async () => {
    const { dashboardUrl, dashboardPassword } = await chrome.storage.local.get(['dashboardUrl', 'dashboardPassword']);
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) return;

    setStatus('Saving...', 'neutral');

    const payload = {
      title: tab.title,
      url: tab.url,
      favicon: tab.favIconUrl || ''
    };

    try {
      const apiUrl = `${dashboardUrl}/api/bookmarks`;
      console.log("Sending to:", apiUrl);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-site-password': dashboardPassword
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatus('Saved!', 'success');
        setTimeout(() => window.close(), 1000);
      } else {
        const err = await res.json();
        setStatus(`Error: ${res.status} ${err.error || ''}`, 'error');
      }
    } catch (e) {
      setStatus('Network Error. Check URL.', 'error');
    }
  });

  function showSetup() {
    setupView.classList.remove('hidden');
    mainView.classList.add('hidden');
    // Pre-fill if exists
    chrome.storage.local.get(['dashboardUrl', 'dashboardPassword'], (items) => {
        if(items.dashboardUrl) urlInput.value = items.dashboardUrl;
        if(items.dashboardPassword) pwdInput.value = items.dashboardPassword;
    });
  }

  async function showMain(url, pwd) {
    setupView.classList.add('hidden');
    mainView.classList.remove('hidden');
    
    // Show current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        titleDisplay.textContent = tab.title;
    }
  }

  function setStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = 'status ' + type;
  }
});