# Security Policy

Stash is a local-first app with no server, no accounts and no telemetry. This page explains how to report problems and what "secure" means for this project.

## Supported versions

Only the [latest release](https://github.com/firatnexus/Stash/releases/latest) is supported. Updates are signed with the same key and install over previous versions, so staying current is easy.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting: **Security tab → Report a vulnerability** (or [the advisories page](https://github.com/firatnexus/Stash/security/advisories/new)). This keeps the report private to the maintainer.

Please include:

- The affected version (shown in **Settings → About**).
- Your Android version and whether you use the optional AI feature.
- Steps to reproduce, and what you expected instead.

Reports are handled best-effort by a single maintainer, so please allow a few days for a first response. Coordinated disclosure is fine: tell me your preferred disclosure timeline and I will work with it.

Do not open a public issue for anything security-sensitive.

## Threat model

Worth stating clearly, because much of the app's security is structural:

- **All data stays on the device** in IndexedDB. There is no backend to breach — the attack surface is the app itself.
- **Network use is narrow and documented**: the cover/creator fetch (`instagram.com/reel/…/embed`) at save time, opening a Reel in Instagram, the optional embedded preview, and — only if you turn it on — the AI provider you configure. Nothing else makes requests.
- **The AI API key** is stored only on the device and is never written to backups or exports.
- **Android cloud backup and device-to-device transfer are disabled** (`allowBackup=false`), so your library is not silently copied to Google services.
- **No runtime permissions** are requested; only `INTERNET` and `VIBRATE` are declared.

## Out of scope

- Losing your library by uninstalling the app or clearing its data — documented behavior; keep a JSON backup.
- Instagram/Meta blocking or changing the embed page, export format or share sheet — these are availability problems, not security issues (but bug reports are welcome).
- Bugs in Instagram's own apps or website.

## Verifying your download

The APK is not on the Play Store, so verify what you install:

1. Download `stash-x.y.z.apk` only from the [official releases page](https://github.com/firatnexus/Stash/releases/latest) — not from third-party mirrors.
2. Check it against the `SHA256SUMS.txt` attached to the same release (`sha256sum stash-x.y.z.apk`).
3. All releases are signed with the same key, so an official APK installs over previous versions; a differently-signed build will refuse to install over your data.

Repackaged or modified copies found elsewhere are not supported and may be malicious.

## For contributors

Keep the guarantees above intact when changing code:

- No new permissions, servers, accounts or telemetry.
- Network calls only for documented features; nothing in the background.
- Secrets (including AI keys) never in code, logs, backups or screenshots.
