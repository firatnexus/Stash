/**
 * Creator-history classifier.
 *
 * Learns only from the user's own manual choices: if you filed three reels
 * from @chef_ayse under "Recipes", the next reel from @chef_ayse is suggested
 * for "Recipes" as well. Nothing is sent anywhere.
 */

/**
 * Build {username -> {categoryId -> count}} from reels the user filed manually.
 * @param {Array} reels
 */
export function buildCreatorStats(reels) {
  const stats = new Map();
  for (const r of reels) {
    if (!r.username || !r.categoryId || r.categorySource !== 'manual') continue;
    const u = r.username.toLowerCase();
    if (!stats.has(u)) stats.set(u, new Map());
    const m = stats.get(u);
    m.set(r.categoryId, (m.get(r.categoryId) || 0) + 1);
  }
  return stats;
}

/**
 * @returns {Array<{id, score, reasons}>}
 */
export function creatorScores(reel, stats, validIds) {
  if (!reel.username || !stats) return [];
  const m = stats.get(reel.username.toLowerCase());
  if (!m) return [];
  let total = 0;
  for (const [id, c] of m) if (validIds.has(id)) total += c;
  if (!total) return [];
  const out = [];
  for (const [id, c] of m) {
    if (!validIds.has(id)) continue;
    // up to 2.0 when the creator is consistently filed in one place (>= 2 times)
    const score = 2 * (c / total) * Math.min(1, total / 2);
    out.push({ id, score: Math.round(score * 100) / 100, reasons: ['@' + reel.username] });
  }
  return out.sort((a, b) => b.score - a.score);
}
