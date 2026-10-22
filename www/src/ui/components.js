/**
 * Reusable UI pieces: reel cards, category chips, empty states, sheets.
 */
import { h, icon, sheet, toast, confirmSheet, relativeDay, formatDate } from './dom.js';
import { t, lang } from '../core/i18n.js';
import * as store from '../core/store.js';
import { openExternal, copyText } from '../core/platform.js';
import { embedUrl, profileUrl } from '../instagram/url.js';
import { CATEGORY_COLORS } from '../categorize/starters.js';
import { cleanKeywords } from '../categorize/normalize.js';

export function catColor(cat) {
  return cat && CATEGORY_COLORS.includes(cat.color) ? cat.color : 'none';
}

export function categoryChip(cat, { onClick, testid } = {}) {
  const tag = onClick ? 'button' : 'span';
  return h(
    tag,
    { class: `chip chip-cat`, 'data-color': catColor(cat), type: onClick ? 'button' : null, onclick: onClick, 'data-testid': testid },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    cat ? cat.name : t('uncategorized'),
  );
}

function initials(reel) {
  const s = reel.username || reel.creatorName || '';
  return s ? s.replace(/^@/, '').slice(0, 1).toUpperCase() : '';
}

/** Thumbnail tile. Real thumbnails are shown only if one is stored. */
export function reelTile(reel, cat, size = 'sm') {
  const tile = h('div', { class: `tile tile-${size}`, 'data-color': catColor(cat), 'aria-hidden': 'true' });
  if (reel.thumbnailUrl) {
    const img = h('img', { src: reel.thumbnailUrl, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => img.remove());
    tile.append(img);
  }
  tile.append(h('span', { class: 'tile-kind' }, icon(reel.kind === 'post' ? 'grid' : 'play', size === 'lg' ? 28 : 18)));
  if (initials(reel)) tile.append(h('span', { class: 'tile-initial' }, initials(reel)));
  return tile;
}

function creatorLine(reel) {
  if (reel.username) return h('span', { class: 'creator', 'data-testid': 'reel-creator' }, '@' + reel.username);
  if (reel.creatorName) return h('span', { class: 'creator', 'data-testid': 'reel-creator' }, reel.creatorName);
  return h('span', { class: 'creator faint', 'data-testid': 'reel-creator' }, t('unknownCreator'));
}

function textLine(reel) {
  const txt = reel.caption || reel.title || reel.notes;
  if (txt) return h('p', { class: 'reel-text', 'data-testid': 'reel-text' }, txt);
  return h('p', { class: 'reel-text faint', 'data-testid': 'reel-text' }, t('noCaption'));
}

export function openButton(reel, { label = false } = {}) {
  return h(
    'button',
    {
      class: label ? 'btn btn-primary' : 'icon-btn icon-btn-accent',
      type: 'button',
      'aria-label': t('openInstagram'),
      title: t('openInstagram'),
      'data-testid': 'open-instagram',
      onclick: (e) => {
        e.stopPropagation();
        openExternal(reel.url);
      },
    },
    icon('external', 18),
    label ? h('span', null, t('openInstagram')) : null,
  );
}

/**
 * Reel card used in dashboard and library.
 * In select mode the card toggles selection instead of opening details.
 */
export function reelCard(reel, opts = {}) {
  const cat = store.categoryById(reel.categoryId);
  const needs = !reel.categoryId || reel.needsReview;
  const card = h(
    'article',
    {
      class: `reel-card${opts.selectable ? ' selectable' : ''}${opts.selected ? ' selected' : ''}`,
      tabindex: '0',
      role: 'button',
      'aria-label': t('reelDetails'),
      'aria-pressed': opts.selectable ? String(Boolean(opts.selected)) : null,
      'data-testid': 'reel-card',
      'data-key': reel.key,
      onclick: opts.selectable ? () => opts.onToggle(reel.id) : () => reelDetailSheet(reel.id),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (opts.selectable) opts.onToggle(reel.id);
          else reelDetailSheet(reel.id);
        }
      },
    },
    opts.selectable
      ? h(
          'span',
          { class: `reel-check${opts.selected ? ' on' : ''}`, 'aria-hidden': 'true' },
          opts.selected ? icon('check', 14) : null,
        )
      : null,
    reelTile(reel, cat),
    h(
      'div',
      { class: 'reel-main' },
      h('div', { class: 'reel-top' }, creatorLine(reel), h('time', { class: 'reel-date', datetime: new Date(reel.addedAt).toISOString(), 'data-testid': 'reel-date' }, relativeDay(reel.addedAt, lang(), t))),
      textLine(reel),
      h(
        'div',
        { class: 'reel-bottom' },
        needs
          ? h(
              'button',
              {
                class: 'chip chip-warn',
                type: 'button',
                'data-testid': 'needs-category',
                onclick: (e) => {
                  e.stopPropagation();
                  pickCategorySheet(reel.id);
                },
              },
              icon('alert', 14),
              t('chooseCategory'),
            )
          : categoryChip(cat, { testid: 'reel-category' }),
        openButton(reel),
      ),
    ),
  );
  return card;
}

