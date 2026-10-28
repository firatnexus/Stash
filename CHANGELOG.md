# Changelog

All notable changes to Stash. Newest first. Each `## X.Y.Z — date` section is published as the GitHub release notes for that version only.

## 1.2.2 — 2026-10-28

The last internal "Reels Organizer" names are gone. Your library moves over automatically.

### Changed

- **Database renamed** from `reels-organizer` to `stash`. On first launch every Reel, category and setting is copied into the new database; the old one is deleted only after the copy has been saved, so an interrupted update simply finishes on the next launch. Nothing you added in the meantime is overwritten.
- **Backups** are now named `stash-backup-YYYY-MM-DD.json` and marked `"app": "stash"`. Backups made by earlier versions still restore.
- **Android code** moved to the `io.github.firatnexus.stash` package. The launcher icon and the "Save to Stash" share target keep their previous component name, so home-screen shortcuts and pinned share targets keep working.

### Unchanged on purpose

- The Android `applicationId` stays `io.github.firatnexus.reelsorganizer`. Changing it would make Android treat Stash as a different app: updates would not install over the old version and your data would stay behind.

## 1.2.1 — 2026-10-28

A small polish release with an all-English repository.

### Fixed

- **Hidden WebView scrollbar:** the Android WebView no longer draws its vertical scrollbar overlay on the right edge while you scroll long lists.

### Changed

- **English documentation:** the README, changelog and release notes are now fully in English, with a redesigned README and fresh screenshots taken with the English UI.
- **Per-version release notes:** every GitHub release now shows only the notes for its own version, plus download details (size and SHA-256), install steps, highlights, permissions and known limitations.
- **Repository renamed** from `reels-organizer` to `Stash`; old links redirect automatically.

## 1.2.0 — 2026-10-25

An editorial design refresh. No functional or data-model changes.

### Changed

- **Typography:** EB Garamond (display, weight 400) and Inter (body) variable fonts replace Satoshi / Cabinet Grotesk. Latin and Latin Extended subsets give full Turkish coverage (ĞğİıŞşÇçÖöÜü); OFL 1.1 license notes live in `www/fonts/`. Serif headings with tight letter spacing, slightly open tracking in body text.
- **Color:** a soft off-white canvas (#f5f5f5) and warm ink black (#292524 / #0c0a09) replace the paper tone and single raspberry accent. There is no saturated call-to-action color any more.
- **Buttons:** full pill geometry instead of rounded rectangles with gradient fills. Primary is an ink-filled pill, secondary a 1px outline.
- **Cards:** softer corners (16px cards, 24px orb card), 1px hairline borders and a single soft shadow layer.
- **Atmospheric orbs:** soft pastel radial gradients (mint, peach, lavender, sky) behind the header and the quick-add band, purely decorative.
- **Category colors:** a muted pastel palette instead of the vivid set; cards without a cover show an ink initial instead of a white one.
- **Dark theme:** rebalanced around deep surfaces (#0c0a09 / #1c1917). Pills invert in dark mode (light fill, dark text); the selection check, switch knob and Delete button text follow the theme.
- **App icon and splash screen:** an ink bookmark with pastel orbs on an off-white background; all mipmap and splash assets regenerated.
- **Library toolbar:** on phones the search field now has its own row instead of sharing a cramped one.

## 1.1.1 — 2026-10-22

Renamed to **Stash** (it was Sakla in 1.1.0, originally Reels Organizer). All app-name strings, the share-target label and the release page are in English. The `applicationId` is unchanged, so it installs over existing versions.

## 1.1.0 — 2026-10-22

Renamed to **Sakla** (formerly Reels Organizer). The `applicationId` is unchanged, so it installs over existing versions.

### Added

- **Native splash screen:** androidx SplashScreen API with a 450ms scale animation. It stays until the first frame is drawn, so there is no white flash (Android 7 to 11 included).
- **Cover images and creator info:** fetched at save time from Instagram's public embed page and stored on the device as WebP (480px max). Includes a "Refresh cover" retry, a one-time "Update existing reels" backfill, and cache size and clearing in Settings. This route is used because Meta removed `thumbnail_url` from oEmbed.
- **Broader AI suggestions:** 1 to 3 existing categories, at most 1 new category and 3 to 5 tags. Tags are never applied automatically (there is a "Reject all"). Settings explains what is sent, and suggestions can be turned off.
- **Tags:** add them manually, filter by tag chips in the Library and search by tag.
- **Home / Library split:** Home is a summary dashboard (quick add, stats, "Take another look today", reels waiting for a category). The Library holds the full collection (search, sort, category and tag filters, list or grid, multi-select bulk categorize and delete).
- **Drag to dismiss sheets:** drag down from the handle or header; the sheet closes past a 30% threshold or on a quick fling, otherwise it springs back.
- **Tactile feel:** tonal fills with a soft shadow, a 0.96 press scale, 120 to 180ms transitions and native haptics.
- **Clipboard offer:** when the app comes to the foreground with an unsaved Instagram link on the clipboard, it offers to add it. Nothing is added until you tap.

### Fixed

- "Refresh cover" and "Load Instagram preview" overlapping on the detail sheet.
- Scroll performance: removed fixed blurred bars (`backdrop-filter`), a known cause of scroll jank in Android WebView.

### Known limitations

- Cover download works only for public Reels with a real shortcode; private or removed content gets no cover.
- Performance was measured in desktop Chromium (the main thread stays vsync-bound while scrolling); no physical-device measurement yet.

## 1.0.0 — 2026-10-22

First release.

- Save Reels from Instagram through the Android share sheet (cold and warm start).
- Add single or multiple links, paste from the clipboard, detailed link errors.
- Bulk import from Instagram's data export (ZIP / JSON / HTML); collections become categories; Meta mojibake is repaired.
- Create, rename, color, add keywords to and delete categories; Turkish and English starter suggestions.
- Category matching from keywords, hashtags, collections and creator history; the app asks you when it is not sure.
- Optional AI provider (OpenAI, Gemini, OpenRouter, Anthropic or a custom OpenAI-compatible endpoint).
- Search, category filters, newest / oldest sorting, duplicate detection.
- JSON backup export, restore by merging or replacing.
- Turkish and English UI, light and dark theme, Android back button, adaptive and themed app icon.
