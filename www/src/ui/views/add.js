import { h, icon, toast, sheet } from '../dom.js';
import { t, tf } from '../../core/i18n.js';
import * as store from '../../core/store.js';
import { readClipboard } from '../../core/platform.js';
import { parseUserInput } from '../../instagram/url.js';
import { readExportFile } from '../../io/instagram-export.js';
import { pickCategorySheet, reelDetailSheet, categoryChip } from '../components.js';

/** Shared post-add feedback used by quick add, full form and share target. */
export async function reportAddResult(res, { fromShare = false } = {}) {
  const { added, duplicates, invalid } = res;
  if (res.aiError) toast(t('aiFailed', { msg: res.aiError }), { tone: 'warn', duration: 5000 });
  if (added.length === 1 && !duplicates.length) {
    const r = added[0];
    const cat = store.categoryById(r.categoryId);
    if (cat) {
      toast(t('savedTo', { name: cat.name }), { action: t('change'), onAction: () => pickCategorySheet(r.id), duration: 5000, tone: 'success' });
    } else {
      await pickCategorySheet(r.id, { title: store.state.categories.length ? t('whereToFile') : t('chooseCategory') });
    }
    return;
  }
  if (added.length > 1) {
    const filed = added.filter((r) => r.categoryId).length;
    toast(t('addedMany', { n: added.length, filed }), { tone: 'success', duration: 5000 });
  }
  if (duplicates.length) {
    const d = duplicates[0];
    toast(duplicates.length === 1 ? t('alreadySaved') : t('alreadySavedMany', { n: duplicates.length }), { action: duplicates.length === 1 ? t('show') : null, onAction: () => reelDetailSheet(d.id), duration: 5000 });
  }
  if (invalid.length && fromShare) {
    toast(t('shareNoLink'), { tone: 'warn', duration: 6000 });
  }
}

export function errorText(code) {
  return t('urlErr_' + code);
}

/** Compact URL field shown on the dashboard. */
export function quickAddForm() {
  const input = h('input', { class: 'input', type: 'url', inputmode: 'url', placeholder: t('pasteReelLink'), 'aria-label': t('reelLink'), 'data-testid': 'quick-url', autocomplete: 'off', enterkeyhint: 'go' });
  const err = h('p', { class: 'field-error', role: 'alert', 'data-testid': 'quick-error' });
  const btn = h('button', { class: 'btn btn-primary', type: 'submit', 'aria-label': t('add'), 'data-testid': 'quick-submit' }, icon('plus', 18), h('span', null, t('add')));
  const paste = h(
    'button',
    {
      class: 'icon-btn',
      type: 'button',
      'aria-label': t('paste'),
      title: t('paste'),
      'data-testid': 'quick-paste',
      onclick: async () => {
        const txt = await readClipboard();
        if (txt) input.value = txt.trim();
        else toast(t('clipboardEmpty'));
        input.focus();
      },
    },
    icon('clipboard', 18),
  );
  const form = h(
    'form',
    {
      class: 'quick-form',
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = '';
        const val = input.value.trim();
        const parsed = parseUserInput(val);
        if (!parsed.length) return (err.textContent = errorText('empty'));
        const bad = parsed.find((p) => !p.result.ok);
        if (bad && parsed.every((p) => !p.result.ok)) return (err.textContent = errorText(bad.result.error));
        btn.disabled = true;
        btn.classList.add('loading');
        try {
          const res = await store.addFromText({ text: val });
          input.value = '';
          if (res.invalid.length) err.textContent = t('someInvalid', { n: res.invalid.length });
          await reportAddResult(res);
        } finally {
          btn.disabled = false;
          btn.classList.remove('loading');
        }
      },
    },
    h('label', { class: 'label', for: 'quick-url' }, t('quickAddLabel')),
    h('div', { class: 'row' }, h('div', { class: 'input-wrap' }, icon('link', 18), input, paste), btn),
    err,
  );
  input.id = 'quick-url';
  return form;
}

export function renderAdd() {
  const root = h('div', { class: 'view view-add', 'data-testid': 'view-add' });
  root.append(h('header', { class: 'view-head' }, h('h1', { class: 'view-title' }, t('addTitle'))));
  const manual = manualSection();
  root.append(manual, shareSection(), exportSection());
  root._cleanup = manual._cleanup;
  return root;
}