export function emptyState({ iconName, title, text, action }) {
  return h(
    'div',
    { class: 'empty', 'data-testid': 'empty-state' },
    h('div', { class: 'empty-art' }, icon(iconName, 30)),
    h('h3', null, title),
    text ? h('p', null, text) : null,
    action || null,
  );
}

export function skeletonCards(n = 3) {
  return h(
    'div',
    { class: 'reel-grid', 'aria-busy': 'true', 'data-testid': 'skeleton' },
    Array.from({ length: n }, () =>
      h('div', { class: 'reel-card skeleton-card' }, h('div', { class: 'tile tile-sm skeleton' }), h('div', { class: 'reel-main' }, h('div', { class: 'skeleton sk-line w40' }), h('div', { class: 'skeleton sk-line' }), h('div', { class: 'skeleton sk-line w60' }))),
    ),
  );
}

/* --------------------------- Category picker ----------------------- */

/** Let the user apply AI tag suggestions by tapping them (selected = applied). */
function tagSuggestionRow(reel, selected, onToggle) {
  if (!(reel.tagSuggestions || []).length) return null;
  return h(
    'div',
    { class: 'field' },
    h('span', { class: 'label' }, icon('sparkles', 14), t('suggestedTags')),
    h('p', { class: 'hint' }, t('suggestedTagsHint')),
    h(
      'div',
      { class: 'chip-row', 'data-testid': 'tag-suggestions' },
      reel.tagSuggestions.map((tg) =>
        h(
          'button',
          {
            type: 'button',
            class: 'chip chip-cat',
            'aria-pressed': String(selected.has(tg)),
            'data-testid': 'tag-suggestion',
            onclick: () => onToggle(tg),
          },
          h('span', { class: 'dot', 'aria-hidden': 'true' }),
          tg,
        ),
      ),
    ),
  );
}

/**
 * Ask the user to choose a category for a reel. AI suggestions come first.
 * Tag suggestions are applied only if the user tapped them (never by default).
 * @returns {Promise<string|null|undefined>} chosen id; undefined if dismissed
 */
