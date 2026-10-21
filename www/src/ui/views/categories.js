import { h, icon, toast, sheet } from '../dom.js';
import { t, lang } from '../../core/i18n.js';
import * as store from '../../core/store.js';
import { categoryEditorSheet, emptyState, catColor } from '../components.js';
import { STARTERS } from '../../categorize/starters.js';
import { fold } from '../../categorize/normalize.js';

export function renderCategories() {
  const { categories } = store.state;
  const counts = store.countsByCategory();
  const root = h('div', { class: 'view view-categories', 'data-testid': 'view-categories' });
  root.append(
    h(
      'header',
      { class: 'view-head' },
      h('h1', { class: 'view-title' }, t('categoriesTitle')),
      h('button', { class: 'btn btn-primary', type: 'button', 'data-testid': 'new-category', onclick: () => categoryEditorSheet() }, icon('plus', 18), t('newCategory')),
    ),
    h('p', { class: 'muted intro' }, t('categoriesIntro')),
  );

  if (!categories.length) {
    root.append(
      emptyState({
        iconName: 'tag',
        title: t('emptyCatTitle'),
        text: t('emptyCatText'),
        action: h('div', { class: 'row center' }, h('button', { class: 'btn btn-primary', type: 'button', 'data-testid': 'starter-open', onclick: startersSheet }, icon('sparkles', 18), t('useStarters')), h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => categoryEditorSheet() }, t('createOwn'))),
      }),
    );
    return root;
  }

  root.append(
    h(
      'ul',
      { class: 'cat-list', 'data-testid': 'category-list' },
      categories.map((c) =>
        h(
          'li',
          null,
          h(
            'div',
            { class: 'cat-row', 'data-testid': 'category-row', 'data-name': c.name },
            h('a', { class: 'cat-main', href: '#/library?cat=' + encodeURIComponent(c.id), 'aria-label': t('showReelsIn', { name: c.name }) },
              h('span', { class: 'swatch lg', 'data-color': catColor(c) }, icon('tag', 16)),
              h('span', { class: 'cat-text' }, h('span', { class: 'cat-name' }, c.name), h('span', { class: 'cat-sub' }, t('nReels', { n: counts.get(c.id) || 0 }) + ' · ' + t('nKeywords', { n: c.keywords.length }))),
            ),
            h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('editNamed', { name: c.name }), 'data-testid': 'category-edit', onclick: () => categoryEditorSheet(c.id) }, icon('edit', 18)),
          ),
        ),
      ),
    ),
  );

  const unsorted = store.reviewQueue().length;
  root.append(
    h(
      'section',
      { class: 'panel tools' },
      h('h2', { class: 'section-title' }, icon('wand', 18), t('autoTitle')),
      h('p', { class: 'muted' }, t('autoText')),
      h(
        'div',
        { class: 'row wrap' },
        h(
          'button',
          {
            class: 'btn btn-secondary',
            type: 'button',
            disabled: !unsorted,
            'data-testid': 'recheck',
            onclick: async (e) => {
              const b = e.currentTarget;
              b.disabled = true;
              b.classList.add('loading');
              const r = await store.recheckUnsorted();
              b.classList.remove('loading');
              if (r.aiError) toast(t('aiFailed', { msg: r.aiError }), { tone: 'warn', duration: 5000 });
              toast(t('recheckDone', { n: r.assigned }), { tone: r.assigned ? 'success' : 'neutral' });
            },
          },
          icon('sparkles', 18),
          t('recheck', { n: unsorted }),
        ),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: startersSheet, 'data-testid': 'starter-open' }, t('addStarters')),
      ),
    ),
  );
  return root;
}

function startersSheet() {
  const existing = new Set(store.state.categories.map((c) => fold(c.name)));
  const l = lang().startsWith('tr') ? 'tr' : 'en';
  const s = sheet({
    title: t('startersTitle'),
    testid: 'starters-sheet',
    content: (body, s) => {
      const boxes = [];
      body.append(h('p', { class: 'hint' }, t('startersHelp')));
      const list = h('div', { class: 'pick-list' });
      for (const st of STARTERS) {
        const name = st.name[l];
        const has = existing.has(fold(name));
        const cb = h('input', { type: 'checkbox', checked: !has, disabled: has, value: st.key, 'data-testid': 'starter-check' });
        boxes.push(cb);
        list.append(h('label', { class: 'pick-row check-row' }, cb, h('span', { class: 'swatch', 'data-color': st.color }), h('span', { class: 'pick-name' }, name), h('span', { class: 'hint' }, has ? t('alreadyExists') : t('nKeywords', { n: st.keywords.length }))));
      }
      body.append(
        list,
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => s.close() }, t('cancel')),
          h(
            'button',
            {
              class: 'btn btn-primary',
              type: 'button',
              'data-testid': 'starter-add',
              onclick: async () => {
                const keys = boxes.filter((b) => b.checked && !b.disabled).map((b) => b.value);
                const created = await store.addStarters(keys, l);
                s.close();
                toast(t('startersAdded', { n: created.length }), { tone: 'success' });
              },
            },
            t('addSelected'),
          ),
        ),
      );
    },
  });
}
