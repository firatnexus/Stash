import { h, icon, confirmSheet, sheet, toast } from '../dom.js';
import { t } from '../../core/i18n.js';
import * as store from '../../core/store.js';
import { reelCard, emptyState, catColor } from '../components.js';

/** Library state lives in the URL hash: #/library?q=..&cat=..&tag=..&sort=..&view=.. */
export function readLibraryParams(query) {
  const p = new URLSearchParams(query || '');
  return { q: p.get('q') || '', cat: p.get('cat') || null, tag: p.get('tag') || null, sort: p.get('sort') === 'old' ? 'old' : 'new', view: p.get('view') === 'list' ? 'list' : 'grid' };
}

function writeParams(f) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cat) p.set('cat', f.cat);
  if (f.tag) p.set('tag', f.tag);
  if (f.sort === 'old') p.set('sort', 'old');
  if (f.view === 'list') p.set('view', 'list');
  const qs = p.toString();
  history.replaceState(null, '', '#/library' + (qs ? '?' + qs : ''));
}

export function renderLibrary(query) {
  const f = readLibraryParams(query);
  if (f.cat && !['none', 'review'].includes(f.cat) && !store.categoryById(f.cat)) f.cat = null;
  const root = h('div', { class: 'view view-library', 'data-testid': 'view-library' });

  const search = h('input', { class: 'input', type: 'search', placeholder: t('searchPlaceholder'), value: f.q, 'aria-label': t('search'), 'data-testid': 'search-input', enterkeyhint: 'search' });
  const sort = h(
    'select',
    { class: 'input input-sm', 'aria-label': t('sort'), 'data-testid': 'sort-select' },
    h('option', { value: 'new', selected: f.sort === 'new' }, t('sortNewest')),
    h('option', { value: 'old', selected: f.sort === 'old' }, t('sortOldest')),
  );
  const viewBtn = h(
    'button',
    {
      class: 'icon-btn',
      type: 'button',
      'aria-label': f.view === 'grid' ? t('viewList') : t('viewGrid'),
      title: f.view === 'grid' ? t('viewList') : t('viewGrid'),
      'data-testid': 'layout-toggle',
      onclick: () => {
        f.view = f.view === 'grid' ? 'list' : 'grid';
        writeParams(f);
        viewBtn.setAttribute('aria-label', f.view === 'grid' ? t('viewList') : t('viewGrid'));
        viewBtn.title = f.view === 'grid' ? t('viewList') : t('viewGrid');
        viewBtn.replaceChildren(icon(f.view === 'grid' ? 'rows' : 'grid', 18));
        draw();
      },
    },
    icon(f.view === 'grid' ? 'rows' : 'grid', 18),
  );
  const selectBtn = h(
    'button',
    {
      class: 'btn btn-secondary btn-sm',
      type: 'button',
      'data-testid': 'select-mode',
      onclick: () => {
        selecting = !selecting;
        selected.clear();
        syncSelectBtn();
        draw();
      },
    },
    icon('check', 16),
    t('select'),
  );

  const chips = h('div', { class: 'filter-chips', role: 'group', 'aria-label': t('filterByCategory'), 'data-testid': 'filter-chips' });
  const countEl = h('p', { class: 'result-count', 'aria-live': 'polite', 'data-testid': 'result-count' });
  const list = h('div', { class: 'reel-grid', 'data-testid': 'library-list' });

  const counts = store.countsByCategory();
  const reviewN = store.reviewQueue().length;
  const chipDefs = [
    { id: null, label: t('all'), n: store.state.reels.length },
    ...store.state.categories.map((c) => ({ id: c.id, label: c.name, n: counts.get(c.id) || 0, color: catColor(c) })),
    { id: 'review', label: t('needsCategory'), n: reviewN, warn: true },
  ];

  // Tag filter chips (most used first)
  const tagFreq = new Map();
  for (const r of store.state.reels) for (const tg of r.tags || []) tagFreq.set(tg, (tagFreq.get(tg) || 0) + 1);
  const tagDefs = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([name, n]) => ({ name, n }));
  const tagChips = h('div', { class: 'filter-chips tag-chips', role: 'group', 'aria-label': t('filterByTag'), 'data-testid': 'tag-chips' });
  const drawTagChips = () => {
    tagChips.replaceChildren(
      ...tagDefs.map((d) =>
        h(
          'button',
          {
            type: 'button',
            class: `chip chip-filter${f.tag === d.name ? ' is-active' : ''}`,
            'aria-pressed': String(f.tag === d.name),
            'data-testid': 'tag-chip',
            'data-name': d.name,
            onclick: () => {
              f.tag = f.tag === d.name ? null : d.name;
              writeParams(f);
              drawTagChips();
              draw();
            },
          },
          h('span', { class: 'chip-n', style: 'background:var(--surface-3)' }, '#'),
          d.label,
          h('span', { class: 'chip-n' }, String(d.n)),
        ),
      ),
    );
  };

  /* ------------------------- Multi-select state ----------------------- */
  let selecting = false;
  const selected = new Set();
  const selectBar = h('div', { class: 'select-bar', 'data-testid': 'select-bar', hidden: true });
  const syncSelectBar = () => {
    selectBar.hidden = !selecting;
    selectBar.querySelector('.select-count').textContent = t('selectedCount', { n: selected.size });
    for (const b of selectBar.querySelectorAll('[data-testid]')) b.disabled = selected.size === 0 && b.dataset.testid !== 'select-cancel';
  };
  const syncSelectBtn = () => {
    selectBtn.classList.toggle('btn-primary', selecting);
    selectBtn.classList.toggle('btn-secondary', !selecting);
    selectBtn.setAttribute('aria-pressed', String(selecting));
  };

  selectBar.append(
    h('span', { class: 'select-count' }),
    h(
      'button',
      {
        class: 'btn btn-secondary btn-sm',
        type: 'button',
        'data-testid': 'select-categorize',
        onclick: () => bulkCategorizeSheet([...selected]),
      },
      icon('tag', 16),
      t('categorize'),
    ),
    h(
      'button',
      {
        class: 'btn btn-ghost btn-sm btn-danger-text',
        type: 'button',
        'data-testid': 'select-delete',
        onclick: async () => {
          const ids = [...selected];
          const ok = await confirmSheet({
            title: t('deleteSelectedQ', { n: ids.length }),
            message: t('deleteSelectedMsg', { n: ids.length }),
            confirm: t('delete'),
            cancel: t('cancel'),
            danger: true,
          });
          if (!ok) return;
          await store.bulkDelete(ids);
          selected.clear();
          selecting = false;
          syncSelectBtn();
          draw();
          toast(t('deletedMany', { n: ids.length }), { tone: 'success' });
        },
      },
      icon('trash', 16),
      t('delete'),
    ),
    h(
      'button',
      {
        class: 'btn btn-ghost btn-sm',
        type: 'button',
        'data-testid': 'select-cancel',
        onclick: () => {
          selecting = false;
          selected.clear();
          syncSelectBtn();
          draw();
        },
      },
      t('cancel'),
    ),
  );

  const drawChips = () => {
    chips.replaceChildren(
      ...chipDefs.map((d) =>
        h(
          'button',
          {
            type: 'button',
            class: `chip chip-filter${d.warn ? ' chip-filter-warn' : ''}`,
            'data-color': d.color || null,
            'aria-pressed': String(f.cat === d.id),
            'data-testid': 'filter-chip',
            'data-id': d.id || 'all',
            onclick: () => {
              f.cat = d.id;
              writeParams(f);
              drawChips();
              draw();
            },
          },
          d.color ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : null,
          d.label,
          h('span', { class: 'chip-n' }, String(d.n)),
        ),
      ),
    );
  };

  const draw = () => {
    const items = store.queryReels(f);
    countEl.textContent = t('resultCount', { n: items.length });
    list.replaceChildren();
    list.classList.toggle('reel-grid-list', f.view === 'list');
    if (!store.state.reels.length) {
      list.append(emptyState({ iconName: 'inbox', title: t('emptyLibTitle'), text: t('emptyLibText'), action: h('a', { class: 'btn btn-primary', href: '#/add' }, icon('plus', 18), t('addReel')) }));
      return;
    }
    if (!items.length) {
      list.append(
        emptyState({
          iconName: 'search',
          title: t('noResultsTitle'),
          text: f.q ? t('noResultsText', { q: f.q }) : t('noResultsCat'),
          action: h('button', { class: 'btn btn-secondary', type: 'button', 'data-testid': 'clear-filters', onclick: () => { f.q = ''; f.cat = null; f.tag = null; search.value = ''; writeParams(f); drawChips(); drawTagChips(); draw(); } }, t('clearFilters')),
        }),
      );
      return;
    }
    // Render in chunks for large libraries
    const CHUNK = 60;
    let i = 0;
    const more = () => {
      list.append(...items.slice(i, i + CHUNK).map((r) => reelCard(r, { selectable: selecting, selected: selected.has(r.id), onToggle: toggleSelect })));
      i += CHUNK;
      if (i < items.length) {
        const sentinel = h('div', { class: 'sentinel' });
        list.append(sentinel);
        const io = new IntersectionObserver((e) => {
          if (e[0].isIntersecting) {
            io.disconnect();
            sentinel.remove();
            more();
          }
        });
        io.observe(sentinel);
      }
    };
    more();
    syncSelectBar();
  };

  function toggleSelect(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    draw();
  }

  let deb;
  search.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => {
      f.q = search.value.trim();
      writeParams(f);
      draw();
    }, 150);
  });
  sort.addEventListener('change', () => {
    f.sort = sort.value;
    writeParams(f);
    draw();
  });

  root.append(
    h('header', { class: 'view-head' }, h('h1', { class: 'view-title' }, t('libraryTitle'))),
    h('div', { class: 'toolbar' }, h('div', { class: 'input-wrap grow' }, icon('search', 18), search), sort, viewBtn, selectBtn),
    chips,
    tagChips,
    countEl,
    list,
    selectBar,
  );
  drawChips();
  drawTagChips();
  syncSelectBtn();
  draw();
  return root;
}

