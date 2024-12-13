document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return; // 0 = left
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let modified clicks behave normally

    const a = e.target.closest?.("a[href]");
    if (!a) return;

    const href = a.href;
    if (!href) return;

    const trimmedLink = href.trim();
    if (trimmedLink && (trimmedLink.endsWith('.torrent') || trimmedLink.startsWith('magnet:'))) {
      // Let the extension handle it
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: "ADD_TORRENT_LINK", link: trimmedLink });
    } else {
      // Not a valid torrent/magnet link, let the click proceed as normal
    }
  },
  true // capture phase to intercept before any page handlers
);