export function pickCategorySheet(reelId, { title } = {}) {
  return new Promise((resolve) => {
    const reel = store.state.reels.find((r) => r.id === reelId);
    if (!reel) return resolve(undefined);
    let chosen;
    const selectedTags = new Set();
    const s = sheet({
      title: title || t('chooseCategory'),
      testid: 'pick-category-sheet',
      onClose: () => resolve(chosen),
      content: (body, s) => {
        const sug = (reel.suggestions || []).map(store.categoryById).filter(Boolean);
        const others = store.state.categories.filter((c) => !sug.includes(c));
        const choose = async (id) => {
          chosen = id;
          await store.assignCategory(reel.id, id);
          if (selectedTags.size) await store.applyTags(reel.id, [...selectedTags]);
          const c = store.categoryById(id);
          toast(c ? t('filedUnder', { name: c.name }) : t('categoryCleared'));
          s.close();
        };
        const toggleTag = (tg) => {
          if (selectedTags.has(tg)) selectedTags.delete(tg);
          else selectedTags.add(tg);
          const row = s.el.querySelector('[data-testid="tag-suggestions"]');
          if (row) {
            for (const chip of row.children) chip.setAttribute('aria-pressed', String(selectedTags.has(chip.textContent)));
          }
        };
        body.append(h('div', { class: 'pick-reel' }, reelTile(reel, null), h('div', null, creatorLine(reel), textLine(reel))));
        if (!store.state.categories.length) {
          body.append(
            h('p', { class: 'muted' }, t('noCategoriesYet')),
            h('div', { class: 'sheet-actions' }, h('a', { class: 'btn btn-primary', href: '#/categories', onclick: () => s.close() }, t('createCategory'))),
          );
          return;
        }
        if (sug.length) {
          body.append(h('p', { class: 'label' }, t('suggested')));
          if (reel.reasons && reel.reasons.length) body.append(h('p', { class: 'hint' }, t('matchedOn', { words: reel.reasons.join(', ') })));
          body.append(h('div', { class: 'pick-list' }, sug.map((c) => pickRow(c, choose, true))));
        }
        // One-tap creation of the AI-suggested new category
        if (reel.newCategorySuggestion && !store.state.categories.some((c) => c.name.toLocaleLowerCase() === reel.newCategorySuggestion.toLocaleLowerCase())) {
          body.append(
            h(
              'button',
              {
                class: 'pick-row suggested new-cat',
                type: 'button',
                'data-testid': 'new-category-suggestion',
                onclick: async (e) => {
                  const b = e.currentTarget;
                  b.disabled = true;
                  try {
                    const c = await store.createCategory({ name: reel.newCategorySuggestion });
                    await choose(c.id);
                  } catch {
                    b.disabled = false;
                  }
                },
              },
              icon('plus', 16),
              h('span', { class: 'pick-name' }, t('createNewNamed', { name: reel.newCategorySuggestion })),
              icon('sparkles', 16),
            ),
          );
        }
        if (others.length) {
          body.append(h('p', { class: 'label' }, sug.length ? t('otherCategories') : t('allCategories')));
          body.append(h('div', { class: 'pick-list' }, others.map((c) => pickRow(c, choose, false))));
        }
        const tagRow = tagSuggestionRow(reel, selectedTags, toggleTag);
        if (tagRow) body.append(tagRow);
        body.append(newCategoryInline(async (c) => choose(c.id)));
        if ((reel.suggestions || []).length || (reel.tagSuggestions || []).length || reel.newCategorySuggestion) {
          body.append(
            h(
              'div',
              { class: 'sheet-actions reject-row' },
              h(
                'button',
                {
                  class: 'btn btn-ghost',
                  type: 'button',
                  'data-testid': 'reject-suggestions',
                  onclick: async () => {
                    await store.rejectSuggestions(reel.id);
                    toast(t('suggestionsRejected'));
                    s.close();
                  },
                },
                t('rejectAll'),
              ),
            ),
          );
        }
      },
    });
  });
}

function pickRow(cat, choose, suggested) {
  return h(
    'button',
    { class: `pick-row${suggested ? ' suggested' : ''}`, type: 'button', 'data-testid': 'pick-option', 'data-name': cat.name, onclick: () => choose(cat.id) },
    h('span', { class: 'swatch', 'data-color': catColor(cat) }),
    h('span', { class: 'pick-name' }, cat.name),
    suggested ? icon('sparkles', 16) : icon('chevron', 16),
  );
}

function newCategoryInline(onCreated) {
  const input = h('input', { class: 'input', type: 'text', placeholder: t('newCategoryName'), maxlength: '40', 'data-testid': 'inline-new-category', 'aria-label': t('newCategoryName') });
  const err = h('p', { class: 'field-error', role: 'alert' });
  const submit = async (e) => {
    e.preventDefault();
    err.textContent = '';
    try {
      const c = await store.createCategory({ name: input.value });
      await onCreated(c);
    } catch (ex) {
      err.textContent = t('err_' + (ex.code || 'generic'));
    }
  };
  return h('form', { class: 'inline-new', onsubmit: submit }, h('div', { class: 'row' }, input, h('button', { class: 'btn btn-secondary', type: 'submit', 'data-testid': 'inline-new-submit' }, icon('plus', 16), t('add'))), err);
}

/* ----------------------------- Reel detail ------------------------- */

