/**
 * Application state and actions. Views read `state` and call actions;
 * every action persists to IndexedDB first, then updates memory and notifies.
 */
import * as repo from '../storage/repo.js';
import { classify, classifyLocal } from '../categorize/engine.js';
import { buildCreatorStats } from '../categorize/creator.js';
import { STARTERS } from '../categorize/starters.js';
import { parseUserInput, parseSharePayload, embedUrl } from '../instagram/url.js';
import { parseEmbedHtml } from '../instagram/embed.js';
import { httpPost, fetchEmbedPage, downloadImage, convertFileSrc } from './platform.js';
import { buildBackup, validateBackup, planMerge } from '../io/backup.js';
import { APP_VERSION } from '../version.js';

export const state = {
  ready: false,
  reels: [],
  categories: [],
  settings: structuredClone(repo.DEFAULT_SETTINGS),
};

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(reason) {
  for (const fn of listeners) fn(reason);
}

export async function load() {
  const [reels, categories, settings] = await Promise.all([repo.listReels(), repo.listCategories(), repo.getSettings()]);
  state.reels = reels;
  state.categories = categories;
  state.settings = settings;
  state.ready = true;
  emit('load');
}

/* ------------------------------ Lookups ---------------------------- */

export function categoryById(id) {
  return state.categories.find((c) => c.id === id) || null;
}

export function countsByCategory() {
  const m = new Map();
  for (const r of state.reels) m.set(r.categoryId || null, (m.get(r.categoryId || null) || 0) + 1);
  return m;
}

export function reviewQueue() {
  return state.reels.filter((r) => r.needsReview || !r.categoryId).sort((a, b) => b.addedAt - a.addedAt);
}

/**
 * Search + filter + sort.
 * @param {{q?:string, cat?:string|'none'|'review'|null, sort?:'new'|'old'}} f
 */
export function queryReels({ q = '', cat = null, sort = 'new' } = {}) {
  const fold = (s) =>
    String(s || '')
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i');
  const terms = fold(q).split(/\s+/).filter(Boolean);
  let list = state.reels;
  if (cat === 'none') list = list.filter((r) => !r.categoryId);
  else if (cat === 'review') list = list.filter((r) => r.needsReview || !r.categoryId);
  else if (cat) list = list.filter((r) => r.categoryId === cat);
  if (terms.length) {
    list = list.filter((r) => {
      const c = categoryById(r.categoryId);
      const hay = fold([r.caption, r.title, r.notes, r.username, r.creatorName, r.collection, r.shortcode, r.url, c && c.name].join(' '));
      return terms.every((t) => hay.includes(t));
    });
  }
  const time = (r) => r.addedAt;
  return [...list].sort((a, b) => (sort === 'old' ? time(a) - time(b) : time(b) - time(a)));
}

/* ---------------------------- Classification ----------------------- */

function creatorStats() {
  return buildCreatorStats(state.reels);
}

function applyResult(reel, result) {
  if (result.status === 'confident' && state.settings.autoAssign) {
    return {
      ...reel,
      categoryId: result.categoryId,
      categorySource: result.method,
      needsReview: false,
      suggestions: result.candidates.map((c) => c.id).filter((id) => id !== result.categoryId).slice(0, 3),
      reasons: result.candidates[0]?.reasons || [],
    };
  }
  return {
    ...reel,
    categoryId: null,
    categorySource: null,
    needsReview: true,
    suggestions: result.candidates.map((c) => c.id).slice(0, 4),
    reasons: result.candidates[0]?.reasons || [],
  };
}

async function classifyReel(reel, { useAi = true } = {}) {
  const ctx = { creatorStats: creatorStats() };
  if (useAi) {
    ctx.ai = state.settings.ai;
    ctx.post = httpPost;
    return classify(reel, state.categories, ctx);
  }
  return classifyLocal(reel, state.categories, ctx);
}

/* ------------------------------- Reels ----------------------------- */

/**
 * Add one or many reels from user input (manual form or share).
 * @returns {Promise<{added:object[], duplicates:object[], invalid:{input:string, error:string}[], results:Map, aiError?:string}>}
 */
export async function addFromText({ text, caption = '', title = '', notes = '', categoryId = null, source = 'manual', creatorName = null, username = null }) {
  const parsed = parseUserInput(text);
  const out = { added: [], duplicates: [], invalid: [], results: new Map(), aiError: null };
  for (const { input, result } of parsed) {
    if (!result.ok) {
      out.invalid.push({ input, error: result.error });
      continue;
    }
    const existing = state.reels.find((r) => r.key === result.key);
    if (existing) {
      out.duplicates.push(existing);
      continue;
    }
    let reel = {
      key: result.key,
      shortcode: result.shortcode,
      kind: result.kind,
      url: result.url,
      username: username || result.username,
      creatorName,
      caption: parsed.length === 1 ? caption : '',
      title: parsed.length === 1 ? title : '',
      notes: parsed.length === 1 ? notes : '',
      source,
    };
    if (categoryId && categoryById(categoryId)) {
      reel = { ...reel, categoryId, categorySource: 'manual', needsReview: false };
    } else {
      const res = await classifyReel(reel);
      if (res.aiError) out.aiError = res.aiError;
      out.results.set(result.key, res);
      reel = applyResult(reel, res);
    }
    const r = await repo.addReel(reel);
    if (r.status === 'duplicate') out.duplicates.push(r.reel);
    else {
      state.reels.push(r.reel);
      out.added.push(r.reel);
      refreshReelMeta(r.reel.id).catch(() => {}); // cover + creator info, in background
    }
  }
  if (out.added.length) emit('reels');
  return out;
}

