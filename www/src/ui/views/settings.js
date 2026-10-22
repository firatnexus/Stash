import { h, icon, toast, confirmSheet, sheet } from '../dom.js';
import { t, setLang, lang } from '../../core/i18n.js';
import * as store from '../../core/store.js';
import { saveTextFile, httpPost, isNative, cacheStats, clearCache } from '../../core/platform.js';
import { AI_PRESETS, aiSuggest } from '../../categorize/ai.js';
import { backupFileName, validateBackup } from '../../io/backup.js';
import { APP_VERSION } from '../../version.js';
import { applyTheme } from '../theme.js';

function row(label, control, hint) {
  return h('div', { class: 'set-row' }, h('div', { class: 'set-text' }, h('span', { class: 'set-label' }, label), hint ? h('span', { class: 'hint' }, hint) : null), control);
}

function toggle(checked, onChange, testid, label) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked, 'data-testid': testid, 'aria-label': label, onchange: (e) => onChange(e.target.checked) });
  return h('label', { class: 'switch' }, input, h('span', { class: 'switch-ui', 'aria-hidden': 'true' }));
}

export function renderSettings() {
  const s = store.state.settings;
  const root = h('div', { class: 'view view-settings', 'data-testid': 'view-settings' });
  root.append(h('header', { class: 'view-head' }, h('h1', { class: 'view-title' }, t('settingsTitle'))));

  // General
  const langSel = h(
    'select',
    { class: 'input input-sm', 'data-testid': 'lang-select', 'aria-label': t('language'), onchange: async (e) => { await store.setSetting('lang', e.target.value || null); setLang(e.target.value || null); } },
    h('option', { value: '', selected: !s.lang }, t('deviceLanguage')),
    h('option', { value: 'tr', selected: s.lang === 'tr' }, 'Türkçe'),
    h('option', { value: 'en', selected: s.lang === 'en' }, 'English'),
  );
  const themeSel = h(
    'select',
    { class: 'input input-sm', 'data-testid': 'theme-select', 'aria-label': t('theme'), onchange: async (e) => { await store.setSetting('theme', e.target.value); applyTheme(e.target.value); } },
    ['system', 'light', 'dark'].map((v) => h('option', { value: v, selected: s.theme === v }, t('theme_' + v))),
  );
  root.append(
    h(
      'section',
      { class: 'panel' },
      h('h2', { class: 'section-title' }, t('general')),
      row(t('language'), langSel),
      row(t('theme'), themeSel),
      row(t('autoAssign'), toggle(s.autoAssign, (v) => store.setSetting('autoAssign', v), 'auto-assign', t('autoAssign')), t('autoAssignHint')),
      row(t('embedPreview'), toggle(s.embedPreview, (v) => store.setSetting('embedPreview', v), 'embed-preview', t('embedPreview')), t('embedPreviewHint')),
    ),
  );

  root.append(aiSection());
  root.append(coversSection());
  root.append(dataSection());

  // About
  root.append(
    h(
      'section',
      { class: 'panel about' },
      h('h2', { class: 'section-title' }, icon('shield', 18), t('privacyTitle')),
      h('ul', { class: 'bullets' }, h('li', null, t('privacy1')), h('li', null, t('privacy2')), h('li', null, t('privacy3')), h('li', null, t('privacy4'))),
      h('h2', { class: 'section-title' }, icon('info', 18), t('worksTitle')),
      h('ul', { class: 'bullets' }, [1, 2, 3, 4, 5].map((i) => h('li', null, t('works' + i)))),
      h('p', { class: 'hint version', 'data-testid': 'app-version' }, `${t('appName')} ${APP_VERSION}${isNative() ? ' · Android' : ' · Web'}`),
    ),
  );
  return root;
}

