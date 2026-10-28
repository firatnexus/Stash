import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBody, extractSection, formatSize } from '../../scripts/release-notes.mjs';

const NOTES = `# Changelog

Intro line.

## 2.0.0 — 2026-11-01

- New thing.

## 1.9.9 — 2026-10-01

- Old thing.
`;
const TEMPLATE = 'Head\n\n{{NOTES}}\n\n{{APK}} {{APK_SIZE}} {{SHA256}} {{BUILD_KIND}}\n{{DOWNLOAD}}\n';

test('extracts only the requested version section', () => {
  const s = extractSection(NOTES, '2.0.0');
  assert.equal(s, "## What's new in 2.0.0\n\n<sub>Released 2026-11-01</sub>\n\n- New thing.");
  assert.ok(!s.includes('1.9.9'));
  assert.match(extractSection(NOTES, '1.9.9'), /Old thing/);
});

test('does not match a version that is only a prefix', () => {
  assert.equal(extractSection('## 1.9.10 — 2026-01-01\n\n- x', '1.9.1'), null);
});

test('builds a body with only the new version and the file details', () => {
  const body = buildBody({ notes: NOTES, template: TEMPLATE, version: '2.0.0', repo: 'o/r', apk: 'stash-2.0.0.apk', apkSize: '4.1 MB', sumsSize: '85 B', sha256: 'abc' });
  assert.ok(body.includes('- New thing.'));
  assert.ok(!body.includes('Old thing'));
  assert.ok(!body.includes('Intro line'));
  assert.ok(body.includes('stash-2.0.0.apk 4.1 MB abc Signed release build'));
  assert.ok(body.includes('https://github.com/o/r/releases/download/v2.0.0'));
});

test('fails when the version has no notes', () => {
  assert.throws(() => buildBody({ notes: NOTES, template: TEMPLATE, version: '3.0.0', repo: 'o/r', apk: 'a.apk', apkSize: '', sumsSize: '', sha256: '' }), /3\.0\.0/);
});

test('formats sizes', () => {
  assert.equal(formatSize(4299161), '4.1 MB');
  assert.equal(formatSize(85), '85 B');
});

test('the current app version has its own CHANGELOG.md section and matches version.js', async () => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const { APP_VERSION } = await import('../../www/src/version.js');
  assert.equal(APP_VERSION, version);
  assert.notEqual(extractSection(readFileSync('CHANGELOG.md', 'utf8'), version), null);
});
