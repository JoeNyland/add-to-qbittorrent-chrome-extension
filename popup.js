// Check for .torrent or magnet: links in the clipboard and add them to qBittorrent when the button is clicked
document.addEventListener('DOMContentLoaded', () => {
  const clipboardAddButton = document.querySelector('#clipboard-add-link button[type="submit"]');
  clipboardAddButton.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.readText()
      .then(text => {
        const trimmedText = text.trim();
        if (trimmedText && (trimmedText.endsWith('.torrent') || trimmedText.startsWith('magnet:'))) {
          chrome.runtime.sendMessage({ type: "ADD_TORRENT_LINK", link: trimmedText, fromClipboard: true });
        } else {
          chrome.notifications.create("", {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Invalid Clipboard Content',
            silent: true,
            message: 'The clipboard does not contain a valid .torrent link or magnet URI.',
          });
        }
      });
    });
});
