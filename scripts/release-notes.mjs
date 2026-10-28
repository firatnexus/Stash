// Builds the GitHub release body for ONE version: that version's section of
// CHANGELOG.md plus the download / install / highlights template in
// .github/release-template.md. Older versions are never included.
//
//   node scripts/release-notes.mjs <version> [apkDir] [repo] > release-body.md
//
// Fails (exit 1) when CHANGELOG.md has no "## <version> — <date>" section, so a
// release can never ship without its own notes.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns the body of the "## <version> — <date>" section with its heading
 * rewritten to "## What's new in <version>", or null when it is missing.
 */
export function extractSection(markdown, version) {
  const lines = markdown.split(/\r?\n/);
  const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+v?${esc}(\\s|$)`).test(l));
  if (start < 0) return null;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  const date = (lines[start].match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
  const body = lines.slice(start + 1, end).join('\n').trim();
  const heading = `## What's new in ${version}` + (date ? `\n\n<sub>Released ${date}</sub>` : '');
  return `${heading}\n\n${body}`.trim();
}

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function buildBody({ notes, template, version, repo, apk, apkSize, sumsSize, sha256 }) {
  const section = extractSection(notes, version);
  if (!section) throw new Error(`CHANGELOG.md has no "## ${version} — <date>" section`);
  const debug = /-debug\.apk$/.test(apk);
  return render(template, {
    NOTES: section,
    REPO: repo,
    DOWNLOAD: `https://github.com/${repo}/releases/download/v${version}`,
    APK: apk,
    APK_SIZE: apkSize,
    SUMS_SIZE: sumsSize,
    SHA256: sha256,
    BUILD_KIND: debug ? 'Debug build (not signed with the release key)' : 'Signed release build',
    UPDATE_NOTE: debug
      ? 'This is a debug build: it cannot update a signed release install. Export a backup and uninstall that first.'
      : 'Updating from an earlier version keeps your data; the signing key is the same.',
  }).trimEnd() + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [version, apkDir = 'dist', repo = process.env.GITHUB_REPOSITORY ?? 'firatnexus/Stash'] = process.argv.slice(2);
  if (!version) { console.error('usage: release-notes.mjs <version> [apkDir] [repo]'); process.exit(2); }
  const v = version.replace(/^v/, '');
  const notes = readFileSync('CHANGELOG.md', 'utf8');
  const template = readFileSync('.github/release-template.md', 'utf8');
  let apk = `stash-${v}.apk`, apkSize = '—', sumsSize = '—', sha256 = '—';
  if (existsSync(apkDir)) {
    const found = readdirSync(apkDir).find((f) => f.endsWith('.apk'));
    if (found) { apk = found; apkSize = formatSize(statSync(join(apkDir, found)).size); }
    const sums = join(apkDir, 'SHA256SUMS.txt');
    if (existsSync(sums)) {
      sumsSize = formatSize(statSync(sums).size);
      const line = readFileSync(sums, 'utf8').split('\n').find((l) => l.trim().endsWith(apk));
      if (line) sha256 = line.split(/\s+/)[0];
    }
  }
  try {
    process.stdout.write(buildBody({ notes, template, version: v, repo, apk, apkSize, sumsSize, sha256 }));
  } catch (e) {
    console.error(`::error::${e.message}`);
    process.exit(1);
  }
}