function manualSection() {
  const url = h('textarea', { class: 'input mono', rows: '2', placeholder: t('urlPlaceholder'), 'data-testid': 'add-url', id: 'add-url', autocomplete: 'off', spellcheck: 'false' });
  const status = h('div', { class: 'url-status', 'aria-live': 'polite', 'data-testid': 'add-url-status' });
  const caption = h('textarea', { class: 'input', rows: '3', maxlength: '5000', placeholder: t('captionPlaceholder'), 'data-testid': 'add-caption', id: 'add-caption' });
  const notes = h('textarea', { class: 'input', rows: '2', maxlength: '5000', placeholder: t('notesPlaceholder'), 'data-testid': 'add-notes', id: 'add-notes' });
  const catSel = h('select', { class: 'input', 'data-testid': 'add-category', id: 'add-category' });
  const suggestion = h('div', { class: 'suggestion', 'aria-live': 'polite', 'data-testid': 'add-suggestion' });
  const err = h('p', { class: 'field-error', role: 'alert', 'data-testid': 'add-error' });
  const submit = h('button', { class: 'btn btn-primary btn-block', type: 'submit', 'data-testid': 'add-submit' }, icon('plus', 18), t('saveReel'));

  const fillCats = () => {
    catSel.replaceChildren(h('option', { value: '' }, t('autoCategory')), ...store.state.categories.map((c) => h('option', { value: c.id }, c.name)));
  };
  fillCats();

  const refresh = () => {
    const parsed = parseUserInput(url.value);
    status.replaceChildren();
    if (!url.value.trim()) return updateSuggestion(null);
    const ok = parsed.filter((p) => p.result.ok);
    const bad = parsed.filter((p) => !p.result.ok);
    if (ok.length) {
      const dups = ok.filter((p) => store.state.reels.some((r) => r.key === p.result.key));
      status.append(h('span', { class: 'ok' }, icon('check', 14), ok.length === 1 ? t('validLink', { kind: t('kind_' + ok[0].result.kind) }) : t('validLinks', { n: ok.length })));
      if (dups.length) status.append(h('span', { class: 'warn' }, icon('alert', 14), dups.length === 1 ? t('alreadySaved') : t('alreadySavedMany', { n: dups.length })));
      if (ok.length > 1) status.append(h('span', { class: 'hint' }, t('multiNote')));
    }
    if (bad.length) status.append(h('span', { class: 'bad' }, icon('alert', 14), errorText(bad[0].result.error) + (bad.length > 1 ? ` (+${bad.length - 1})` : '')));
    updateSuggestion(ok.length === 1 ? ok[0].result : null);
  };

  const updateSuggestion = (parsed) => {
    suggestion.replaceChildren();
    if (catSel.value) return;
    if (!store.state.categories.length) {
      suggestion.append(h('span', { class: 'hint' }, t('noCategoriesHint')));
      return;
    }
    if (!parsed) return;
    const res = store.previewClassification({ ...parsed, caption: caption.value, notes: notes.value });
    if (res.status === 'confident') {
      suggestion.append(h('span', { class: 'hint' }, icon('sparkles', 14), t('willFile')), categoryChip(store.categoryById(res.categoryId)), h('span', { class: 'hint' }, '(' + res.candidates[0].reasons.join(', ') + ')'));
    } else if (res.status === 'uncertain') {
      suggestion.append(h('span', { class: 'hint' }, icon('sparkles', 14), t('maybe')), ...res.candidates.slice(0, 3).map((c) => categoryChip(store.categoryById(c.id))), h('span', { class: 'hint' }, t('willAsk')));
    } else {
      suggestion.append(h('span', { class: 'hint' }, res.hasText ? t('noMatchWillAsk') : t('noTextWillAsk')));
    }
  };

  let debounce;
  for (const el of [url, caption, notes]) el.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(refresh, 120); });
  catSel.addEventListener('change', refresh);

  const form = h(
    'form',
    {
      class: 'panel form',
      novalidate: true,
      'data-testid': 'add-form',
      onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = '';
        const parsed = parseUserInput(url.value);
        if (!parsed.length) {
          err.textContent = errorText('empty');
          url.focus();
          return;
        }
        if (parsed.every((p) => !p.result.ok)) {
          err.textContent = errorText(parsed[0].result.error);
          url.focus();
          return;
        }
        submit.disabled = true;
        submit.classList.add('loading');
        try {
          const res = await store.addFromText({ text: url.value, caption: caption.value, notes: notes.value, categoryId: catSel.value || null, source: 'manual' });
          if (res.added.length) {
            url.value = '';
            caption.value = '';
            notes.value = '';
            catSel.value = '';
            refresh();
          }
          if (res.invalid.length) err.textContent = t('someInvalid', { n: res.invalid.length });
          await reportAddResult(res);
        } finally {
          submit.disabled = false;
          submit.classList.remove('loading');
        }
      },
    },
    h('h2', { class: 'section-title' }, icon('link', 18), t('manualTitle')),
    h(
      'div',
      { class: 'field' },
      h('div', { class: 'label-row' }, h('label', { class: 'label', for: 'add-url' }, t('reelLinks')), h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'data-testid': 'add-paste', onclick: async () => { const x = await readClipboard(); if (x) { url.value = (url.value ? url.value + '\n' : '') + x.trim(); refresh(); } else toast(t('clipboardEmpty')); } }, icon('clipboard', 16), t('paste'))),
      url,
      status,
    ),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'add-caption' }, t('captionOptional')), h('p', { class: 'hint' }, t('captionHelp')), caption),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'add-notes' }, t('notesOptional')), notes),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'add-category' }, t('category')), catSel, suggestion),
    err,
    submit,
  );
  const unsub = store.subscribe((why) => why === 'categories' && fillCats());
  form._cleanup = unsub;
  return form;
}

