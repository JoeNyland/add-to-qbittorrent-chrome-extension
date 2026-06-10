# Add to qBittorrent Chrome Extension

A Chrome extension that allows you to add torrents from .torrent file links and magnet: links directly to your qBittorrent client.

## Installation

This extension is not published on the Chrome Web Store, so you will need to load it as an unpacked extension in developer mode:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you cloned/downloaded this repository.

## Configuring qBittorrent Server Details

1. Open the extension options by clicking _Details_ > _Extension options_ for the _Add to qBittorrent_ extension in the [Chrome extensions page](chrome://extensions/).
2. Enter your qBittorrent server URL and click "Save". For example: `http://qbittorrent.example.com:8080`.

## Usage

1. Click on a .torrent file link or magnet link to add it to qBittorrent.
1. Right-click on a .torrent file link or magnet link and select "Add to qBittorrent" from the context menu. You can also choose to add the torrent in a paused state by selecting "Add ⏸".
1. Categories defined in the extension options will be available in the context menu when right-clicking on a torrent link, allowing you to add the torrent to a specific category in qBittorrent.

## Browser Notifications

When a torrent link is successfully added to qBittorrent, you will receive a browser notification indicating the successful addition. If adding the torrent link fails, you will receive a browser notification indicating the failure.
