/**
 * Import saved posts from Instagram's official "Download/Export your
 * information" archive (Accounts Center). Supports:
 *   - the ZIP archive as downloaded
 *   - saved_posts.json / saved_collections.json
 *   - the HTML variants (links only)
 *
 * The export contains only links, the creator username and the save time.
 * It does not contain captions or thumbnails, and we do not try to fetch them.
 */
import { parseInstagramUrl, extractInstagramUrls, isValidUsername } from '../instagram/url.js';
import { listEntries, readEntryText, isZip } from './zip.js';

export class ExportError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Repair UTF-8 text that Meta exports as Latin-1 escaped bytes ("Ã¼" -> "ü"). */
export function fixMojibake(s) {
  if (typeof s !== 'string' || !/[\u00c0-\u00ff][\u0080-\u00bf]/.test(s)) return s;
  if (/[^\u0000-\u00ff]/.test(s)) return s;
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}

function findHref(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj.href === 'string') return obj.href;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const h = findHref(v);
      if (h) return h;
    }
  }
  return null;
}

function findTimestamp(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (Number.isFinite(obj.timestamp) && obj.timestamp > 0) return obj.timestamp;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const t = findTimestamp(v);
      if (t) return t;
    }
  }
  return null;
}

function entryData(entry) {
  if (entry.string_map_data) return entry.string_map_data;
  if (Array.isArray(entry.string_list_data)) return { list: entry.string_list_data };
  return entry;
}

function toItem(href, { creator, timestamp, collection }) {
  const parsed = parseInstagramUrl(href);
  if (!parsed.ok) return null;
  const c = fixMojibake(creator || '') || parsed.username;
  return {
    parsed,
    username: isValidUsername(c) ? c : parsed.username || null,
    savedAt: timestamp ? (timestamp < 1e12 ? timestamp * 1000 : timestamp) : null,
    collection: collection ? fixMojibake(collection) : null,
  };
}

/** saved_posts.json → items */
export function parseSavedPosts(json) {
  const list = Array.isArray(json?.saved_saved_media) ? json.saved_saved_media : Array.isArray(json) ? json : null;
  if (!list) return null;
  const items = [];
  for (const e of list) {
    const data = entryData(e);
    const href = findHref(data);
    if (!href) continue;
    const it = toItem(href, { creator: e.title, timestamp: findTimestamp(data) });
    if (it) items.push(it);
  }
  return items;
}

/**
 * saved_collections.json → items with collection names.
 * The file is a flat list: a collection header row (Name has a value but no
 * link) followed by the rows saved into that collection.
 */
export function parseSavedCollections(json) {
  const list = Array.isArray(json?.saved_saved_collections) ? json.saved_saved_collections : null;
  if (!list) return null;
  const items = [];
  let current = null;
  for (const e of list) {
    const data = entryData(e);
    const href = findHref(data);
    if (!href) {
      const name = data?.Name?.value ?? data?.name?.value ?? (typeof e.title === 'string' && e.title !== 'Collection' ? e.title : null);
      if (typeof name === 'string' && name.trim()) current = name.trim();
      continue;
    }
    const creator = data?.Name?.value || e.title || null;
    const it = toItem(href, { creator, timestamp: findTimestamp(data), collection: current });
    if (it) items.push(it);
  }
  return items;
}

/** Any JSON: collect every Instagram link (fallback for unknown shapes). */
export function parseAnyJson(json) {
  const items = [];
  const walk = (v) => {
    if (typeof v === 'string') {
      for (const p of extractInstagramUrls(v).found) items.push({ parsed: p, username: p.username, savedAt: null, collection: null });
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(json);
  return items;
}

export function parseHtml(text) {
  const items = [];
  const re = /href\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(text))) {
    const href = m[1].replace(/&amp;/g, '&');
    const it = toItem(href, {});
    if (it) items.push(it);
  }
  return items;
}

function parseText(name, text) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return parseHtml(text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // plain text list of links
    return extractInstagramUrls(text).found.map((p) => ({ parsed: p, username: p.username, savedAt: null, collection: null }));
  }
  if (/saved_collections/.test(lower)) return parseSavedCollections(json) || parseAnyJson(json);
  return parseSavedPosts(json) || parseSavedCollections(json) || parseAnyJson(json);
}

/** Merge items by key, preferring the earliest save time and any collection name. */
export function mergeItems(lists) {
  const map = new Map();
  for (const list of lists) {
    for (const it of list) {
      const k = it.parsed.key;
      const cur = map.get(k);
      if (!cur) {
        map.set(k, { ...it });
        continue;
      }
      if (!cur.username && it.username) cur.username = it.username;
      if (!cur.collection && it.collection) cur.collection = it.collection;
      if (it.savedAt && (!cur.savedAt || it.savedAt < cur.savedAt)) cur.savedAt = it.savedAt;
    }
  }
  return [...map.values()];
}

const IGNORE = (n) => n.includes('__MACOSX/') || /(^|\/)\._/.test(n) || n.endsWith('/');

/**
 * Read a user-selected file (ZIP, JSON, HTML or TXT).
 * @param {File|Blob} file
 * @returns {Promise<{items: Array, files: string[]}>}
 */
export async function readExportFile(file) {
  const name = file.name || 'file';
  if (await isZip(file)) {
    const entries = (await listEntries(file)).filter((e) => !IGNORE(e.name));
    let picked = entries.filter((e) => /(^|\/)saved_(posts|collections)\.(json|html)$/i.test(e.name));
    if (!picked.length) picked = entries.filter((e) => /saved/i.test(e.name) && /\.(json|html)$/i.test(e.name));
    if (!picked.length) throw new ExportError('no_saved_file');
    // Prefer JSON over HTML when both exist
    const hasJson = picked.some((e) => e.name.endsWith('.json'));
    if (hasJson) picked = picked.filter((e) => e.name.endsWith('.json'));
    const lists = [];
    for (const e of picked) lists.push(parseText(e.name, await readEntryText(file, e)));
    return { items: mergeItems(lists), files: picked.map((e) => e.name.split('/').pop()) };
  }
  const text = await file.text();
  return { items: mergeItems([parseText(name, text)]), files: [name] };
}
