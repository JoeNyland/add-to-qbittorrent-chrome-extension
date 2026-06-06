# Add to qBittorrent Chrome Extension

A Chrome extension that allows you to add torrents from .torrent file links and magnet: links directly to your qBittorrent client.

## Installation

This extension is not published on the Chrome Web Store, so you will need to load it as an unpacked extension in developer mode:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the directory where you cloned/downloaded this repository.

## Configuring qBittorrent Server Details

1. Open the extension options by clicking _Details_ > _Extension options+ for the _Add to qBittorrent_ extension in the [Chrome extensions page](chrome://extensions/).
2. Enter your qBittorrent server URL and click "Save". For example: `http://qbittorrent.example.com:8080`.

## Usage

1. Right-click on a .torrent file link or magnet link and select "Add to qBittorrent" from the context menu.

## Browser Notifications

When a torrent link is successfully added to qBittorrent, you will receive a browser notification indicating the successful addition. If adding the torrent link fails, you will receive a browser notification indicating the failure.
