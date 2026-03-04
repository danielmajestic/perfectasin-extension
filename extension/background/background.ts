chrome.runtime.onInstalled.addListener(() => {
  // Set side panel to open on action click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error('Error setting panel behavior:', error);
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Handle background SERP tab for Price Intelligence
  if (msg.action === 'OPEN_SERP_FOR_PRICE') {
    const keyword = encodeURIComponent(msg.keyword || '');
    chrome.tabs.create(
      { url: `https://www.amazon.com/s?k=${keyword}`, active: false },
      (tab) => {
        if (!tab?.id) {
          sendResponse({ error: 'tab_failed' });
          return;
        }

        const tabId = tab.id;

        chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
          if (updatedTabId !== tabId || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(listener);

          chrome.tabs.sendMessage(
            tabId,
            { action: 'GET_SERP_PRICE_DATA', keyword: msg.keyword },
            (res) => {
              chrome.tabs.remove(tabId);
              if (chrome.runtime.lastError) {
                sendResponse({ error: 'content_script_error' });
                return;
              }
              sendResponse({ serpData: res || null });
            }
          );
        });
      }
    );
    return true; // Keep message channel open (async)
  }

  return true;
});

export {};