function aiSection() {
  const ai = { ...store.state.settings.ai };
  const save = () => store.setSetting('ai', { ...ai });
  const status = h('p', { class: 'hint', 'aria-live': 'polite', 'data-testid': 'ai-status' });
  const fields = h('div', { class: 'ai-fields', hidden: !ai.enabled });

  const preset = h(
    'select',
    {
      class: 'input',
      id: 'ai-preset',
      'data-testid': 'ai-preset',
      onchange: (e) => {
        const p = AI_PRESETS[e.target.value];
        ai.preset = e.target.value;
        ai.kind = p.kind;
        if (p.baseUrl) {
          ai.baseUrl = p.baseUrl;
          base.value = p.baseUrl;
        }
        save();
      },
    },
    Object.entries(AI_PRESETS).map(([k, p]) => h('option', { value: k, selected: ai.preset === k }, p.label)),
  );
  const base = h('input', { class: 'input mono', id: 'ai-base', type: 'url', value: ai.baseUrl, placeholder: 'https://…/v1', 'data-testid': 'ai-base', onchange: (e) => { ai.baseUrl = e.target.value.trim(); save(); } });
  const model = h('input', { class: 'input mono', id: 'ai-model', type: 'text', value: ai.model, placeholder: t('aiModelPlaceholder'), 'data-testid': 'ai-model', onchange: (e) => { ai.model = e.target.value.trim(); save(); } });
  const key = h('input', { class: 'input mono', id: 'ai-key', type: 'password', value: ai.apiKey, autocomplete: 'off', placeholder: t('aiKeyPlaceholder'), 'data-testid': 'ai-key', onchange: (e) => { ai.apiKey = e.target.value.trim(); save(); } });
  const test = h(
    'button',
    {
      class: 'btn btn-secondary',
      type: 'button',
      'data-testid': 'ai-test',
      onclick: async () => {
        if (!ai.apiKey || !ai.model || !ai.baseUrl) {
          status.textContent = t('aiIncomplete');
          return;
        }
        test.classList.add('loading');
        test.disabled = true;
        status.textContent = t('aiTesting');
        try {
          const cats = store.state.categories.length ? store.state.categories : [{ id: 'x', name: 'Recipes', keywords: [] }, { id: 'y', name: 'Travel', keywords: [] }];
          const r = await aiSuggest({ caption: 'Quick 15 minute pasta with garlic and lemon' }, cats, ai, httpPost);
          status.textContent = r ? t('aiOk', { name: (cats.find((c) => c.id === r.categoryIds[0]) || {}).name || '—' }) : t('aiOddReply');
        } catch (e) {
          status.textContent = t('aiFailed', { msg: e.message });
        } finally {
          test.classList.remove('loading');
          test.disabled = false;
        }
      },
    },
    t('aiTest'),
  );

  fields.append(
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'ai-preset' }, t('aiProvider')), preset),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'ai-base' }, t('aiBaseUrl')), base),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'ai-model' }, t('aiModel')), model),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'ai-key' }, t('aiKey')), key, h('p', { class: 'hint' }, t('aiKeyHint'))),
    h('div', { class: 'row' }, test),
    status,
  );

  return h(
    'section',
    { class: 'panel', 'data-testid': 'ai-section' },
    h('h2', { class: 'section-title' }, icon('sparkles', 18), t('aiTitle')),
    row(t('aiEnable'), toggle(ai.enabled, (v) => { ai.enabled = v; fields.hidden = !v; save(); }, 'ai-enable', t('aiEnable')), t('aiEnableHint')),
    h(
      'div',
      { class: 'set-row' },
      h(
        'div',
        { class: 'set-text' },
        h('span', { class: 'set-label' }, t('aiSuggestTags')),
        h('span', { class: 'hint' }, t('aiWhatSent')),
      ),
      toggle(ai.suggestTags !== false, (v) => { ai.suggestTags = v; save(); }, 'ai-suggest-tags', t('aiSuggestTags')),
    ),
    fields,
  );
}

function fmtBytes(n) {
  if (!n || n < 1024) return `${n || 0} KB`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function coversSection() {
  const usage = h('p', { class: 'hint', 'data-testid': 'cache-usage' }, t('cacheUsage', { size: '—' }));
  const refreshUsage = async () => {
    usage.textContent = t('cacheUsage', { size: fmtBytes(await cacheStats()) });
  };
  refreshUsage();

  const backfill = h(
    'button',
    {
      class: 'btn btn-secondary',
      type: 'button',
      'data-testid': 'backfill-covers',
      onclick: async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        b.classList.add('loading');
        try {
          const r = await store.refreshAllReels();
          if (!r.total) toast(t('backfillNone'));
          else toast(t('backfillDone', { n: r.total, ok: r.ok }), { tone: r.fail ? 'warn' : 'success', duration: 6000 });
        } finally {
          b.disabled = false;
          b.classList.remove('loading');
          refreshUsage();
        }
      },
    },
    icon('sparkles', 16),
    t('backfillBtn'),
  );

  const clearBtn = h(
    'button',
    {
      class: 'btn btn-ghost btn-danger-text',
      type: 'button',
      'data-testid': 'clear-cache',
      onclick: async () => {
        const ok = await clearCache();
        if (ok) {
          await store.load();
          toast(t('cacheCleared'));
        } else {
          toast(t('cacheClearFailed'), { tone: 'warn' });
        }
        refreshUsage();
      },
    },
    icon('trash', 16),
    t('clearCache'),
  );

  return h(
    'section',
    { class: 'panel', 'data-testid': 'covers-section' },
    h('h2', { class: 'section-title' }, icon('grid', 18), t('coversTitle')),
    h('p', { class: 'muted' }, t('coversText')),
    h('div', { class: 'row wrap' }, backfill, clearBtn),
    usage,
  );
}

