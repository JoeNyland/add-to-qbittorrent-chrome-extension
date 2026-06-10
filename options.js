let categories = [];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const addBtn = document.getElementById('add-category');
  const catInput = document.getElementById('default-category-input');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveServerDetails();
  });

  addBtn.addEventListener('click', () => {
    const val = (catInput.value || '').trim();
    if (!val) return;
    if (categories.includes(val)) {
      alert('Category already exists');
      return;
    }
    categories.push(val);
    catInput.value = '';
    renderCategories();
    saveServerDetails();
  });

  loadServerDetails();
});

function saveServerDetails() {
  const serverUrl = document.getElementById('server-url').value;
  chrome.storage.sync.set({serverUrl, categories});
}

function loadServerDetails() {
  chrome.storage.sync.get(['serverUrl', 'categories'], (items) => {
    document.getElementById('server-url').value = items.serverUrl || '';
    categories = Array.isArray(items.categories) ? items.categories : [];
    renderCategories();
  });
}

function renderCategories() {
  const list = document.getElementById('categories-list');
  list.innerHTML = '';
  categories.forEach((c, i) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '6px';

    const span = document.createElement('span');
    span.textContent = c;

    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.style.marginLeft = '8px';
    remove.addEventListener('click', () => {
      categories.splice(i, 1);
      renderCategories();
      saveServerDetails();
    });

    li.appendChild(span);
    li.appendChild(remove);
    list.appendChild(li);
  });
}
