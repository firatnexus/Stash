import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEmbedHtml } from '../../www/src/instagram/embed.js';

/** Build a realistic embed page: contextJSON is a JSON string inside the HTML. */
function embedPage(ctx) {
  const inner = JSON.stringify(ctx);
  // The real page escapes the inner JSON as a JS string; \uXXXX stays single-escaped.
  const escaped = JSON.stringify(inner).replace(/\\\\u/g, '\\u');
  return `<html><body><script type="application/json" id="js">{"contextJSON":${escaped}}</script></body></html>`;
}

const CTX = {
  context: { type: 'GraphVideo', shortcode: 'DWDMxBiEcnP', copyright_blocked: false },
  gql_data: {
    shortcode_media: {
      __typename: 'GraphVideo',
      id: '3855981851417102799',
      shortcode: 'DWDMxBiEcnP',
      is_video: true,
      display_url: 'https://scontent-iad3-1.cdninstagram.com/v/t51.71878-15/653472605_n.jpg?stp=dst-jpg',
      owner: {
        id: '123',
        username: 'dilbar_._kumar',
        profile_pic_url: 'https://scontent-iad3-1.cdninstagram.com/v/t51.82787-19/841815585_n.jpg',
        is_verified: false,
      },
      edge_media_to_caption: { edges: [{ node: { text: 'To get a working link, follow these steps.\nSecond line.' } }] },
    },
  },
};

test('parses cover, username, avatar and caption from an embed page', () => {
  const info = parseEmbedHtml(embedPage(CTX));
  assert.equal(info.username, 'dilbar_._kumar');
  assert.equal(info.coverUrl, CTX.gql_data.shortcode_media.display_url);
  assert.equal(info.avatarUrl, CTX.gql_data.shortcode_media.owner.profile_pic_url);
  assert.equal(info.caption, 'To get a working link, follow these steps.\nSecond line.');
  assert.equal(info.isVideo, true);
  assert.equal(info.shortcode, 'DWDMxBiEcnP');
});

test('handles unicode escapes inside the JSON string', () => {
  const ctx = structuredClone(CTX);
  const raw = JSON.stringify(ctx);
  // simulate Instagram's \uXXXX escapes in the raw HTML (single backslash)
  const inner = raw.replace('working', 'w\\u00f6rking');
  const html = `{"contextJSON":"${inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`;
  const info = parseEmbedHtml(html);
  assert.equal(info.username, 'dilbar_._kumar');
  assert.match(info.caption, /w\u00f6rking/);
});

test('returns null for pages without contextJSON', () => {
  assert.equal(parseEmbedHtml('<html><body>empty</body></html>'), null);
  assert.equal(parseEmbedHtml(''), null);
  assert.equal(parseEmbedHtml(null), null);
});

test('returns null when the JSON is malformed', () => {
  const html = '<script>{"contextJSON":"{bad json \\\\"} </script>';
  assert.equal(parseEmbedHtml(html), null);
});

test('returns null when shortcode_media is missing', () => {
  assert.equal(parseEmbedHtml(embedPage({ context: {}, gql_data: {} })), null);
});
