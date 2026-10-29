# Contributing to Stash

Thanks for your interest. Stash is a small, deliberately simple project — a local-first Android app with no server, no accounts and no build step in the web layer. This document explains how to fit in.

## Ways to help

- **Bug reports.** Open an issue with: what you did, what happened, what you expected, your app version (Settings → About), Android version, and whether the optional AI is on. Screenshots help.
- **Translations.** The UI ships in Turkish and English. If you add or change a user-facing string, you must add it to both languages — `npm run check:i18n` and CI will fail otherwise.
- **Code.** Read the ground rules below first.

For anything security-sensitive, see [SECURITY.md](SECURITY.md) — do not open a public issue for it.

## Development setup

Requirements: Node.js 20+, JDK 21, Android SDK (platform 35, build-tools 35). Full details are in the [Development section of the README](README.md#development).

```bash
npm ci
npm run serve          # serves www/ at http://localhost:5173 for fast browser development
npm test               # unit tests (node:test)
npx playwright install chromium
npm run test:e2e       # end-to-end tests (phone and desktop viewports)
npm run apk:debug      # android/app/build/outputs/apk/debug/app-debug.apk
```

## Ground rules

These are the project's core guarantees. PRs that break them will not be merged:

- **Local-first.** No servers, no accounts, no telemetry, no background network. Network calls only for the documented features (embed fetch, open in Instagram, optional user-configured AI).
- **No new permissions.** Only `INTERNET` and `VIBRATE` are declared, and no runtime permissions are requested.
- **Privacy claims are code.** The README's privacy section must match what the code does — if your change affects data flow, update the README too.
- **No build step in `www/`.** Plain ES modules, hand-written HTML/CSS/JS. Do not introduce bundlers or transpilers.
- **Both themes, both viewports.** The e2e suite runs on phone and desktop viewports and exercises the dark theme; check your change in light theme by hand.
- **Secrets never in code, logs, backups or screenshots.** This includes AI API keys.

## Pull requests

1. Fork, then branch from `main`. Keep PRs small and described in plain terms — a short "why" goes a long way.
2. Run `npm test` and `npm run test:e2e` locally. CI runs the same suite and must pass before merge.
3. If your change is visible in the UI, regenerate the screenshots if you know how (`npm run screenshots`); otherwise mention it in the PR so the maintainer can.
4. Do not bump versions or add changelog entries in your PR — releases are handled by the maintainer (version bump, changelog section, tag; the release workflow builds and signs the APK).

`main` is protected: linear history is enforced, so PRs are merged with **squash** (or rebase). Admins are not exempt, and required checks include the unit + end-to-end suite.

## Releasing

Releases are maintainer-driven; this is here so contributors know what happens: `APP_VERSION`/`VERSION_CODE` in `www/src/version.js` and `version` in `package.json` are bumped, a changelog section is added (a unit test fails without it), a `vX.Y.Z` tag is pushed, and the Android APK workflow builds, signs and publishes the release with per-version notes.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
