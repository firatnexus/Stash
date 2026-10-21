import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeZip } from './helpers/zip-writer.mjs';
import { fixMojibake, parseSavedPosts, parseSavedCollections, parseHtml, mergeItems, readExportFile, ExportError } from '../../www/src/io/instagram-export.js';
import { listEntries, readEntryText, isZip } from '../../www/src/io/zip.js';

// Same shape as Meta's "Download your information" JSON (your_instagram_activity/saved/)
const savedPosts = {
  saved_saved_media: [
    { title: 'chef.anna', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/reel/AAAAA11111/', timestamp: 1730000000 } } },
    { title: 'travel_with_mert', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/p/BBBBB22222/', timestamp: 1731000000 } } },
    { title: 'dup', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/reel/AAAAA11111/', timestamp: 1720000000 } } },
    { title: 'broken', string_map_data: { 'Saved on': { href: 'https://example.com/x', timestamp: 1 } } },
  ],
};
const savedCollections = {
  saved_saved_collections: [
    { title: 'Collection', string_map_data: { Name: { value: 'Tatl\u00c4\u00b1lar' }, 'Creation Time': { timestamp: 1700000000 } } },
    { title: 'chef.anna', string_map_data: { Name: { href: 'https://www.instagram.com/reel/AAAAA11111/', value: 'chef.anna' }, 'Added Time': { timestamp: 1730000001 } } },
    { title: 'Collection', string_map_data: { Name: { value: 'Travel' } } },
    { title: 'x', string_map_data: { Name: { href: 'https://www.instagram.com/reel/CCCCC33333/', value: 'nomad.ece' }, 'Added Time': { timestamp: 1732000000 } } },
  ],
};

test('repairs Meta mojibake', () => {
  assert.equal(fixMojibake('Tatl\u00c4\u00b1lar'), 'Tatlılar');
  assert.equal(fixMojibake('G\u00c3\u00bczel'), 'Güzel');
  assert.equal(fixMojibake('plain'), 'plain');
  assert.equal(fixMojibake('Güzel ı'), 'Güzel ı');
});

test('parses saved_posts.json', () => {
  const items = parseSavedPosts(savedPosts);
  assert.equal(items.length, 3);
  assert.equal(items[0].username, 'chef.anna');
  assert.equal(items[0].savedAt, 1730000000 * 1000);
  assert.equal(items[1].parsed.kind, 'post');
  assert.equal(parseSavedPosts({ other: [] }), null);
});

test('parses saved_collections.json with collection names', () => {
  const items = parseSavedCollections(savedCollections);
  assert.deepEqual(items.map((i) => [i.parsed.key, i.collection, i.username]), [
    ['AAAAA11111', 'Tatlılar', 'chef.anna'],
    ['CCCCC33333', 'Travel', 'nomad.ece'],
  ]);
});

test('merge keeps earliest save time and fills collection', () => {
  const merged = mergeItems([parseSavedPosts(savedPosts), parseSavedCollections(savedCollections)]);
  assert.equal(merged.length, 3);
  const a = merged.find((i) => i.parsed.key === 'AAAAA11111');
  assert.equal(a.savedAt, 1720000000 * 1000);
  assert.equal(a.collection, 'Tatlılar');
});

test('parses HTML exports', () => {
  const html = '<div><a target="_blank" href="https://www.instagram.com/reel/AAAAA11111/?a=1&amp;b=2">x</a><a href="https://example.com">y</a></div>';
  assert.deepEqual(parseHtml(html).map((i) => i.parsed.key), ['AAAAA11111']);
});

test('reads a full export ZIP (deflate + stored, ignores macOS junk)', async () => {
  const zip = makeZip([
    { name: 'your_instagram_activity/saved/saved_posts.json', data: JSON.stringify(savedPosts) },
    { name: 'your_instagram_activity/saved/saved_collections.json', data: JSON.stringify(savedCollections), deflate: false },
    { name: '__MACOSX/your_instagram_activity/saved/._saved_posts.json', data: 'junk' },
    { name: 'your_instagram_activity/likes/liked_posts.json', data: '{"likes_media_likes":[]}' },
  ]);
  const file = new File([zip], 'instagram-export.zip', { type: 'application/zip' });
  assert.equal(await isZip(file), true);
  const entries = await listEntries(file);
  assert.equal(entries.length, 4);
  assert.match(await readEntryText(file, entries[0]), /saved_saved_media/);

  const { items, files } = await readExportFile(file);
  assert.deepEqual(files.sort(), ['saved_collections.json', 'saved_posts.json']);
  assert.equal(items.length, 3);
});

test('ZIP without saved data gives a clear error', async () => {
  const zip = makeZip([{ name: 'messages/inbox/a.json', data: '{}' }]);
  await assert.rejects(readExportFile(new File([zip], 'x.zip')), (e) => e instanceof ExportError && e.code === 'no_saved_file');
});

test('plain JSON, HTML and text files', async () => {
  const j = await readExportFile(new File([JSON.stringify(savedPosts)], 'saved_posts.json'));
  assert.equal(j.items.length, 2, 'duplicate saves merged');
  const txt = await readExportFile(new File(['https://www.instagram.com/reel/AAAAA11111/\nhttps://instagram.com/reel/DDDDD44444'], 'links.txt'));
  assert.equal(txt.items.length, 2);
  const unknown = await readExportFile(new File([JSON.stringify({ deep: { list: ['see https://www.instagram.com/reel/EEEEE55555/'] } })], 'other.json'));
  assert.equal(unknown.items[0].parsed.key, 'EEEEE55555');
});
