/**
 * Instagram URL handling.
 *
 * Everything here is pure string work: no network requests are made.
 * We only understand public permalink formats and never touch cookies,
 * sessions or private endpoints.
 */

const HOSTS = new Set([
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
  'www.instagr.am',
]);

// Path keyword -> kind
const KIND_BY_SEGMENT = {
  reel: 'reel',
  reels: 'reel',
  p: 'post',
  tv: 'tv',
};

const CANONICAL_SEGMENT = { reel: 'reel', post: 'p', tv: 'tv' };

const SHORTCODE_RE = /^[A-Za-z0-9_-]{5,64}$/;
const USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;

/** Reserved first path segments that are never usernames. */
const RESERVED = new Set([
  'reel', 'reels', 'p', 'tv', 'share', 'stories', 'explore', 'accounts',
  'direct', 'about', 'legal', 'developer', 'web', 'api', 's',
]);

/**
 * Parse a single Instagram link.
 * @param {string} input
 * @returns {{ok:true, key:string, shortcode:string, kind:'reel'|'post'|'tv'|'share', url:string, username:string|null}
 *          | {ok:false, error:'empty'|'not_url'|'not_instagram'|'unsupported'}}
 */
export function parseInstagramUrl(input) {
  if (typeof input !== 'string') return { ok: false, error: 'empty' };
  let raw = input.trim();
  if (!raw) return { ok: false, error: 'empty' };

  // Strip surrounding punctuation that often comes with copied text
  raw = raw.replace(/^[<("'\[]+/, '').replace(/[>)"'\].,;!?]+$/, '');

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    if (/^(www\.|m\.)?(instagram\.com|instagr\.am)\//i.test(raw)) {
      raw = 'https://' + raw;
    } else {
      return { ok: false, error: 'not_url' };
    }
  }

  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, error: 'not_url' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, error: 'not_url' };

  const host = u.hostname.toLowerCase();
  if (!HOSTS.has(host)) return { ok: false, error: 'not_instagram' };

  const segs = u.pathname.split('/').filter(Boolean);
  if (segs.length === 0) return { ok: false, error: 'unsupported' };

  // Share links: /share/reel/<token>/ or /share/<token>/
  // These are opaque redirect tokens, not media shortcodes. We cannot resolve
  // them client-side (that would require a cross-origin request to Instagram),
  // so they are stored as-is and deduplicated by their token.
  if (segs[0].toLowerCase() === 'share') {
    const token = segs[1] && SHORTCODE_RE.test(segs[1]) && !KIND_BY_SEGMENT[segs[1].toLowerCase()]
      ? segs[1]
      : segs[2];
    if (!token || !SHORTCODE_RE.test(token)) return { ok: false, error: 'unsupported' };
    const sub = segs[1] && KIND_BY_SEGMENT[segs[1].toLowerCase()] ? segs[1].toLowerCase() + '/' : '';
    return {
      ok: true,
      key: 'share:' + token,
      shortcode: token,
      kind: 'share',
      url: `https://www.instagram.com/share/${sub}${token}/`,
      username: null,
    };
  }

  let username = null;
  let i = 0;
  const first = segs[0].toLowerCase();
  if (!KIND_BY_SEGMENT[first]) {
    // Possible /<username>/reel/<code>/ form
    if (!RESERVED.has(first) && USERNAME_RE.test(segs[0]) && segs[1] && KIND_BY_SEGMENT[segs[1].toLowerCase()]) {
      username = segs[0];
      i = 1;
    } else {
      return { ok: false, error: 'unsupported' };
    }
  }

  const kind = KIND_BY_SEGMENT[segs[i].toLowerCase()];
  const code = segs[i + 1];
  if (!code || !SHORTCODE_RE.test(code)) return { ok: false, error: 'unsupported' };

  return {
    ok: true,
    key: code,
    shortcode: code,
    kind,
    url: `https://www.instagram.com/${CANONICAL_SEGMENT[kind]}/${code}/`,
    username,
  };
}

const URL_IN_TEXT_RE = /(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/[^\s"'<>]+/gi;

/**
 * Find every Instagram link in a block of text.
 * Returns parsed results (deduplicated by key) and the raw strings that failed.
 */
export function extractInstagramUrls(text) {
  const found = [];
  const invalid = [];
  const seen = new Set();
  if (typeof text !== 'string' || !text) return { found, invalid };
  const matches = text.match(URL_IN_TEXT_RE) || [];
  for (const m of matches) {
    const r = parseInstagramUrl(m);
    if (r.ok) {
      if (!seen.has(r.key)) {
        seen.add(r.key);
        found.push(r);
      }
    } else {
      invalid.push(m);
    }
  }
  return { found, invalid };
}

/**
 * Split user input (one or many lines) into parse results.
 * Each non-empty line that contains no recognisable Instagram link is reported
 * as invalid so the user gets a precise error.
 */
export function parseUserInput(text) {
  const results = [];
  const seen = new Set();
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const { found } = extractInstagramUrls(line);
    if (found.length === 0) {
      results.push({ input: line, result: parseInstagramUrl(line) });
      continue;
    }
    for (const r of found) {
      if (seen.has(r.key)) continue;
      seen.add(r.key);
      results.push({ input: line, result: r });
    }
  }
  return results;
}

/**
 * Interpret a Web Share Target payload ({title, text, url}).
 *
 * Instagram's Android app typically shares only a link. Browsers sharing
 * instagram.com pages may add a page title such as
 *   `Name on Instagram: "caption text"`.
 * We only keep text that was actually shared; nothing is invented.
 */
export function parseSharePayload({ title = '', text = '', url = '' } = {}) {
  const all = [url, text, title].filter(Boolean).join('\n');
  const { found } = extractInstagramUrls(all);

  const strip = (s) => String(s || '').replace(URL_IN_TEXT_RE, '').replace(/\s+/g, ' ').trim();
  const cleanTitle = strip(title);
  const cleanText = strip(text);

  let creatorName = null;
  let caption = null;
  let sharedTitle = cleanTitle || null;

  const pattern = /^(.{1,80}?) on Instagram:\s*["“](.+)["”]\s*$/s;
  for (const candidate of [cleanTitle, cleanText]) {
    const m = candidate && candidate.match(pattern);
    if (m) {
      creatorName = m[1].trim();
      caption = m[2].trim();
      break;
    }
  }
  if (!caption && cleanText && cleanText !== cleanTitle) caption = cleanText;
  if (caption && sharedTitle && sharedTitle.includes(caption)) sharedTitle = null;

  // Handle that appears as "(@handle)" or a leading "@handle"
  let username = null;
  const handle = (cleanTitle + ' ' + cleanText).match(/\(@([A-Za-z0-9._]{1,30})\)|^@([A-Za-z0-9._]{1,30})\b/);
  if (handle) username = handle[1] || handle[2];

  return {
    links: found,
    title: sharedTitle,
    caption: caption || null,
    creatorName,
    username: username || (found[0] && found[0].username) || null,
  };
}

/** URL of Instagram's official embed page for a parsed link (or null). */
export function embedUrl(reel) {
  if (!reel || !reel.shortcode || reel.kind === 'share') return null;
  const seg = CANONICAL_SEGMENT[reel.kind] || 'reel';
  return `https://www.instagram.com/${seg}/${reel.shortcode}/embed/captioned/`;
}

/** Profile URL for a creator username (or null). */
export function profileUrl(username) {
  if (!username || !USERNAME_RE.test(username)) return null;
  return `https://www.instagram.com/${username}/`;
}

export function isValidUsername(u) {
  return typeof u === 'string' && USERNAME_RE.test(u);
}
