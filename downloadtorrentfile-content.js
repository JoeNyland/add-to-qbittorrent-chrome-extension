// Content script for downloadtorrentfile.com
// Injects a "Send to qBittorrent" link, so that users can easily send torrent links to qBittorrent without using the clipboard.

// Inject script to create the link in the page context where it has access to the global `link` variable
const script = document.createElement('script');
script.textContent = `
  function injectSendLink() {
    const copyButton = document.querySelector('.btn-primary');
    if (!copyButton || typeof link === 'undefined') {
      setTimeout(injectSendLink, 100);
      return;
    }

    let sendLink = document.querySelector('[data-qb-send-link]');
    if (!sendLink) {
      sendLink = document.createElement('a');
      sendLink.className = 'btn btn-primary btn-action';
      sendLink.innerHTML = '<i class="fas fa-magnet me-1"></i> Send to qBittorrent';
      sendLink.setAttribute('data-qb-send-link', 'true');
      copyButton.parentNode.insertBefore(sendLink, copyButton.nextSibling);
    }

    // Update the href whenever link changes
    sendLink.href = link;

    // Watch for changes to the global link variable
    const originalLink = link;
    setInterval(() => {
      if (typeof link !== 'undefined' && sendLink.href !== link) {
        sendLink.href = link;
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSendLink);
  } else {
    injectSendLink();
  }
`;
document.documentElement.appendChild(script);
