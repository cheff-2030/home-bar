const EMOJI = {
  Stirred:   '🥃',
  Shaken:    '🍸',
  Mocktails: '🍹',
};

const DEFAULT_EMOJI = '🍹';

let allCocktails = [];
let activeCategory = 'All';

const tabsEl   = document.getElementById('tabs');
const gridEl   = document.getElementById('grid');
const backdrop = document.getElementById('modal-backdrop');
const modal    = document.getElementById('modal');

// ── Load data ──────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('cocktails.json');
    const data = await res.json();
    allCocktails = data.cocktails;
  } catch (e) {
    allCocktails = [];
  }
  buildTabs();
  renderGrid();
}

// ── Tabs ───────────────────────────────────────────────
function buildTabs() {
  const categories = ['All', ...new Set(allCocktails.map(c => c.category))];
  tabsEl.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    tabsEl.appendChild(btn);
  });
}

// ── Grid ───────────────────────────────────────────────
function renderGrid() {
  const filtered = activeCategory === 'All'
    ? allCocktails
    : allCocktails.filter(c => c.category === activeCategory);

  gridEl.innerHTML = '';

  if (filtered.length === 0) {
    gridEl.innerHTML = '<p class="empty">No cocktails in this category yet.</p>';
    return;
  }

  if (activeCategory === 'All') {
    // Group by category, preserving order of first appearance
    const categoryOrder = [...new Set(allCocktails.map(c => c.category))];
    categoryOrder.forEach(cat => {
      const group = filtered.filter(c => c.category === cat);
      if (group.length === 0) return;

      const divider = document.createElement('div');
      divider.className = 'section-divider';
      divider.textContent = cat;
      gridEl.appendChild(divider);

      group.forEach(cocktail => gridEl.appendChild(makeCard(cocktail)));
    });
  } else {
    filtered.forEach(cocktail => gridEl.appendChild(makeCard(cocktail)));
  }
}

function makeCard(cocktail) {
  const source = cocktail.source_bar
    ? `<div class="card-source">${esc(cocktail.source_bar)} &mdash; ${esc(cocktail.source_city)}</div>`
    : '';
  const menuIngredients = (cocktail.menu_ingredients || []).join(' &middot; ');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-img-wrap">
      ${imgOrPlaceholder(cocktail, 'card')}
    </div>
    <div class="card-body">
      <div class="card-name">${esc(cocktail.name)}</div>
      ${source}
      <div class="card-ingredients">${menuIngredients}</div>
    </div>
  `;
  card.addEventListener('click', () => openModal(cocktail));
  return card;
}

function imgOrPlaceholder(cocktail, size) {
  if (cocktail.photo) {
    const emoji = EMOJI[cocktail.category] || DEFAULT_EMOJI;
    return `
      <span class="placeholder">${emoji}</span>
      <img
        src="${esc(cocktail.photo)}"
        alt="${esc(cocktail.name)}"
        onerror="this.style.display='none'"
      >
    `;
  }
  const emoji = EMOJI[cocktail.category] || DEFAULT_EMOJI;
  return `<span class="placeholder">${emoji}</span>`;
}

// ── Modal ──────────────────────────────────────────────
function openModal(cocktail) {
  const emoji = EMOJI[cocktail.category] || DEFAULT_EMOJI;

  document.getElementById('modal-category').textContent    = cocktail.category;
  document.getElementById('modal-name').textContent        = cocktail.name;
  document.getElementById('modal-description').textContent = cocktail.description || '';

  const sourceEl = document.getElementById('modal-source');
  if (cocktail.source_bar) {
    sourceEl.textContent = `${cocktail.source_bar} — ${cocktail.source_city}`;
    sourceEl.style.display = '';
  } else {
    sourceEl.style.display = 'none';
  }

  const imgWrap = document.getElementById('modal-img-wrap');
  imgWrap.innerHTML = cocktail.photo
    ? `<span class="placeholder">${emoji}</span>
       <img src="${esc(cocktail.photo)}" alt="${esc(cocktail.name)}" onerror="this.style.display='none'">`
    : `<span class="placeholder">${emoji}</span>`;

  const list = document.getElementById('modal-ingredients');
  list.innerHTML = (cocktail.ingredients || [])
    .map(i => `<li>${esc(i)}</li>`)
    .join('');

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  // scroll modal back to top on each open
  modal.scrollTop = 0;
}

function closeModal() {
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

// close on backdrop click (outside the sheet)
backdrop.addEventListener('click', e => {
  if (e.target === backdrop) closeModal();
});

document.getElementById('modal-close').addEventListener('click', closeModal);

// close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Utility ────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

init();
