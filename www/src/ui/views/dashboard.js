import { h, icon } from '../dom.js';
import { t } from '../../core/i18n.js';
import * as store from '../../core/store.js';
import { reelCard, emptyState, reelTile, pickCategorySheet, reelDetailSheet } from '../components.js';
import { quickAddForm } from './add.js';

/** A stable "revisit" pick: same reel all day, changes tomorrow. */
function revisitPick(reels) {
  if (reels.length < 2) return null;
  const day = Math.floor(Date.now() / 86400000);
  const older = reels.filter((r) => Date.now() - r.addedAt > 7 * 86400000);
  const pool = older.length ? older : reels;
  const seed = (day * 2654435761) % pool.length;
  return pool[seed];
}

export function renderDashboard() {
  const { reels, categories } = store.state;
  const queue = store.reviewQueue();
  const recent = [...reels].sort((a, b) => b.addedAt - a.addedAt).slice(0, 4);
  const revisit = revisitPick(reels);
  const root = h('div', { class: 'view view-dashboard', 'data-testid': 'view-dashboard' });

  root.append(
    h('header', { class: 'view-head' }, h('div', null, h('p', { class: 'eyebrow' }, t('appName')), h('h1', { class: 'view-title' }, t('dashTitle')))),
    h('section', { class: 'panel quick-add' }, quickAddForm()),
  );

  root.append(
    h(
      'div',
      { class: 'stats', 'data-testid': 'stats' },
      stat(reels.length, t('statReels'), '#/library'),
      stat(categories.length, t('statCategories'), '#/categories'),
      stat(queue.length, t('statReview'), '#/library?cat=review', queue.length > 0),
    ),
  );

  if (!categories.length) {
    root.append(
      h(
        'section',
        { class: 'panel callout', 'data-testid': 'setup-callout' },
        h('div', { class: 'callout-icon' }, icon('tag', 22)),
        h('div', null, h('h2', { class: 'section-title' }, t('setupTitle')), h('p', { class: 'muted' }, t('setupText'))),
        h('a', { class: 'btn btn-primary', href: '#/categories', 'data-testid': 'setup-categories' }, t('setupAction')),
      ),
    );
  }

  if (queue.length) {
    root.append(
      h(
        'section',
        { class: 'section', 'data-testid': 'review-section' },
        h(
          'div',
          { class: 'section-head' },
          h('h2', { class: 'section-title' }, t('reviewTitle'), h('span', { class: 'count' }, queue.length)),
          h('a', { class: 'link', href: '#/library?cat=review', 'data-testid': 'review-all' }, t('seeAll')),
        ),
        h('p', { class: 'hint' }, t('reviewHint')),
        h(
          'div',
          { class: 'review-strip' },
          queue.slice(0, 10).map((r) =>
            h(
              'button',
              { class: 'review-item', type: 'button', 'data-testid': 'review-item', onclick: () => pickCategorySheet(r.id) },
              reelTile(r, null),
              h('span', { class: 'review-label' }, r.username ? '@' + r.username : r.caption ? r.caption.slice(0, 24) : r.shortcode),
            ),
          ),
        ),
      ),
    );
  }

  if (revisit) {
    root.append(
      h(
        'section',
        { class: 'section', 'data-testid': 'revisit-section' },
        h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, icon('sparkles', 18), t('revisitTitle'))),
        h(
          'button',
          { class: 'revisit-card', type: 'button', 'data-testid': 'revisit-card', onclick: () => store.state.reels.find((r) => r.id === revisit.id) && reelDetailSheet(revisit.id) },
          reelTile(revisit, store.categoryById(revisit.categoryId)),
          h(
            'div',
            { class: 'revisit-main' },
            h('span', { class: 'creator' }, revisit.username ? '@' + revisit.username : t('unknownCreator')),
            h('span', { class: 'revisit-text' }, revisit.caption || revisit.title || revisit.notes || t('noCaption')),
          ),
          icon('chevron', 18),
        ),
      ),
    );
  }

  const recentSec = h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, t('recentTitle')), reels.length ? h('a', { class: 'link', href: '#/library' }, t('seeAll')) : null));
  if (!reels.length) {
    recentSec.append(
      emptyState({
        iconName: 'inbox',
        title: t('emptyDashTitle'),
        text: t('emptyDashText'),
        action: h('a', { class: 'btn btn-secondary', href: '#/add', 'data-testid': 'empty-add' }, icon('plus', 18), t('addReel')),
      }),
    );
  } else {
    recentSec.append(h('div', { class: 'reel-grid', 'data-testid': 'recent-list' }, recent.map(reelCard)));
  }
  root.append(recentSec);
  return root;
}

function stat(n, label, href, warn = false) {
  return h('a', { class: `stat${warn ? ' warn' : ''}`, href }, h('span', { class: 'stat-n' }, String(n)), h('span', { class: 'stat-l' }, label));
}
