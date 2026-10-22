/**
 * Data access layer for reels, categories and settings.
 */
import { tx, req, getAll, get, put } from './db.js';
import { fold, cleanKeywords } from '../categorize/normalize.js';
import { CATEGORY_COLORS } from '../categorize/starters.js';

export const DEFAULT_SETTINGS = {
  lang: null, // null = follow device
  theme: 'system',
  autoAssign: true,
  embedPreview: false,
  onboarded: false,
  ai: { enabled: false, preset: 'openai', kind: 'openai', baseUrl: 'https://api.openai.com/v1', model: '', apiKey: '' },
};

export function uid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/* ------------------------------ Reels ------------------------------ */

const REEL_FIELDS = [
  'id', 'key', 'shortcode', 'kind', 'url', 'username', 'creatorName', 'caption', 'title', 'collection', 'notes',
  'thumbnailUrl', 'thumbnailPath', 'avatarUrl', 'avatarPath', 'tags', 'categoryId', 'categorySource', 'needsReview', 'suggestions', 'reasons', 'source', 'savedAt',
  'addedAt', 'updatedAt',
];

/** Normalise a reel object to the stored shape (unknown fields dropped). */
export function shapeReel(r) {
  const now = Date.now();
  const str = (v, max = 5000) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const out = {
    id: r.id || uid(),
    key: r.key,
    shortcode: r.shortcode,
    kind: ['reel', 'post', 'tv', 'share'].includes(r.kind) ? r.kind : 'reel',
    url: r.url,
    username: str(r.username, 30),
    creatorName: str(r.creatorName, 120),
    caption: str(r.caption, 5000),
    title: str(r.title, 500),
    collection: str(r.collection, 120),
    notes: typeof r.notes === 'string' ? r.notes.slice(0, 5000) : '',
    thumbnailUrl: typeof r.thumbnailUrl === 'string' && /^(https:|data:image\/)/.test(r.thumbnailUrl) ? r.thumbnailUrl : null,
    thumbnailPath: str(r.thumbnailPath, 300),
    avatarUrl: typeof r.avatarUrl === 'string' && /^(https:|data:image\/)/.test(r.avatarUrl) ? r.avatarUrl : null,
    avatarPath: str(r.avatarPath, 300),
    tags: Array.isArray(r.tags) ? [...new Set(r.tags.map((x) => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 24) : [],
    categoryId: r.categoryId || null,
    categorySource: r.categorySource || null,
    needsReview: Boolean(r.needsReview),
    suggestions: Array.isArray(r.suggestions) ? r.suggestions.slice(0, 4) : [],
    reasons: Array.isArray(r.reasons) ? r.reasons.slice(0, 8).map(String) : [],
    source: r.source || 'manual',
    savedAt: Number.isFinite(r.savedAt) ? r.savedAt : null,
    addedAt: Number.isFinite(r.addedAt) ? r.addedAt : now,
    updatedAt: Number.isFinite(r.updatedAt) ? r.updatedAt : now,
  };
  return out;
}

export function listReels() {
  return getAll('reels');
}

export function getReel(id) {
  return get('reels', id);
}

export function findReelByKey(key) {
  return tx(['reels'], 'readonly', (s) => req(s.reels.index('key').get(key)));
}

/**
 * Insert a reel unless one with the same key exists.
 * @returns {Promise<{status:'added'|'duplicate', reel:object}>}
 */
export async function addReel(data) {
  const reel = shapeReel(data);
  if (!reel.key || !reel.url) throw new Error('Reel needs key and url');
  return tx(['reels'], 'readwrite', async (s) => {
    const existing = await req(s.reels.index('key').get(reel.key));
    if (existing) return { status: 'duplicate', reel: existing };
    await req(s.reels.add(reel));
    return { status: 'added', reel };
  });
}

/** Insert many reels in one transaction; duplicates are skipped. */
export async function addReels(list) {
  return tx(['reels'], 'readwrite', async (s) => {
    const added = [];
    const duplicates = [];
    for (const data of list) {
      const reel = shapeReel(data);
      const existing = await req(s.reels.index('key').get(reel.key));
      if (existing) {
        duplicates.push(existing);
        continue;
      }
      await req(s.reels.add(reel));
      added.push(reel);
    }
    return { added, duplicates };
  });
}

export async function updateReel(id, patch) {
  return tx(['reels'], 'readwrite', async (s) => {
    const cur = await req(s.reels.get(id));
    if (!cur) throw new Error('Reel not found');
    const next = shapeReel({ ...cur, ...patch, id: cur.id, key: cur.key, addedAt: cur.addedAt, updatedAt: Date.now() });
    await req(s.reels.put(next));
    return next;
  });
}

export async function deleteReel(id) {
  return tx(['reels'], 'readwrite', (s) => req(s.reels.delete(id)));
}

/* ---------------------------- Categories --------------------------- */

export class CategoryError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function shapeCategory(c, index = 0) {
  const now = Date.now();
  return {
    id: c.id || uid(),
    name: String(c.name || '').trim().slice(0, 40),
    color: CATEGORY_COLORS.includes(c.color) ? c.color : CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    keywords: cleanKeywords(c.keywords),
    order: Number.isFinite(c.order) ? c.order : now,
    createdAt: Number.isFinite(c.createdAt) ? c.createdAt : now,
    updatedAt: now,
  };
}

export async function listCategories() {
  const all = await getAll('categories');
  return all.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function assertName(name, all, selfId) {
  const n = fold(String(name || '').trim());
  if (!n) throw new CategoryError('empty_name');
  if (all.some((c) => c.id !== selfId && fold(c.name) === n)) throw new CategoryError('duplicate_name');
}

export async function createCategory(data) {
  return tx(['categories'], 'readwrite', async (s) => {
    const all = await req(s.categories.getAll());
    assertName(data.name, all);
    const cat = shapeCategory({ ...data, order: data.order ?? Date.now() + all.length }, all.length);
    await req(s.categories.add(cat));
    return cat;
  });
}

export async function updateCategory(id, patch) {
  return tx(['categories'], 'readwrite', async (s) => {
    const all = await req(s.categories.getAll());
    const cur = all.find((c) => c.id === id);
    if (!cur) throw new CategoryError('not_found');
    if (patch.name !== undefined) assertName(patch.name, all, id);
    const next = shapeCategory({ ...cur, ...patch, id, createdAt: cur.createdAt, order: cur.order });
    await req(s.categories.put(next));
    return next;
  });
}

/** Delete a category; its reels become uncategorised and are queued for review. */
export async function deleteCategory(id) {
  return tx(['categories', 'reels'], 'readwrite', async (s) => {
    await req(s.categories.delete(id));
    const reels = await req(s.reels.index('categoryId').getAll(id));
    for (const r of reels) {
      r.categoryId = null;
      r.categorySource = null;
      r.needsReview = true;
      r.suggestions = (r.suggestions || []).filter((x) => x !== id);
      r.updatedAt = Date.now();
      await req(s.reels.put(r));
    }
    return reels.length;
  });
}

/* ----------------------------- Settings ---------------------------- */

export async function getSettings() {
  const rows = await getAll('settings');
  const out = structuredClone(DEFAULT_SETTINGS);
  for (const { key, value } of rows) {
    if (key === 'ai') out.ai = { ...DEFAULT_SETTINGS.ai, ...(value || {}) };
    else out[key] = value;
  }
  return out;
}

export function setSetting(key, value) {
  return put('settings', { key, value });
}

/* ------------------------------ Bulk ------------------------------- */

export async function clearAll({ keepSettings = false } = {}) {
  const stores = keepSettings ? ['reels', 'categories'] : ['reels', 'categories', 'settings'];
  return tx(stores, 'readwrite', async (s) => {
    for (const n of stores) await req(s[n].clear());
  });
}
