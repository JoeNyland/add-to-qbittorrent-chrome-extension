document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveServerDetails();
  });

  loadServerDetails();
});

function saveServerDetails() {
  const serverUrl = document.getElementById('server-url').value;
  chrome.storage.sync.set({serverUrl});
}

function loadServerDetails() {
  chrome.storage.sync.get(['serverUrl'], (items) => {
    document.getElementById('server-url').value = items.serverUrl || '';
  });
}
