/**
 * Text normalisation shared by all classifiers.
 * Folds case and diacritics so "TARİF", "tarif" and "tarıf" compare equal,
 * and so English and Turkish keywords work side by side.
 */

const MAP = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ç': 'c', 'Ç': 'c', 'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u', 'ß': 'ss' };

export function fold(s) {
  if (s == null) return '';
  return String(s)
    .replace(/[ıİşŞğĞçÇöÖüÜß]/g, (c) => MAP[c])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Split folded text into word tokens (letters and digits). */
export function tokenize(s) {
  return fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Extract hashtags (folded, without '#') and also split camelCase tags. */
export function hashtags(s) {
  if (!s) return [];
  const out = [];
  const re = /#([\p{L}\p{N}_]+)/gu;
  let m;
  while ((m = re.exec(String(s)))) {
    const raw = m[1];
    out.push(fold(raw).replace(/_/g, ''));
    const parts = raw.split(/_|(?<=[\p{Ll}\p{N}])(?=\p{Lu})/u).filter(Boolean);
    if (parts.length > 1) for (const p of parts) out.push(fold(p));
  }
  return out;
}

/** Normalise a keyword/term the same way as text. */
export function normTerm(s) {
  return tokenize(s).join(' ');
}

/** Clean a user-entered keyword list: trims, folds duplicates, drops empties. */
export function cleanKeywords(list) {
  const seen = new Set();
  const out = [];
  for (const k of list || []) {
    const t = String(k).trim().replace(/^#/, '');
    if (!t) continue;
    const n = normTerm(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(t.slice(0, 60));
  }
  return out.slice(0, 200);
}
