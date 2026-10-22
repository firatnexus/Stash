/**
 * Instagram embed page metadata (public, no login).
 *
 * The detail view already renders Instagram's official embed page in an
 * iframe. That same page server-renders a public JSON blob ("contextJSON")
 * containing the cover image, the sharer's username, their avatar and the
 * caption. This module parses it. No cookies, sessions or private endpoints
 * are involved — it is the same public data the preview iframe displays.
 */

/** Read a JSON string literal starting at the opening quote `openQuoteIdx`. */
function readJsonStringAt(s, openQuoteIdx) {
  const parts = [];
  let i = openQuoteIdx + 1;
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      // Escaped? Count the backslashes directly before the quote.
      let bs = 0;
      let j = i - 1;
      while (j >= 0 && s[j] === '\\') {
        bs++;
        j--;
      }
      if (bs % 2 === 0) break; // real closing quote
      parts.push('"');
      i++;
      continue;
    }
    if (c === '\\') {
      const next = s[i + 1];
      if (next === '"' || next === '\\') {
        parts.push(next);
        i += 2;
        continue;
      }
      if (next === 'n') { parts.push('\n'); i += 2; continue; }
      if (next === 'r') { parts.push('\r'); i += 2; continue; }
      if (next === 't') { parts.push('\t'); i += 2; continue; }
      if (next === 'u') {
        const hex = s.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          parts.push(String.fromCharCode(parseInt(hex, 16)));
          i += 6;
          continue;
        }
      }
      parts.push(next ?? '');
      i += 2;
      continue;
    }
    parts.push(c);
    i++;
  }
  return { value: parts.join(''), end: i };
}

const MARKER = '"contextJSON":"';

/**
 * Extract the public embed metadata from an Instagram embed page HTML.
 * @returns {{username:string|null, avatarUrl:string|null, coverUrl:string|null,
 *            caption:string|null, isVideo:boolean, shortcode:string|null}|null}
 */
export function parseEmbedHtml(html) {
  if (typeof html !== 'string' || !html) return null;
  const i = html.indexOf(MARKER);
  if (i < 0) return null;
  const { value } = readJsonStringAt(html, i + MARKER.length - 1);
  if (!value) return null;
  let ctx;
  try {
    ctx = JSON.parse(value);
  } catch {
    return null;
  }
  const sm = ctx && ctx.gql_data && ctx.gql_data.shortcode_media;
  if (!sm || typeof sm !== 'object') return null;
  const owner = sm.owner || {};
  const capEdge = sm.edge_media_to_caption && sm.edge_media_to_caption.edges && sm.edge_media_to_caption.edges[0];
  const str = (v) => (typeof v === 'string' && v ? v : null);
  return {
    shortcode: str(sm.shortcode),
    username: str(owner.username),
    avatarUrl: str(owner.profile_pic_url),
    coverUrl: str(sm.display_url),
    caption: capEdge && capEdge.node ? str(capEdge.node.text) : null,
    isVideo: Boolean(sm.is_video),
  };
}