const sourceLabel = (s) => t('source_' + (s || 'manual'));

export function reelDetailSheet(reelId) {
  const reel = store.state.reels.find((r) => r.id === reelId);
  if (!reel) return;
  const s = sheet({
    title: t('reelDetails'),
    testid: 'reel-sheet',
    size: 'lg',
    content: (body, s) => {
      const render = () => {
        const r = store.state.reels.find((x) => x.id === reelId);
        if (!r) return s.close();
        const cat = store.categoryById(r.categoryId);
        body.replaceChildren();

        // Preview area
        const preview = h('div', { class: 'detail-preview' }, reelTile(r, cat, 'lg'));
        if (!r.thumbnailPath) {
          const refreshBtn = h(
            'button',
            {
              class: 'btn btn-ghost btn-sm preview-btn',
              type: 'button',
              'data-testid': 'refresh-cover',
              onclick: async (e) => {
                const b = e.currentTarget;
                b.disabled = true;
                b.classList.add('loading');
                const res = await store.refreshReelMeta(r.id).catch(() => ({ ok: false }));
                b.disabled = false;
                b.classList.remove('loading');
                if (res.ok) toast(t('coverRefreshOk'), { tone: 'success' });
                else toast(t('coverRefreshFailed'), { tone: 'warn', duration: 5000 });
              },
            },
            icon('download', 16),
            t('coverRefresh'),
          );
          preview.append(refreshBtn);
        }
        const emb = embedUrl(r);
        if (emb) {
          const loadBtn = h(
            'button',
            {
              class: 'btn btn-ghost btn-sm preview-btn',
              type: 'button',
              'data-testid': 'load-preview',
              onclick: () => {
                preview.replaceChildren(h('iframe', { class: 'embed', src: emb, title: t('instagramPreview'), loading: 'lazy', allow: 'encrypted-media', referrerpolicy: 'strict-origin-when-cross-origin', sandbox: 'allow-scripts allow-same-origin allow-popups' }));
              },
            },
            icon('play', 16),
            t('loadPreview'),
          );
          preview.append(loadBtn);
          if (store.state.settings.embedPreview) setTimeout(() => loadBtn.click(), 0);
        }

        // Meta
        const pUrl = profileUrl(r.username);
        const avatar = r.avatarUrl ? h('img', { class: 'avatar', src: r.avatarUrl, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : null;
        const meta = h(
          'div',
          { class: 'detail-meta' },
          h(
            'div',
            { class: 'detail-creator' },
            avatar || icon('user', 16),
            r.username
              ? h('button', { class: 'linkish', type: 'button', onclick: () => pUrl && openExternal(pUrl) }, '@' + r.username)
              : h('span', { class: 'faint' }, r.creatorName || t('unknownCreator')),
          ),
          h('dl', { class: 'facts' },
            h('dt', null, t('added')), h('dd', null, formatDate(r.addedAt, lang())),
            r.savedAt ? [h('dt', null, t('savedOnInstagram')), h('dd', null, formatDate(r.savedAt, lang()))] : null,
            h('dt', null, t('type')), h('dd', null, t('kind_' + r.kind)),
            h('dt', null, t('source')), h('dd', null, sourceLabel(r.source)),
            r.collection ? [h('dt', null, t('collection')), h('dd', null, r.collection)] : null,
          ),
        );

        // Caption / title (real data only)
        const texts = h('div', { class: 'detail-texts' });
        if (r.title) texts.append(h('p', { class: 'label' }, t('sharedTitle')), h('p', { class: 'detail-text', 'data-testid': 'detail-title' }, r.title));
        if (r.caption) texts.append(h('p', { class: 'label' }, t('caption')), h('p', { class: 'detail-text', 'data-testid': 'detail-caption' }, r.caption));
        if (!r.title && !r.caption) texts.append(h('p', { class: 'hint' }, t('noCaptionHelp')));
        const editCaption = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'data-testid': 'edit-caption', onclick: () => captionSheet(r.id) }, icon('edit', 16), r.caption ? t('editCaption') : t('addCaption'));
        texts.append(editCaption);

        // Category
        const select = h(
          'select',
          {
            class: 'input',
            'data-testid': 'detail-category',
            'aria-label': t('category'),
            onchange: async (e) => {
              const v = e.target.value || null;
              await store.assignCategory(r.id, v);
              const c = store.categoryById(v);
              toast(c ? t('filedUnder', { name: c.name }) : t('categoryCleared'));
            },
          },
          h('option', { value: '' }, '— ' + t('uncategorized') + ' —'),
          store.state.categories.map((c) => h('option', { value: c.id, selected: c.id === r.categoryId }, c.name)),
        );
        const catBlock = h(
          'div',
          { class: 'field' },
          h('label', { class: 'label' }, t('category')),
          select,
          r.categoryId && r.categorySource && r.categorySource !== 'manual'
            ? h('p', { class: 'hint', 'data-testid': 'auto-reason' }, icon('sparkles', 14), t('autoBy_' + r.categorySource, { words: (r.reasons || []).join(', ') }))
            : null,
          !r.categoryId && (r.suggestions || []).length
            ? h('div', { class: 'chip-row' }, h('span', { class: 'hint' }, t('suggested') + ':'), r.suggestions.map(store.categoryById).filter(Boolean).map((c) => categoryChip(c, { onClick: () => store.assignCategory(r.id, c.id), testid: 'suggestion-chip' })))
            : null,
        );

        // Notes (autosave)
        let timer;
        const notes = h('textarea', {
          class: 'input',
          rows: '3',
          maxlength: '5000',
          placeholder: t('notesPlaceholder'),
          'data-testid': 'detail-notes',
          'aria-label': t('notes'),
          oninput: (e) => {
            clearTimeout(timer);
            const v = e.target.value;
            timer = setTimeout(() => store.updateReel(r.id, { notes: v }), 400);
          },
        });
        notes.value = r.notes || '';
        // Tags (user-confirmed; AI suggestions are one tap away)
        const tagsBlock = h('div', { class: 'field', 'data-testid': 'tags-field' });
        const drawTags = () => {
          const rr = store.state.reels.find((x) => x.id === reelId) || r;
          tagsBlock.replaceChildren();
          tagsBlock.append(h('span', { class: 'label' }, t('tags')));
          const chips = h('div', { class: 'chip-row' });
          for (const tg of rr.tags || []) {
            chips.append(
              h('span', { class: 'chip chip-cat', 'data-testid': 'reel-tag' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), tg, h('button', { type: 'button', class: 'kw-x', 'aria-label': t('removeTag', { t: tg }), onclick: () => store.removeTag(rr.id, tg) }, icon('x', 12))),
            );
          }
          if (!(rr.tags || []).length) chips.append(h('span', { class: 'hint' }, t('noTagsYet')));
          tagsBlock.append(chips);
          if ((rr.tagSuggestions || []).length) {
            const sugRow = h('div', { class: 'chip-row' });
            for (const tg of rr.tagSuggestions) {
              if ((rr.tags || []).includes(tg)) continue;
              sugRow.append(
                h('button', { class: 'chip chip-warn', type: 'button', 'data-testid': 'tag-suggestion', onclick: () => store.applyTags(rr.id, [tg]) }, icon('sparkles', 12), t('addTagSuggestion', { t: tg })),
              );
            }
            if (sugRow.children.length) tagsBlock.append(h('span', { class: 'hint' }, t('suggested')), sugRow);
          }
          const tagInput = h('input', { class: 'input input-sm', type: 'text', maxlength: '40', placeholder: t('addTagPlaceholder'), 'aria-label': t('addTag'), enterkeyhint: 'enter' });
          const addTag = () => {
            const v = tagInput.value.split(',').map((x) => x.trim().replace(/^#/, '')).filter(Boolean);
            if (!v.length) return;
            tagInput.value = '';
            store.applyTags(rr.id, v);
          };
          tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          });
          tagsBlock.append(h('div', { class: 'row' }, tagInput, h('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-testid': 'tag-add', onclick: addTag }, t('add'))));
        };
        drawTags();

        const notesBlock = h('div', { class: 'field' }, h('label', { class: 'label' }, t('notes')), notes);

        const actions = h(
          'div',
          { class: 'detail-actions' },
          openButton(r, { label: true }),
          h('button', { class: 'btn btn-secondary', type: 'button', 'data-testid': 'copy-link', onclick: async () => toast((await copyText(r.url)) ? t('linkCopied') : t('copyFailed')) }, icon('copy', 18), t('copyLink')),
          h(
            'button',
            {
              class: 'btn btn-ghost btn-danger-text',
              type: 'button',
              'data-testid': 'delete-reel',
              onclick: async () => {
                const ok = await confirmSheet({ title: t('deleteReelQ'), message: t('deleteReelMsg'), confirm: t('delete'), cancel: t('cancel'), danger: true });
                if (!ok) return;
                const backup = { ...r };
                await store.deleteReel(r.id);
                s.close();
                toast(t('reelDeleted'), { action: t('undo'), onAction: () => store.restoreReel(backup), duration: 6000 });
              },
            },
            icon('trash', 18),
            t('delete'),
          ),
        );

        body.append(h('div', { class: 'detail' }, h('div', { class: 'detail-left' }, preview, actions), h('div', { class: 'detail-right' }, meta, catBlock, tagsBlock, texts, notesBlock)));
      };
      render();
      const unsub = store.subscribe((why) => {
        if (why === 'reels' || why === 'categories') {
          const active = document.activeElement;
          if (active && active.dataset && active.dataset.testid === 'detail-notes') return; // don't steal focus while typing
          render();
        }
      });
      s.el.addEventListener('close', unsub);
    },
    onClose: () => {},
  });
}

