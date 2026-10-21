/**
 * Small DOM helpers. All user data is inserted as text nodes (never as HTML).
 */

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v; // only used for trusted static SVG
      else if (v === true) el.setAttribute(k, '');
      else if (k === 'value' || k === 'checked' || k === 'selected') el[k] = v;
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.append(c);
    else el.append(document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/* ------------------------------ Icons ------------------------------ */
// 24x24 stroke icons (Lucide-style paths, MIT licensed shapes redrawn).
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9-9-9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  download: '<path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h4"/>',
  play: '<path d="M8 5.5v13l10-6.5-10-6.5Z"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6Z"/>',
  wand: '<path d="m4 20 11-11"/><path d="m14 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/><path d="m19 11 .7 1.3L21 13l-1.3.7L19 15l-.7-1.3L17 13l1.3-.7Z"/>',
};

export function icon(name, size = 20) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
  return span;
}

/* ------------------------------ Toasts ----------------------------- */

let toastHost;
export function toast(message, { action, onAction, tone = 'neutral', duration = 3200 } = {}) {
  if (!toastHost) {
    toastHost = h('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite', 'data-testid': 'toast-host' });
    document.body.append(toastHost);
  }
  const el = h(
    'div',
    { class: `toast toast-${tone}`, 'data-testid': 'toast' },
    h('span', { class: 'toast-msg' }, message),
    action ? h('button', { class: 'toast-action', type: 'button', onclick: () => { onAction && onAction(); dismiss(); } }, action) : null,
  );
  const dismiss = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  };
  toastHost.append(el);
  setTimeout(dismiss, duration);
  return dismiss;
}

/* ------------------------------ Sheets ----------------------------- */

const openSheets = [];

/**
 * Open a bottom sheet (modal dialog). Returns {el, close, body}.
 * The sheet closes on backdrop tap, Escape, and Android back button.
 */
export function sheet({ title, content, onClose, testid = 'sheet', size = 'md' }) {
  const body = h('div', { class: 'sheet-body' });
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', 'data-testid': 'sheet-close' }, icon('x'));
  const dlg = h(
    'dialog',
    { class: `sheet sheet-${size}`, 'data-testid': testid, 'aria-labelledby': 'sheet-title-' + openSheets.length },
    h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }),
    h('header', { class: 'sheet-head' }, h('h2', { class: 'sheet-title', id: 'sheet-title-' + openSheets.length }, title), closeBtn),
    body,
  );
  let closed = false;
  const close = (result) => {
    if (closed) return;
    closed = true;
    const i = openSheets.indexOf(api);
    if (i >= 0) openSheets.splice(i, 1);
    dlg.classList.add('closing');
    setTimeout(() => {
      try {
        dlg.close();
      } catch {
        /* ignore */
      }
      dlg.remove();
    }, 180);
    onClose && onClose(result);
  };
  const api = { el: dlg, body, close };
  closeBtn.addEventListener('click', () => close());
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  if (typeof content === 'function') content(body, api);
  else if (content) body.append(content);
  document.body.append(dlg);
  dlg.showModal();
  openSheets.push(api);
  return api;
}

export function closeTopSheet() {
  const top = openSheets[openSheets.length - 1];
  if (top) {
    top.close();
    return true;
  }
  return false;
}

export function closeAllSheets() {
  while (openSheets.length) openSheets[openSheets.length - 1].close();
}

/** Promise-based confirm sheet. */
export function confirmSheet({ title, message, confirm, cancel, danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const s = sheet({
      title,
      testid: 'confirm-sheet',
      size: 'sm',
      onClose: () => resolve(result),
      content: (body, s) => {
        body.append(
          h('p', { class: 'muted' }, message),
          h(
            'div',
            { class: 'sheet-actions' },
            h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => s.close(), 'data-testid': 'confirm-cancel' }, cancel),
            h(
              'button',
              { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', 'data-testid': 'confirm-ok', onclick: () => { result = true; s.close(); } },
              confirm,
            ),
          ),
        );
      },
    });
  });
}

export function formatDate(ms, lang) {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' });
}

export function relativeDay(ms, lang, t) {
  const d = new Date(ms);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return t('today');
  if (diff === 1) return t('yesterday');
  return formatDate(ms, lang);
}
