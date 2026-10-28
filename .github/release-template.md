Stash for Android: sort the Instagram Reels you save into your own categories, entirely on your phone.

{{NOTES}}

## Download

| File | Size | |
|---|---|---|
| [`{{APK}}`]({{DOWNLOAD}}/{{APK}}) | {{APK_SIZE}} | {{BUILD_KIND}} |
| [`SHA256SUMS.txt`]({{DOWNLOAD}}/SHA256SUMS.txt) | {{SUMS_SIZE}} | Checksum |

SHA-256: `{{SHA256}}`

## Install

1. Download the APK on your phone (Android 6.0+, with an up-to-date Android System WebView).
2. Open it and, if Android asks, allow "Install unknown apps" for your browser or file manager.
3. {{UPDATE_NOTE}}
4. In Instagram, tap **Share → More → Save to Stash** on any Reel. Long-press the target to pin it.

## Highlights

- **Share to save:** send a Reel from Instagram's share sheet, paste links, or import Instagram's data export (ZIP / JSON / HTML).
- **Your own categories** with keyword, hashtag, collection and creator matching. When Stash is not sure, it asks you.
- **Optional AI** with your own key (OpenAI, Gemini, OpenRouter, Anthropic or OpenAI-compatible); suggestions are never applied without your tap.
- **Covers and tags:** covers are stored on the device as small WebP files; tags and filters keep the Library easy to search.
- **Private by design:** no account, no server, no Instagram login, no analytics. JSON backup and restore.
- **Editorial design** with EB Garamond and Inter, a matching dark theme, and Turkish and English UI.

## Permissions

`INTERNET` only: used to fetch covers from Instagram's public embed page, open Reels in Instagram, load the optional preview and call the optional AI. No runtime permissions are requested.

## Known limitations

- Instagram's API does not expose saved posts, so existing saves are imported through the data export.
- Covers are available only for public Reels; `instagram.com/share/…` links cannot be resolved offline.
- Uninstalling the app or clearing its data removes your library, so keep a backup.

---

[README](https://github.com/{{REPO}}#readme) · [Full changelog](https://github.com/{{REPO}}/blob/main/CHANGELOG.md) · [Report an issue](https://github.com/{{REPO}}/issues)