/**
 * Fetch the public embed page for a reel and store cover, avatar, username
 * and caption locally. Only still-empty fields are filled — nothing the user
 * wrote is overwritten. Native only; a no-op in a browser.
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
export async function refreshReelMeta(id) {
  const reel = state.reels.find((r) => r.id === id);
  if (!reel || reel.kind === 'share') return { ok: false, reason: 'unsupported' };
  const page = embedUrl(reel);
  if (!page) return { ok: false, reason: 'unsupported' };
  const html = await fetchEmbedPage(page);
  const info = parseEmbedHtml(html);
  if (!info) return { ok: false, reason: 'fetch_failed' };
  const patch = {};
  if (info.username && !reel.username) patch.username = info.username;
  if (info.caption && !reel.caption) patch.caption = info.caption.slice(0, 5000);
  if (info.coverUrl) {
    const img = await downloadImage(info.coverUrl, `cover-${reel.key}.webp`, 480);
    if (img) {
      patch.thumbnailPath = img.path;
      const src = convertFileSrc(img.path);
      if (src) patch.thumbnailUrl = src;
    }
  }
  if (info.avatarUrl && info.username) {
    const av = await downloadImage(info.avatarUrl, `avatar-${info.username}.webp`, 144);
    if (av) {
      patch.avatarPath = av.path;
      const src = convertFileSrc(av.path);
      if (src) patch.avatarUrl = src;
    }
  }
  if (Object.keys(patch).length) await updateReel(id, patch);
  return { ok: true };
}

/**
 * Backfill covers/creator info for reels that do not have them yet.
 * @returns {Promise<{total:number, ok:number, fail:number}>}
 */
export async function refreshAllReels() {
  const targets = state.reels.filter((r) => !r.thumbnailPath && r.kind !== 'share');
  let ok = 0;
  let fail = 0;
  for (const r of targets) {
    const res = await refreshReelMeta(r.id).catch(() => ({ ok: false }));
    if (res.ok) ok++;
    else fail++;
  }
  return { total: targets.length, ok, fail };
}

/** Handle a Share-to-app payload. */
export async function addFromShare(payload) {
  const info = parseSharePayload(payload);
  if (!info.links.length) {
    return { added: [], duplicates: [], invalid: [{ input: [payload.title, payload.text, payload.url].filter(Boolean).join(' '), error: 'no_link' }], results: new Map(), info };
  }
  const res = await addFromText({
    text: info.links.map((l) => l.url).join('\n'),
    caption: info.caption || '',
    title: info.title || '',
    creatorName: info.creatorName,
    username: info.username,
    source: 'share',
  });
  return { ...res, info };
}

export async function updateReel(id, patch) {
  const next = await repo.updateReel(id, patch);
  const i = state.reels.findIndex((r) => r.id === id);
  if (i >= 0) state.reels[i] = next;
  emit('reels');
  return next;
}

/** Manually file a reel (or clear its category with null). */
export function assignCategory(id, categoryId) {
  return updateReel(id, {
    categoryId: categoryId || null,
    categorySource: categoryId ? 'manual' : null,
    needsReview: !categoryId,
  });
}

export async function deleteReel(id) {
  await repo.deleteReel(id);
  state.reels = state.reels.filter((r) => r.id !== id);
  emit('reels');
}

export async function restoreReel(reel) {
  const r = await repo.addReel(reel);
  if (r.status === 'added') state.reels.push(r.reel);
  emit('reels');
}

/**
 * Re-run classification for reels waiting for a category.
 * Manually filed reels are never touched.
 */
export async function recheckUnsorted({ useAi = true } = {}) {
  let assigned = 0;
  let aiError = null;
  for (const r of reviewQueue()) {
    if (r.categorySource === 'manual' && r.categoryId) continue;
    const res = await classifyReel(r, { useAi });
    if (res.aiError) aiError = res.aiError;
    const next = applyResult(r, res);
    const saved = await repo.updateReel(r.id, next);
    const i = state.reels.findIndex((x) => x.id === r.id);
    if (i >= 0) state.reels[i] = saved;
    if (saved.categoryId) assigned++;
  }
  emit('reels');
  return { assigned, aiError };
}

/** Local-only preview of what the classifier thinks (used by the Add form). */
export function previewClassification(reel) {
  return classifyLocal(reel, state.categories, { creatorStats: creatorStats() });
}

/* ----------------------------- Categories -------------------------- */

export async function createCategory(data) {
  const c = await repo.createCategory(data);
  state.categories.push(c);
  emit('categories');
  return c;
}

