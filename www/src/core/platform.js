/**
 * Platform bridge. The same web code runs inside the Android app (Capacitor
 * WebView) and in a normal browser (development and automated tests).
 * Native features go through the small "ReelsBridge" Android plugin.
 */

const cap = () => globalThis.Capacitor;

export function isNative() {
  const c = cap();
  return Boolean(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform());
}

const plugins = new Map();
/** Native plugin proxy (null in a normal browser). Uses @capacitor/core's registerPlugin. */
function plugin(name) {
  if (!isNative()) return null;
  if (!plugins.has(name)) {
    const c = cap();
    plugins.set(name, c.registerPlugin ? c.registerPlugin(name) : (c.Plugins && c.Plugins[name]) || null);
  }
  return plugins.get(name);
}
const bridge = () => plugin('ReelsBridge');
const appPlugin = () => plugin('App');

/* ------------------------------ Sharing ---------------------------- */

/** Text shared into the app before the web layer was ready (cold start). */
export async function takePendingShare() {
  const b = bridge();
  if (b) {
    try {
      const r = await b.getPendingShare();
      if (r && (r.text || r.title || r.url)) return { title: r.title || '', text: r.text || '', url: r.url || '' };
    } catch {
      /* no pending share */
    }
    return null;
  }
  // Browser fallback: ?title=&text=&url= (handy for testing)
  const p = new URLSearchParams(location.search);
  if (p.has('text') || p.has('url') || p.has('title')) {
    const payload = { title: p.get('title') || '', text: p.get('text') || '', url: p.get('url') || '' };
    history.replaceState(null, '', location.pathname + location.hash);
    return payload;
  }
  return null;
}

/** Subscribe to shares that arrive while the app is running. */
export function onShare(cb) {
  const b = bridge();
  if (b) b.addListener('share', (r) => cb({ title: r.title || '', text: r.text || '', url: r.url || '' }));
}

/* ------------------------------- Links ----------------------------- */

export async function openExternal(url) {
  const b = bridge();
  if (b) {
    await b.openUrl({ url });
    return;
  }
  window.open(url, '_blank', 'noopener');
}

/* ------------------------------- Files ----------------------------- */

/**
 * Save a text file. Android: system "Save as" dialog (Storage Access
 * Framework). Browser: regular download.
 * @returns {Promise<boolean>} false if the user cancelled
 */
export async function saveTextFile(name, text, mime = 'application/json') {
  const b = bridge();
  if (b) {
    const r = await b.saveTextFile({ name, text, mime });
    return Boolean(r && r.saved);
  }
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/* ----------------------------- Clipboard --------------------------- */

export async function readClipboard() {
  const b = bridge();
  if (b) {
    try {
      const r = await b.readClipboard();
      return (r && r.text) || '';
    } catch {
      return '';
    }
  }
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/* ------------------------------- HTTP ------------------------------ */

/**
 * JSON POST used only by the optional AI provider. On Android it goes
 * through the native HTTP stack so provider CORS rules do not apply.
 */
export async function httpPost(url, headers, body) {
  const http = plugin('CapacitorHttp');
  if (http) {
    const r = await http.request({ method: 'POST', url, headers, data: body, connectTimeout: 20000, readTimeout: 30000 });
    return { status: r.status, data: r.data };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
    let data = null;
    try {
      data = await r.json();
    } catch {
      data = null;
    }
    return { status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------- Covers (native only) ------------------------- */

/** Fetch Instagram's public embed page HTML (native only; null in a browser). */
export async function fetchEmbedPage(url) {
  const b = bridge();
  if (!b) return null;
  try {
    const r = await b.fetchEmbedPage({ url });
    if (!r || r.status < 200 || r.status >= 300) return null;
    return r.body || '';
  } catch {
    return null;
  }
}

/**
 * Download an image, downscale it and store it as WebP in app storage.
 * @returns {Promise<{path:string, bytes:number}|null>}
 */
export async function downloadImage(url, name, maxWidth = 480) {
  const b = bridge();
  if (!b) return null;
  try {
    const r = await b.downloadImage({ url, name, maxWidth });
    return r && r.path ? { path: r.path, bytes: r.bytes || 0 } : null;
  } catch {
    return null;
  }
}

/** Total size of the stored cover/avatar cache (bytes; 0 in a browser). */
export async function cacheStats() {
  const b = bridge();
  if (!b) return 0;
  try {
    const r = await b.cacheStats();
    return (r && r.bytes) || 0;
  } catch {
    return 0;
  }
}

/** Delete stored cover/avatar images. The reels themselves are kept. */
export async function clearCache() {
  const b = bridge();
  if (!b) return false;
  try {
    await b.clearCache();
    return true;
  } catch {
    return false;
  }
}

/** Convert an app-internal file path to a URL the WebView can display. */
export function convertFileSrc(path) {
  const c = cap();
  return c && typeof c.convertFileSrc === 'function' ? c.convertFileSrc(path) : null;
}

/* ----------------------------- System bars ------------------------- */

/** Match Android status/navigation bar colors to the app theme. */
export function setSystemBars(dark) {
  const b = bridge();
  if (b) b.setSystemBars({ dark }).catch(() => {});
}

/* ------------------------------ Lifecycle -------------------------- */

/** Tell the native layer its first frame is painted (releases the splash). */
export function markFirstFrame() {
  const b = bridge();
  if (b) b.markFirstFrame().catch(() => {});
}

export function onBackButton(cb) {
  const app = appPlugin();
  if (app) app.addListener('backButton', cb);
}

export function exitApp() {
  const app = appPlugin();
  if (app) app.exitApp();
}

export function onResume(cb) {
  const app = appPlugin();
  if (app) app.addListener('resume', cb);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') cb();
  });
}

export async function appInfo() {
  const app = appPlugin();
  if (app) {
    try {
      return await app.getInfo();
    } catch {
      return null;
    }
  }
  return null;
}
