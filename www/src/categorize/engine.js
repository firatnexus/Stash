/**
 * Categorisation engine: combines independent classifiers.
 *
 *   1. Keyword classifier  (category names + user keywords vs. available text)
 *   2. Collection signal   (Instagram collection name from a data export)
 *   3. Creator history     (how the user filed this creator before)
 *   4. Optional AI provider (only if configured, only when 1-3 are unsure)
 *
 * The result is "confident" (auto-assign), "uncertain" (ask the user, with
 * suggestions) or "none" (ask the user, no suggestion).
 */
import { keywordScores, collectionScores, reelText, round } from './keyword.js';
import { creatorScores } from './creator.js';
import { aiSuggest, isAiConfigured } from './ai.js';

export const THRESHOLD = 1; // minimum score for an automatic assignment (one exact keyword)
export const MARGIN = 2; // best must be at least MARGIN x the runner-up

function merge(lists) {
  const map = new Map();
  for (const [source, list] of lists) {
    for (const s of list) {
      if (!map.has(s.id)) map.set(s.id, { id: s.id, score: 0, reasons: [], sources: [] });
      const e = map.get(s.id);
      e.score = round(e.score + s.score);
      for (const r of s.reasons) if (!e.reasons.includes(r)) e.reasons.push(r);
      if (!e.sources.includes(source)) e.sources.push(source);
    }
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}

/**
 * Synchronous local classification (no network).
 */
export function classifyLocal(reel, categories, { creatorStats } = {}) {
  if (!categories.length) {
    return { status: 'none', categoryId: null, method: null, candidates: [], hasText: reelText(reel).hasText };
  }
  const validIds = new Set(categories.map((c) => c.id));
  const candidates = merge([
    ['keyword', keywordScores(reel, categories)],
    ['collection', collectionScores(reel.collection, categories)],
    ['creator', creatorScores(reel, creatorStats, validIds)],
  ]);
  const hasText = reelText(reel).hasText;
  if (!candidates.length) return { status: 'none', categoryId: null, method: null, candidates, hasText };

  const [best, second] = candidates;
  const confident = best.score >= THRESHOLD && (!second || best.score >= MARGIN * second.score);
  return {
    status: confident ? 'confident' : 'uncertain',
    categoryId: confident ? best.id : null,
    method: confident ? best.sources[0] : null,
    candidates: candidates.slice(0, 4),
    hasText,
  };
}

/**
 * Full classification including the optional AI provider.
 * Never throws: AI failures are reported in `aiError` and the local result stands.
 * The AI may also SUGGEST tags and a new category name (aiTags/aiNewCategory);
 * those are never auto-applied — the user confirms them.
 */
export async function classify(reel, categories, { creatorStats, ai, post } = {}) {
  const local = classifyLocal(reel, categories, { creatorStats });
  if (local.status === 'confident' || !categories.length) return local;
  if (!isAiConfigured(ai) || !post || !local.hasText) return local;

  try {
    const r = await aiSuggest(reel, categories, ai, post);
    if (r && (r.categoryIds.length || r.tags.length || r.newCategory)) {
      const aiCand = r.categoryIds.map((id) => ({ id, score: round(r.confidence * 3), reasons: ['AI'], sources: ['ai'] }));
      const others = local.candidates.filter((c) => !r.categoryIds.includes(c.id));
      const candidates = [...aiCand, ...others].slice(0, 4);
      const extra = { aiTags: r.tags, aiNewCategory: r.newCategory, aiConfidence: r.confidence };
      // AI results are never auto-applied: even a high-confidence category is
      // only a suggestion — the pick sheet always asks the user to confirm.
      return { ...local, candidates, ...extra };
    }
    return local;
  } catch (e) {
    const err = { ...local, aiError: e.message || String(e) };
    if (e && e.status) err.aiErrorStatus = e.status;
    return err;
  }
}
