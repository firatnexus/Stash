import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInstagramUrl, extractInstagramUrls, parseUserInput, parseSharePayload, embedUrl, profileUrl } from '../../www/src/instagram/url.js';

test('parses common Reel link forms to one canonical URL', () => {
  const forms = [
    'https://www.instagram.com/reel/C9xYz12AbcD/',
    'https://instagram.com/reel/C9xYz12AbcD',
    'http://m.instagram.com/reels/C9xYz12AbcD/?igsh=MWQ1ZGUxMzBkMA==',
    'www.instagram.com/reel/C9xYz12AbcD/?utm_source=ig_web_copy_link',
    'instagram.com/reel/C9xYz12AbcD',
    '<https://www.instagram.com/reel/C9xYz12AbcD/>.',
    'https://www.instagram.com/chef.anna/reel/C9xYz12AbcD/',
  ];
  for (const f of forms) {
    const r = parseInstagramUrl(f);
    assert.equal(r.ok, true, f);
    assert.equal(r.key, 'C9xYz12AbcD', f);
    assert.equal(r.kind, 'reel');
    assert.equal(r.url, 'https://www.instagram.com/reel/C9xYz12AbcD/');
  }
  assert.equal(parseInstagramUrl(forms.at(-1)).username, 'chef.anna');
});

test('supports posts, IGTV and share links', () => {
  assert.equal(parseInstagramUrl('https://www.instagram.com/p/Bxyz123456/').url, 'https://www.instagram.com/p/Bxyz123456/');
  assert.equal(parseInstagramUrl('https://www.instagram.com/tv/Bxyz123456/').kind, 'tv');
  const s = parseInstagramUrl('https://www.instagram.com/share/reel/BAQk9mVxYz/');
  assert.equal(s.ok, true);
  assert.equal(s.kind, 'share');
  assert.equal(s.key, 'share:BAQk9mVxYz');
  assert.equal(parseInstagramUrl('https://www.instagram.com/share/_aBcD3fGh1/').key, 'share:_aBcD3fGh1');
});

test('reports precise errors', () => {
  assert.deepEqual(parseInstagramUrl(''), { ok: false, error: 'empty' });
  assert.deepEqual(parseInstagramUrl('   '), { ok: false, error: 'empty' });
  assert.equal(parseInstagramUrl('hello world').error, 'not_url');
  assert.equal(parseInstagramUrl('ftp://instagram.com/reel/C9xYz12AbcD').error, 'not_url');
  assert.equal(parseInstagramUrl('https://www.youtube.com/shorts/abcdef').error, 'not_instagram');
  assert.equal(parseInstagramUrl('https://instagram.com.evil.example/reel/C9xYz12AbcD').error, 'not_instagram');
  assert.equal(parseInstagramUrl('https://www.instagram.com/').error, 'unsupported');
  assert.equal(parseInstagramUrl('https://www.instagram.com/chef.anna/').error, 'unsupported');
  assert.equal(parseInstagramUrl('https://www.instagram.com/stories/someone/123/').error, 'unsupported');
  assert.equal(parseInstagramUrl('https://www.instagram.com/reel/abc/').error, 'unsupported');
  assert.equal(parseInstagramUrl(null).error, 'empty');
});

test('extracts and de-duplicates links in free text', () => {
  const text = 'Look https://www.instagram.com/reel/AAAAA11111/ and instagram.com/reel/AAAAA11111 and https://instagram.com/p/BBBBB22222 also https://instagram.com/explore/x';
  const { found, invalid } = extractInstagramUrls(text);
  assert.deepEqual(found.map((f) => f.key), ['AAAAA11111', 'BBBBB22222']);
  assert.equal(invalid.length, 1);
});

test('parseUserInput reports bad lines individually', () => {
  const rows = parseUserInput('https://www.instagram.com/reel/AAAAA11111/\nnot a link\n\nhttps://www.instagram.com/reel/AAAAA11111/');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].result.ok, true);
  assert.equal(rows[1].result.error, 'not_url');
});

test('share payload keeps only text that was really shared', () => {
  const onlyLink = parseSharePayload({ text: 'https://www.instagram.com/reel/C9xYz12AbcD/?igsh=abc' });
  assert.equal(onlyLink.links.length, 1);
  assert.equal(onlyLink.caption, null);
  assert.equal(onlyLink.title, null);
  assert.equal(onlyLink.username, null);

  const rich = parseSharePayload({
    title: 'Anna Cooks (@chef.anna) on Instagram: "Easy 10 minute pasta #recipe"',
    url: 'https://www.instagram.com/reel/C9xYz12AbcD/',
  });
  assert.equal(rich.caption, 'Easy 10 minute pasta #recipe');
  assert.equal(rich.creatorName, 'Anna Cooks (@chef.anna)');
  assert.equal(rich.username, 'chef.anna');
  assert.equal(rich.title, null);

  const withText = parseSharePayload({ text: 'Bu tarifi dene https://www.instagram.com/reel/C9xYz12AbcD/' });
  assert.equal(withText.caption, 'Bu tarifi dene');
});

test('embed and profile URLs', () => {
  assert.equal(embedUrl(parseInstagramUrl('https://instagram.com/reel/C9xYz12AbcD')), 'https://www.instagram.com/reel/C9xYz12AbcD/embed/captioned/');
  assert.equal(embedUrl(parseInstagramUrl('https://instagram.com/share/reel/BAQk9mVxYz')), null);
  assert.equal(profileUrl('chef.anna'), 'https://www.instagram.com/chef.anna/');
  assert.equal(profileUrl('bad name'), null);
});
