chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addTorrent",
    title: "Add to qBittorrent",
    contexts: ["link", "selection"],
    targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "addTorrent") {
    const link = info.linkUrl || info.selectionText;
    const trimmedLink = link.trim();
    if (trimmedLink && (trimmedLink.endsWith('.torrent') || trimmedLink.startsWith('magnet:'))) {
      addTorrentToQbittorrent(trimmedLink);
    } else {
      chrome.notifications.create("", {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Invalid Link',
        silent: true,
        message: 'The selected link is not a valid .torrent link or magnet URI.',
      });
    }
  }
});

function extractNameFromLink(link) {
  try {
    if (link.startsWith('magnet:')) {
      const url = new URL(link);
      const nameParam = url.searchParams.get('dn');
      return nameParam ? decodeURIComponent(nameParam) : 'Unknown Torrent';
    } else {
      const url = new URL(link);
      const pathname = url.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return filename || 'Unknown Torrent';
    }
  } catch (e) {
    return 'Unknown Torrent';
  }
}

// Listen for messages from click interception in content.js
chrome.runtime.onMessage.addListener(({type, link}) => {
  if (type === "ADD_TORRENT_LINK" && link) {
    addTorrentToQbittorrent(link);
  }
});

function addTorrentToQbittorrent(link) {
  chrome.storage.sync.get(['serverUrl'], (items) => {
    const { serverUrl } = items;

    if (!serverUrl) {
      chrome.notifications.create("configRequiredError", {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Configuration Required',
        silent: true,
        message: 'qBittorrent server URL is not set. Please configure it in the extension options.',
      });
      return;
    }

    /**
     * Torrents are added with a form post. For example:
     *
     * urls=https://example.com/foo.torrent
     * category=foo
     */
    return fetch(`${serverUrl}/api/v2/torrents/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `urls=${encodeURIComponent(link)}`,
    })
    .then(() => {
      chrome.notifications.create("", {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Link Added',
        silent: true,
        message: `The torrent link "${extractNameFromLink(link)}" has been added to qBittorrent.`,
      }, (id) => {
        // Auto-clear after 5 seconds
        setTimeout(() => {
          chrome.notifications.clear(id);
        }, 5000);
      });
    })
    .catch(error => {
      chrome.notifications.create("", {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Error Adding Torrent',
        silent: true,
        message: `An error occurred while adding the torrent link "${extractNameFromLink(link)}" to qBittorrent: ${error.message}`,
      }, (id) => {
        // Auto-clear after 5 seconds
        setTimeout(() => {
          chrome.notifications.clear(id);
        }, 5000);
      });
    });
  });
}
