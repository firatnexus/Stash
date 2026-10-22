/**
 * App bootstrap: routing, shell, share intake, Android back button.
 */
import * as store from './core/store.js';
import { t, setLang, onLangChange } from './core/i18n.js';
import { h, icon, toast, closeTopSheet, closeAllSheets, clear } from './ui/dom.js';
import { applyTheme } from './ui/theme.js';
import { takePendingShare, onShare, onBackButton, exitApp, markFirstFrame } from './core/platform.js';
import { renderDashboard } from './ui/views/dashboard.js';
import { renderLibrary } from './ui/views/library.js';
import { renderAdd, reportAddResult } from './ui/views/add.js';
import { renderCategories } from './ui/views/categories.js';
import { renderSettings } from './ui/views/settings.js';
import { skeletonCards } from './ui/components.js';

const ROUTES = {
  home: { render: renderDashboard, icon: 'home', label: 'navHome' },
  library: { render: renderLibrary, icon: 'grid', label: 'navLibrary' },
  add: { render: renderAdd, icon: 'plus', label: 'navAdd', primary: true },
  categories: { render: renderCategories, icon: 'tag', label: 'navCategories' },
  settings: { render: renderSettings, icon: 'settings', label: 'navSettings' },
};

const main = document.getElementById('view');
const nav = document.getElementById('nav');
let currentView = null;
let currentRoute = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const name = ROUTES[path] ? path : 'home';
  return { name, query };
}

function renderNav(active) {
  clear(nav);
  for (const [name, r] of Object.entries(ROUTES)) {
    nav.append(
      h(
        'a',
        { href: '#/' + name, class: `nav-item${r.primary ? ' nav-primary' : ''}`, 'aria-current': name === active ? 'page' : null, 'data-testid': 'nav-' + name },
        h('span', { class: 'nav-icon' }, icon(r.icon, r.primary ? 22 : 22)),
        h('span', { class: 'nav-label' }, t(r.label)),
      ),
    );
  }
}

function render({ keepScroll = false } = {}) {
  const { name, query } = parseHash();
  if (currentView && currentView._cleanup) currentView._cleanup();
  const y = window.scrollY;
  const view = store.state.ready ? ROUTES[name].render(query) : h('div', { class: 'view' }, skeletonCards(4));
  main.replaceChildren(view);
  currentView = view;
  const changed = currentRoute !== name;
  currentRoute = name;
  renderNav(name);
  document.title = `${t(ROUTES[name].label)} · Sakla`;
  if (changed) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  } else if (keepScroll) window.scrollTo(0, y);
}

let lastRoute = parseHash().name;
window.addEventListener('hashchange', () => {
  const { name } = parseHash();
  if (name !== lastRoute) closeAllSheets(); // leaving a screen dismisses its sheets
  lastRoute = name;
  render();
});

// Re-render on data changes, except while the user is typing in the Add form.
store.subscribe((why) => {
  if (why === 'settings') return;
  const { name } = parseHash();
  if (name === 'add' && why !== 'load') return;
  if (name === 'library' && document.activeElement && document.activeElement.dataset.testid === 'search-input') {
    // keep focus in the search field
    const pos = document.activeElement.selectionStart;
    render({ keepScroll: true });
    const s = document.querySelector('[data-testid="search-input"]');
    if (s) {
      s.focus();
      try {
        s.setSelectionRange(pos, pos);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  render({ keepScroll: true });
});

onLangChange(() => {
  document.documentElement.lang = document.documentElement.lang;
  render({ keepScroll: true });
});

/* ------------------------------ Sharing ---------------------------- */

let shareQueue = Promise.resolve();
function handleShare(payload) {
  shareQueue = shareQueue.then(async () => {
    closeAllSheets();
    if (location.hash !== '#/home' && location.hash !== '') location.hash = '#/home';
    const res = await store.addFromShare(payload);
    await reportAddResult(res, { fromShare: true });
    if (!res.added.length && !res.duplicates.length) {
      location.hash = '#/add';
      setTimeout(() => {
        const ta = document.querySelector('[data-testid="add-url"]');
        if (ta) {
          ta.value = [payload.url, payload.text].filter(Boolean).join('\n');
          ta.dispatchEvent(new Event('input'));
        }
      }, 50);
    }
  });
  return shareQueue;
}

/* ---------------------------- Back button -------------------------- */

onBackButton(() => {
  if (closeTopSheet()) return;
  const { name } = parseHash();
  if (name !== 'home') {
    location.hash = '#/home';
    return;
  }
  exitApp();
});

/* ------------------------------- Boot ------------------------------ */

async function boot() {
  render();
  try {
    await store.load();
  } catch (e) {
    main.replaceChildren(h('div', { class: 'view' }, h('div', { class: 'empty' }, h('div', { class: 'empty-art' }, icon('alert', 30)), h('h3', null, t('dbErrorTitle')), h('p', null, t('dbErrorText') + ' ' + (e.message || '')))));
    return;
  }
  setLang(store.state.settings.lang);
  applyTheme(store.state.settings.theme);
  render();
  document.body.classList.add('ready');
  markFirstFrame(); // native splash can hand off now

  onShare(handleShare);
  const pending = await takePendingShare();
  if (pending) await handleShare(pending);

  // expose for automated tests only
  globalThis.__reels = { store, handleShare, toast };
}

boot();
