/**
 * Full-app backup (export / restore) as a single JSON document.
 * The AI API key is never included in a backup.
 */
import { shapeReel, shapeCategory } from '../storage/repo.js';
import { parseInstagramUrl } from '../instagram/url.js';
import { fold } from '../categorize/normalize.js';

export const BACKUP_APP = 'stash';
/** Backups written before 1.2.2 (Reels Organizer) are still accepted. */
export const LEGACY_BACKUP_APPS = ['reels-organizer'];
export const BACKUP_SCHEMA = 1;

export class BackupError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function buildBackup({ reels, categories, settings, version }) {
  const safeSettings = { ...settings };
  if (safeSettings.ai) safeSettings.ai = { ...safeSettings.ai, apiKey: '' };
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA,
    appVersion: version,
    exportedAt: new Date().toISOString(),
    counts: { reels: reels.length, categories: categories.length },
    categories,
    reels,
    settings: safeSettings,
  };
}

export function backupFileName(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `stash-backup-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

/** Validate and normalise a parsed backup. Throws BackupError. */
export function validateBackup(data) {
  if (!data || typeof data !== 'object') throw new BackupError('invalid');
  if (data.app !== BACKUP_APP && !LEGACY_BACKUP_APPS.includes(data.app)) throw new BackupError('wrong_app');
  if (!Number.isInteger(data.schemaVersion) || data.schemaVersion > BACKUP_SCHEMA) throw new BackupError('newer_schema');
  if (!Array.isArray(data.reels) || !Array.isArray(data.categories)) throw new BackupError('invalid');

  const categories = [];
  const catIds = new Set();
  data.categories.forEach((c, i) => {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) return;
    const sc = shapeCategory(c, i);
    if (catIds.has(sc.id)) return;
    catIds.add(sc.id);
    categories.push(sc);
  });

  const reels = [];
  const keys = new Set();
  let skipped = 0;
  for (const r of data.reels) {
    const parsed = r && typeof r.url === 'string' ? parseInstagramUrl(r.url) : { ok: false };
    if (!parsed.ok || keys.has(parsed.key)) {
      skipped++;
      continue;
    }
    keys.add(parsed.key);
    const shaped = shapeReel({
      ...r,
      key: parsed.key,
      shortcode: parsed.shortcode,
      kind: parsed.kind,
      url: parsed.url,
      source: r.source || 'backup',
    });
    if (shaped.categoryId && !catIds.has(shaped.categoryId)) {
      shaped.categoryId = null;
      shaped.categorySource = null;
      shaped.needsReview = true;
    }
    reels.push(shaped);
  }
  return { categories, reels, settings: data.settings && typeof data.settings === 'object' ? data.settings : null, skipped };
}

/**
 * Plan a merge of a validated backup into the current data.
 * Categories with the same id or the same (folded) name are reused.
 * Reels already in the library (same key) are skipped.
 */
export function planMerge(current, incoming) {
  const idMap = new Map();
  const byName = new Map(current.categories.map((c) => [fold(c.name), c]));
  const byId = new Map(current.categories.map((c) => [c.id, c]));
  const newCategories = [];
  for (const c of incoming.categories) {
    const hit = byId.get(c.id) || byName.get(fold(c.name));
    if (hit) idMap.set(c.id, hit.id);
    else {
      newCategories.push(c);
      idMap.set(c.id, c.id);
      byName.set(fold(c.name), c);
    }
  }
  const existingKeys = new Set(current.reels.map((r) => r.key));
  const existingIds = new Set(current.reels.map((r) => r.id));
  const newReels = [];
  let duplicates = 0;
  for (const r of incoming.reels) {
    if (existingKeys.has(r.key)) {
      duplicates++;
      continue;
    }
    const copy = { ...r, categoryId: r.categoryId ? idMap.get(r.categoryId) || null : null };
    if (existingIds.has(copy.id)) copy.id = undefined; // shapeReel assigns a new id
    newReels.push(shapeReel(copy));
  }
  return { newCategories, newReels, duplicates };
}