/** Let the user paste the real caption (copied from Instagram). */
export function captionSheet(reelId) {
  const r = store.state.reels.find((x) => x.id === reelId);
  if (!r) return;
  const s = sheet({
    title: r.caption ? t('editCaption') : t('addCaption'),
    testid: 'caption-sheet',
    content: (body, s) => {
      const ta = h('textarea', { class: 'input', rows: '5', maxlength: '5000', placeholder: t('captionPlaceholder'), 'data-testid': 'caption-input', 'aria-label': t('caption') });
      ta.value = r.caption || '';
      const recheck = h('input', { type: 'checkbox', checked: !r.categoryId || r.categorySource !== 'manual', 'data-testid': 'caption-recheck' });
      body.append(
        h('p', { class: 'hint' }, t('captionHelp')),
        ta,
        h('label', { class: 'check' }, recheck, h('span', null, t('recategorizeAfterCaption'))),
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => s.close() }, t('cancel')),
          h(
            'button',
            {
              class: 'btn btn-primary',
              type: 'button',
              'data-testid': 'caption-save',
              onclick: async () => {
                await store.updateReel(r.id, { caption: ta.value });
                if (recheck.checked) {
                  const updated = store.state.reels.find((x) => x.id === r.id);
                  const res = store.previewClassification(updated);
                  if (res.status === 'confident') {
                    await store.updateReel(r.id, { categoryId: res.categoryId, categorySource: res.method, needsReview: false, reasons: res.candidates[0].reasons, suggestions: [] });
                    toast(t('filedUnder', { name: store.categoryById(res.categoryId).name }));
                  } else {
                    await store.updateReel(r.id, { suggestions: res.candidates.map((c) => c.id), reasons: res.candidates[0]?.reasons || [] });
                  }
                }
                s.close();
              },
            },
            t('save'),
          ),
        ),
      );
      setTimeout(() => ta.focus(), 50);
    },
  });
}

