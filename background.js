function buildCategoryMenuId(cat) {
  return `category:${encodeURIComponent(cat)}`;
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "addTorrent",
      title: "Add to qBittorrent",
      contexts: ["link", "selection"],
      targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
    });

    // Load categories and create submenu items
    chrome.storage.sync.get(['categories'], (items) => {
      const cats = Array.isArray(items.categories) ? items.categories : [];
      cats.forEach((c) => {
        chrome.contextMenus.create({
          id: buildCategoryMenuId(c),
          parentId: "addTorrent",
          title: c,
          contexts: ["link", "selection"],
          targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
        });
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.categories) {
    createContextMenus();
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  const link = info.linkUrl || info.selectionText;
  const trimmedLink = (link || '').trim();
  if (!trimmedLink || !(trimmedLink.endsWith('.torrent') || trimmedLink.startsWith('magnet:'))) {
    chrome.notifications.create("", {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Invalid Link',
      silent: true,
      message: 'The selected link is not a valid .torrent link or magnet URI.',
    });
    return;
  }

  if (info.menuItemId && info.menuItemId.startsWith('category:')) {
    if (info.menuItemId === 'category:__none') {
      addTorrentToQbittorrent(trimmedLink);
      return;
    }
    const encoded = info.menuItemId.slice('category:'.length);
    const category = decodeURIComponent(encoded);
    addTorrentToQbittorrent(trimmedLink, category);
    return;
  }
  // Fallback: if top-level item clicked, add without category
  if (info.menuItemId === 'addTorrent') {
    addTorrentToQbittorrent(trimmedLink);
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

function addTorrentToQbittorrent(link, category) {
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
    let body = `urls=${encodeURIComponent(link)}`;
    if (category) {
      body += `&category=${encodeURIComponent(category)}`;
    }

    return fetch(`${serverUrl}/api/v2/torrents/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
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