/** Choose one category for many reels at once. */
function bulkCategorizeSheet(ids) {
  const s = sheet({
    title: t('categorizeSelected', { n: ids.length }),
    testid: 'bulk-category-sheet',
    content: (body, s) => {
      if (!store.state.categories.length) {
        body.append(
          h('p', { class: 'muted' }, t('noCategoriesYet')),
          h('div', { class: 'sheet-actions' }, h('a', { class: 'btn btn-primary', href: '#/categories', onclick: () => s.close() }, t('createCategory'))),
        );
        return;
      }
      body.append(
        h(
          'div',
          { class: 'pick-list' },
          store.state.categories.map((c) =>
            h(
              'button',
              {
                class: 'pick-row',
                type: 'button',
                'data-testid': 'bulk-category',
                'data-name': c.name,
                onclick: async () => {
                  await store.bulkAssign(ids, c.id);
                  s.close();
                  toast(t('filedMany', { n: ids.length, name: c.name }), { tone: 'success' });
                },
              },
              h('span', { class: 'swatch', 'data-color': catColor(c) }),
              h('span', { class: 'pick-name' }, c.name),
              icon('chevron', 16),
            ),
          ),
        ),
        h('div', { class: 'sheet-actions reject-row' },
          h('button', {
            class: 'btn btn-ghost btn-danger-text', type: 'button',
            onclick: async () => {
              await store.bulkAssign(ids, null);
              s.close();
              toast(t('categoryClearedMany', { n: ids.length }));
            },
          }, t('clearCategory')),
        ),
      );
    },
  });
}