/* --------------------------- Category editor ----------------------- */

export function categoryEditorSheet(categoryId = null) {
  const cat = categoryId ? store.categoryById(categoryId) : null;
  return new Promise((resolve) => {
    let result = null;
    const s = sheet({
      title: cat ? t('editCategory') : t('newCategory'),
      testid: 'category-sheet',
      onClose: () => resolve(result),
      content: (body, s) => {
        let color = cat ? cat.color : CATEGORY_COLORS[store.state.categories.length % CATEGORY_COLORS.length];
        let keywords = cat ? [...cat.keywords] : [];
        const name = h('input', { class: 'input', type: 'text', maxlength: '40', value: cat ? cat.name : '', placeholder: t('categoryNamePlaceholder'), 'data-testid': 'category-name', id: 'cat-name', autocomplete: 'off' });
        const err = h('p', { class: 'field-error', role: 'alert', 'data-testid': 'category-error' });
        const swatches = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': t('color') });
        const drawSwatches = () => {
          swatches.replaceChildren(
            ...CATEGORY_COLORS.map((c) =>
              h('button', { type: 'button', class: 'swatch-btn', 'data-color': c, role: 'radio', 'aria-checked': String(c === color), 'aria-label': t('color_' + c), onclick: () => { color = c; drawSwatches(); } }, c === color ? icon('check', 14) : null),
            ),
          );
        };
        drawSwatches();
        const kwList = h('div', { class: 'kw-list', 'data-testid': 'keyword-list' });
        const drawKw = () => {
          kwList.replaceChildren(
            ...(keywords.length
              ? keywords.map((k, i) => h('span', { class: 'kw' }, k, h('button', { type: 'button', class: 'kw-x', 'aria-label': t('removeKeyword', { k }), onclick: () => { keywords.splice(i, 1); drawKw(); } }, icon('x', 12))))
              : [h('span', { class: 'hint' }, t('noKeywords'))]),
          );
        };
        drawKw();
        const kwInput = h('input', { class: 'input', type: 'text', placeholder: t('keywordPlaceholder'), 'data-testid': 'keyword-input', 'aria-label': t('keywords'), enterkeyhint: 'enter' });
        const addKw = () => {
          const parts = kwInput.value.split(',').map((x) => x.trim()).filter(Boolean);
          if (!parts.length) return;
          keywords = cleanKeywords([...keywords, ...parts]);
          kwInput.value = '';
          drawKw();
        };
        kwInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKw();
          }
        });
        const save = async () => {
          addKw();
          err.textContent = '';
          try {
            result = cat ? await store.updateCategory(cat.id, { name: name.value, color, keywords }) : await store.createCategory({ name: name.value, color, keywords });
            toast(cat ? t('categorySaved') : t('categoryCreated', { name: result.name }));
            s.close();
          } catch (ex) {
            err.textContent = t('err_' + (ex.code || 'generic'));
            name.focus();
          }
        };
        body.append(
          h('div', { class: 'field' }, h('label', { class: 'label', for: 'cat-name' }, t('name')), name, err),
          h('div', { class: 'field' }, h('span', { class: 'label' }, t('color')), swatches),
          h(
            'div',
            { class: 'field' },
            h('span', { class: 'label' }, t('keywords')),
            h('p', { class: 'hint' }, t('keywordsHelp')),
            h('div', { class: 'row' }, kwInput, h('button', { class: 'btn btn-secondary', type: 'button', onclick: addKw, 'data-testid': 'keyword-add' }, t('add'))),
            kwList,
          ),
          h(
            'div',
            { class: 'sheet-actions' },
            cat
              ? h(
                  'button',
                  {
                    class: 'btn btn-ghost btn-danger-text',
                    type: 'button',
                    'data-testid': 'category-delete',
                    onclick: async () => {
                      const n = store.countsByCategory().get(cat.id) || 0;
                      const ok = await confirmSheet({ title: t('deleteCategoryQ', { name: cat.name }), message: n ? t('deleteCategoryMsg', { n }) : t('deleteCategoryEmpty'), confirm: t('delete'), cancel: t('cancel'), danger: true });
                      if (!ok) return;
                      await store.deleteCategory(cat.id);
                      result = 'deleted';
                      toast(t('categoryDeleted'));
                      s.close();
                    },
                  },
                  icon('trash', 16),
                  t('delete'),
                )
              : h('span'),
            h('button', { class: 'btn btn-primary', type: 'button', onclick: save, 'data-testid': 'category-save' }, cat ? t('save') : t('create')),
          ),
        );
        name.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          }
        });
        // Auto-focus the name field shortly after the sheet opens — but never
        // steal focus from an input the user (or an automation filling the
        // keyword field) has already focused: a late focus() here used to
        // redirect typed text into the name field ("Recipespasta" flake).
        setTimeout(() => {
          const ae = document.activeElement;
          const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
          if (!typing) name.focus();
        }, 50);
      },
    });
  });
}