export async function updateCategory(id, patch) {
  const c = await repo.updateCategory(id, patch);
  const i = state.categories.findIndex((x) => x.id === id);
  if (i >= 0) state.categories[i] = c;
  emit('categories');
  return c;
}

export async function deleteCategory(id) {
  await repo.deleteCategory(id);
  state.categories = state.categories.filter((c) => c.id !== id);
  state.reels = await repo.listReels();
  emit('categories');
}

export async function addStarters(keys, lang) {
  const created = [];
  for (const s of STARTERS.filter((x) => keys.includes(x.key))) {
    const name = s.name[lang] || s.name.en;
    try {
      created.push(await repo.createCategory({ name, color: s.color, keywords: s.keywords }));
    } catch (e) {
      if (e.code !== 'duplicate_name') throw e;
    }
  }
  state.categories = await repo.listCategories();
  emit('categories');
  return created;
}

/* ------------------------------ Settings --------------------------- */

export async function setSetting(key, value) {
  await repo.setSetting(key, value);
  state.settings = { ...state.settings, [key]: value };
  emit('settings');
}

/* ------------------------- Instagram export ------------------------ */

/**
 * Import items parsed from an Instagram data export.
 * @param {Array} items from readExportFile
 * @param {{includePosts:boolean, collectionsAsCategories:boolean}} opts
 */
export async function importExportItems(items, { includePosts = true, collectionsAsCategories = true } = {}) {
  const selected = items.filter((it) => includePosts || it.parsed.kind === 'reel');
  // Optionally create categories for collection names that don't exist yet
  if (collectionsAsCategories) {
    const names = [...new Set(selected.map((i) => i.collection).filter(Boolean))];
    for (const name of names) {
      const preview = classifyLocal({ collection: name }, state.categories, {});
      if (preview.candidates.some((c) => c.sources.includes('collection'))) continue;
      try {
        state.categories.push(await repo.createCategory({ name, keywords: [] }));
      } catch (e) {
        if (e.code !== 'duplicate_name') throw e;
      }
    }
  }
  const existingKeys = new Set(state.reels.map((r) => r.key));
  const toAdd = [];
  let duplicates = 0;
  const stats = creatorStats();
  for (const it of selected) {
    if (existingKeys.has(it.parsed.key)) {
      duplicates++;
      continue;
    }
    existingKeys.add(it.parsed.key);
    const base = {
      key: it.parsed.key,
      shortcode: it.parsed.shortcode,
      kind: it.parsed.kind,
      url: it.parsed.url,
      username: it.username,
      collection: it.collection,
      savedAt: it.savedAt,
      source: 'export',
    };
    // Local classifiers only for bulk imports (no per-item network calls)
    toAdd.push(applyResult(base, classifyLocal(base, state.categories, { creatorStats: stats })));
  }
  const { added, duplicates: dup2 } = await repo.addReels(toAdd);
  state.reels.push(...added);
  state.categories = await repo.listCategories();
  emit('reels');
  return {
    added: added.length,
    duplicates: duplicates + dup2.length,
    assigned: added.filter((r) => r.categoryId).length,
    skippedPosts: items.length - selected.length,
  };
}

/* ------------------------------- Backup ---------------------------- */

export function makeBackup() {
  return buildBackup({ reels: state.reels, categories: state.categories, settings: state.settings, version: APP_VERSION });
}

/**
 * Restore a backup.
 * @param {object} data parsed JSON
 * @param {'merge'|'replace'} mode
 */
export async function restoreBackup(data, mode = 'merge') {
  const incoming = validateBackup(data);
  if (mode === 'replace') {
    const keepAi = state.settings.ai;
    await repo.clearAll({ keepSettings: true });
    for (const c of incoming.categories) await repo.createCategory(c).catch(() => null);
    const cats = await repo.listCategories();
    const ids = new Set(cats.map((c) => c.id));
    const reels = incoming.reels.map((r) => (r.categoryId && !ids.has(r.categoryId) ? { ...r, categoryId: null, categorySource: null, needsReview: true } : r));
    const { added } = await repo.addReels(reels);
    if (incoming.settings) {
      for (const k of ['lang', 'theme', 'autoAssign', 'embedPreview']) {
        if (incoming.settings[k] !== undefined) await repo.setSetting(k, incoming.settings[k]);
      }
      if (incoming.settings.ai) await repo.setSetting('ai', { ...incoming.settings.ai, apiKey: keepAi.apiKey || '' });
    }
    await load();
    return { mode, categories: cats.length, reels: added.length, duplicates: 0, skipped: incoming.skipped };
  }
  const plan = planMerge({ reels: state.reels, categories: state.categories }, incoming);
  for (const c of plan.newCategories) await repo.createCategory(c).catch(() => null);
  const { added, duplicates } = await repo.addReels(plan.newReels);
  await load();
  return { mode, categories: plan.newCategories.length, reels: added.length, duplicates: plan.duplicates + duplicates.length, skipped: incoming.skipped };
}

export async function wipeAll() {
  await repo.clearAll({ keepSettings: false });
  await load();
}
