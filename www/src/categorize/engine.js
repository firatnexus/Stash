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
import { aiClassify, isAiConfigured } from './ai.js';

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
 */
export async function classify(reel, categories, { creatorStats, ai, post } = {}) {
  const local = classifyLocal(reel, categories, { creatorStats });
  if (local.status === 'confident' || !categories.length) return local;
  if (!isAiConfigured(ai) || !post || !local.hasText) return local;

  try {
    const r = await aiClassify(reel, categories, ai, post);
    if (r && r.id) {
      const others = local.candidates.filter((c) => c.id !== r.id);
      const aiCand = { id: r.id, score: round(r.confidence * 3), reasons: ['AI'], sources: ['ai'] };
      if (r.confidence >= 0.6) {
        return { status: 'confident', categoryId: r.id, method: 'ai', candidates: [aiCand, ...others].slice(0, 4), hasText: true, aiConfidence: r.confidence };
      }
      return { ...local, candidates: [aiCand, ...others].slice(0, 4), aiConfidence: r.confidence };
    }
    return local;
  } catch (e) {
    return { ...local, aiError: e.message || String(e) };
  }
}
