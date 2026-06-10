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

    // Grouped parents: normal add and paused add
    chrome.contextMenus.create({
      id: "addNormal",
      parentId: "addTorrent",
      title: "Add",
      contexts: ["link", "selection"],
      targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
    });

    chrome.contextMenus.create({
      id: "addPaused",
      parentId: "addTorrent",
      title: "Add ⏸",
      contexts: ["link", "selection"],
      targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
    });

    // Add 'no category' child for both groups
    chrome.contextMenus.create({
      id: "add:__none",
      parentId: "addNormal",
      title: "Add",
      contexts: ["link", "selection"],
      targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
    });

    chrome.contextMenus.create({
      id: "add_paused:__none",
      parentId: "addPaused",
      title: "Add",
      contexts: ["link", "selection"],
      targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
    });

    // Load categories and create submenu items under both groups
    chrome.storage.sync.get(['categories'], (items) => {
      const cats = Array.isArray(items.categories) ? items.categories : [];
      cats.forEach((c) => {
        const encoded = encodeURIComponent(c);
        // Normal add for category
        chrome.contextMenus.create({
          id: `add:category:${encoded}`,
          parentId: "addNormal",
          title: c,
          contexts: ["link", "selection"],
          targetUrlPatterns: ["*://*/*.torrent", "magnet:*"],
        });

        // Paused variant for category
        chrome.contextMenus.create({
          id: `add_paused:category:${encoded}`,
          parentId: "addPaused",
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

  // Determine which group was clicked (normal or paused) and the category
  let menuId = info.menuItemId || '';
  let paused = false;
  // menu ids are like: 'add:__none', 'add:category:<enc>', 'add_paused:__none', 'add_paused:category:<enc>'
  if (menuId.startsWith('add_paused:')) {
    paused = true;
    menuId = menuId.slice('add_paused:'.length);
  } else if (menuId.startsWith('add:')) {
    menuId = menuId.slice('add:'.length);
  }

  if (menuId === '__none') {
    addTorrentToQbittorrent(trimmedLink, undefined, paused);
    return;
  }

  if (menuId.startsWith('category:')) {
    const encoded = menuId.slice('category:'.length);
    const category = decodeURIComponent(encoded);
    addTorrentToQbittorrent(trimmedLink, category, paused);
    return;
  }
  // Fallback: if top-level item clicked, add without category
  if (info.menuItemId === 'addTorrent') {
    addTorrentToQbittorrent(trimmedLink, undefined, paused);
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

function addTorrentToQbittorrent(link, category, paused = false) {
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
    if (paused) {
      body += `&stopped=true`;
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
