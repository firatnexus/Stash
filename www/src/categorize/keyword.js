/**
 * Keyword classifier.
 *
 * Scores each category by how many of its terms (its name plus its keywords)
 * appear in the reel's available text. Matching is diacritic-insensitive and
 * tolerant of suffixes ("recipe" matches "recipes", "tarif" matches "tarifleri").
 */
import { fold, tokenize, hashtags, normTerm } from './normalize.js';

const W = {
  name: 1.5, // the category name itself is a strong signal
  keyword: 1,
  hashtag: 1.5, // multiplier when the match is a hashtag
  phrase: 1.2, // multi-word keyword found verbatim
  prefix: 0.8, // keyword is a prefix of a word (suffix tolerance)
};

/** Build the searchable text bundle for a reel from REAL fields only. */
export function reelText(reel) {
  const parts = {
    caption: reel.caption || '',
    title: reel.title || '',
    notes: reel.notes || '',
    creator: [reel.username, reel.creatorName].filter(Boolean).join(' '),
  };
  const body = [parts.caption, parts.title, parts.notes].join('\n');
  return {
    ...parts,
    hasText: Boolean(body.trim()),
    tokens: new Set(tokenize(body + ' ' + parts.creator.replace(/[._]/g, ' '))),
    tags: new Set(hashtags(body)),
    folded: ' ' + tokenize(body).join(' ') + ' ',
  };
}

function matchTerm(term, bundle) {
  const t = normTerm(term);
  if (!t || t.length < 2) return null;
  if (t.includes(' ')) {
    if (bundle.folded.includes(' ' + t + ' ')) return { score: W.phrase, how: 'phrase' };
    const joined = t.replace(/ /g, '');
    if (bundle.tags.has(joined)) return { score: W.phrase * W.hashtag, how: 'hashtag' };
    return null;
  }
  if (bundle.tags.has(t)) return { score: W.hashtag, how: 'hashtag' };
  if (bundle.tokens.has(t)) return { score: 1, how: 'word' };
  if (t.length >= 4) {
    for (const tok of bundle.tokens) {
      if (tok.length > t.length && tok.startsWith(t)) return { score: W.prefix, how: 'prefix' };
    }
    for (const tag of bundle.tags) {
      if (tag.length > t.length && tag.includes(t)) return { score: W.prefix, how: 'hashtag' };
    }
  }
  return null;
}

/**
 * @param {object} reel
 * @param {Array<{id:string,name:string,keywords:string[]}>} categories
 * @returns {Array<{id:string, score:number, reasons:string[]}>} sorted desc, only score>0
 */
export function keywordScores(reel, categories) {
  const bundle = reelText(reel);
  const out = [];
  for (const cat of categories) {
    let score = 0;
    const reasons = [];
    const seen = new Set();
    const terms = [{ t: cat.name, w: W.name }, ...(cat.keywords || []).map((k) => ({ t: k, w: W.keyword }))];
    for (const { t, w } of terms) {
      const key = normTerm(t);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const m = matchTerm(t, bundle);
      if (m) {
        score += m.score * w;
        reasons.push(m.how === 'hashtag' ? '#' + String(t).replace(/^#/, '') : String(t));
      }
    }
    if (score > 0) out.push({ id: cat.id, score: round(score), reasons });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Score categories whose name/keywords match an Instagram collection name. */
export function collectionScores(collectionName, categories) {
  if (!collectionName) return [];
  const c = normTerm(collectionName);
  if (!c) return [];
  const out = [];
  for (const cat of categories) {
    const terms = [cat.name, ...(cat.keywords || [])].map(normTerm).filter(Boolean);
    if (terms.includes(c)) out.push({ id: cat.id, score: 3, reasons: [`“${collectionName}”`] });
  }
  return out;
}

export function round(n) {
  return Math.round(n * 100) / 100;
}

export { fold };