function shareSection() {
  return h(
    'section',
    { class: 'panel', 'data-testid': 'share-help' },
    h('h2', { class: 'section-title' }, icon('share', 18), t('shareTitle')),
    h('ol', { class: 'steps' }, h('li', null, t('shareStep1')), h('li', null, t('shareStep2')), h('li', null, t('shareStep3'))),
    h('p', { class: 'hint' }, t('shareNote')),
  );
}

function exportSection() {
  const fileInput = h('input', { type: 'file', accept: '.zip,.json,.html,.htm,.txt,application/zip,application/json,text/html,text/plain', class: 'visually-hidden', id: 'export-file', 'data-testid': 'export-file' });
  const status = h('div', { class: 'import-status', 'aria-live': 'polite', 'data-testid': 'export-status' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    status.replaceChildren(h('span', { class: 'spinner', 'aria-hidden': 'true' }), t('reading', { name: file.name }));
    try {
      const { items, files } = await readExportFile(file);
      status.replaceChildren();
      if (!items.length) {
        status.append(h('p', { class: 'field-error' }, t('exportNoLinks')));
        return;
      }
      exportPreviewSheet(items, files);
    } catch (e) {
      status.replaceChildren(h('p', { class: 'field-error', 'data-testid': 'export-error' }, tf('exportErr_' + (e.code || e.message), 'exportErr_generic')));
    }
  });
  return h(
    'section',
    { class: 'panel', 'data-testid': 'export-section' },
    h('h2', { class: 'section-title' }, icon('upload', 18), t('exportTitle')),
    h('p', { class: 'muted' }, t('exportIntro')),
    h('details', { class: 'howto' }, h('summary', null, t('exportHowTo')), h('ol', { class: 'steps' }, [1, 2, 3, 4, 5].map((i) => h('li', null, t('exportStep' + i))))),
    h('label', { class: 'btn btn-secondary', for: 'export-file', 'data-testid': 'export-pick' }, icon('file', 18), t('chooseExportFile')),
    fileInput,
    status,
  );
}

function exportPreviewSheet(items, files) {
  const reels = items.filter((i) => i.parsed.kind === 'reel').length;
  const posts = items.length - reels;
  const existing = new Set(store.state.reels.map((r) => r.key));
  const dup = items.filter((i) => existing.has(i.parsed.key)).length;
  const collections = [...new Set(items.map((i) => i.collection).filter(Boolean))];
  const s = sheet({
    title: t('exportPreviewTitle'),
    testid: 'export-sheet',
    content: (body, s) => {
      const incPosts = h('input', { type: 'checkbox', checked: true, 'data-testid': 'export-include-posts' });
      const useCols = h('input', { type: 'checkbox', checked: collections.length > 0, 'data-testid': 'export-collections' });
      const go = h('button', { class: 'btn btn-primary', type: 'button', 'data-testid': 'export-confirm' }, t('importN', { n: items.length - dup }));
      const upd = () => {
        const n = items.filter((i) => !existing.has(i.parsed.key) && (incPosts.checked || i.parsed.kind === 'reel')).length;
        go.textContent = t('importN', { n });
        go.disabled = n === 0;
      };
      incPosts.addEventListener('change', upd);
      upd();
      go.addEventListener('click', async () => {
        go.disabled = true;
        go.classList.add('loading');
        const r = await store.importExportItems(items, { includePosts: incPosts.checked, collectionsAsCategories: useCols.checked });
        s.close();
        toast(t('importDone', { added: r.added, assigned: r.assigned, dup: r.duplicates }), { tone: 'success', duration: 7000 });
        location.hash = r.added - r.assigned > 0 ? '#/library?cat=review' : '#/library';
      });
      body.append(
        h('p', { class: 'hint' }, t('fromFiles', { files: files.join(', ') })),
        h(
          'dl',
          { class: 'facts big', 'data-testid': 'export-facts' },
          h('dt', null, t('kind_reel')), h('dd', null, String(reels)),
          h('dt', null, t('postsLabel')), h('dd', null, String(posts)),
          h('dt', null, t('alreadyInLibrary')), h('dd', null, String(dup)),
          h('dt', null, t('collections')), h('dd', null, collections.length ? collections.join(', ') : '—'),
        ),
        h('label', { class: 'check' }, incPosts, h('span', null, t('includePosts'))),
        collections.length ? h('label', { class: 'check' }, useCols, h('span', null, t('collectionsAsCategories'))) : null,
        h('p', { class: 'hint' }, t('exportHonest')),
        h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => s.close() }, t('cancel')), go),
      );
    },
  });
}