function dataSection() {
  const file = h('input', { type: 'file', accept: '.json,application/json', class: 'visually-hidden', id: 'backup-file', 'data-testid': 'backup-file' });
  const status = h('p', { class: 'hint', 'aria-live': 'polite', 'data-testid': 'backup-status' });
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    let data;
    try {
      data = JSON.parse(await f.text());
    } catch {
      status.textContent = t('backupErr_invalid');
      return;
    }
    try {
      validateBackup(data);
    } catch (ex) {
      status.textContent = t('backupErr_' + (ex.code || 'invalid'));
      return;
    }
    status.textContent = '';
    restoreSheet(data, status);
  });

  return h(
    'section',
    { class: 'panel', 'data-testid': 'data-section' },
    h('h2', { class: 'section-title' }, icon('download', 18), t('dataTitle')),
    h('p', { class: 'muted' }, t('dataText', { reels: store.state.reels.length, cats: store.state.categories.length })),
    h(
      'div',
      { class: 'row wrap' },
      h(
        'button',
        {
          class: 'btn btn-primary',
          type: 'button',
          'data-testid': 'backup-export',
          onclick: async () => {
            try {
              const ok = await saveTextFile(backupFileName(), JSON.stringify(store.makeBackup(), null, 2));
              if (ok) toast(t('backupSaved'), { tone: 'success' });
            } catch (e) {
              toast(t('backupSaveFailed', { msg: e.message }), { tone: 'warn' });
            }
          },
        },
        icon('download', 18),
        t('exportData'),
      ),
      h('label', { class: 'btn btn-secondary', for: 'backup-file', 'data-testid': 'backup-import' }, icon('upload', 18), t('importData')),
      file,
    ),
    status,
    h(
      'div',
      { class: 'danger-zone' },
      h(
        'button',
        {
          class: 'btn btn-ghost btn-danger-text',
          type: 'button',
          'data-testid': 'wipe',
          onclick: async () => {
            const ok = await confirmSheet({ title: t('wipeQ'), message: t('wipeMsg'), confirm: t('wipeConfirm'), cancel: t('cancel'), danger: true });
            if (!ok) return;
            await store.wipeAll();
            toast(t('wiped'));
          },
        },
        icon('trash', 18),
        t('wipe'),
      ),
    ),
  );
}

function restoreSheet(data, status) {
  const counts = { reels: Array.isArray(data?.reels) ? data.reels.length : 0, cats: Array.isArray(data?.categories) ? data.categories.length : 0 };
  const s = sheet({
    title: t('restoreTitle'),
    testid: 'restore-sheet',
    content: (body, s) => {
      let mode = 'merge';
      const opt = (v, title, text) =>
        h('label', { class: 'radio-card' }, h('input', { type: 'radio', name: 'restore-mode', value: v, checked: v === mode, 'data-testid': 'restore-' + v, onchange: () => (mode = v) }), h('span', null, h('strong', null, title), h('span', { class: 'hint' }, text)));
      const err = h('p', { class: 'field-error', role: 'alert', 'data-testid': 'restore-error' });
      body.append(
        h('p', { class: 'muted' }, t('restoreFound', { reels: counts.reels, cats: counts.cats, date: data?.exportedAt ? new Date(data.exportedAt).toLocaleString(lang()) : '—' })),
        opt('merge', t('restoreMerge'), t('restoreMergeHint')),
        opt('replace', t('restoreReplace'), t('restoreReplaceHint')),
        err,
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => s.close() }, t('cancel')),
          h(
            'button',
            {
              class: 'btn btn-primary',
              type: 'button',
              'data-testid': 'restore-confirm',
              onclick: async (e) => {
                const b = e.currentTarget;
                b.disabled = true;
                b.classList.add('loading');
                try {
                  const r = await store.restoreBackup(data, mode);
                  s.close();
                  const msg = t('restoreDone', { reels: r.reels, cats: r.categories, dup: r.duplicates });
                  status.textContent = msg;
                  toast(msg, { tone: 'success', duration: 6000 });
                } catch (ex) {
                  err.textContent = t('backupErr_' + (ex.code || 'invalid'));
                  b.disabled = false;
                  b.classList.remove('loading');
                }
              },
            },
            t('restore'),
          ),
        ),
      );
    },
  });
}
