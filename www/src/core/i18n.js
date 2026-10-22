/**
 * Translations (Turkish + English). The device language is used unless the
 * user picks one in Settings. Plural forms: "one|other", chosen by {n}.
 */

const en = {
  appName: 'Stash',
  navHome: 'Home', navLibrary: 'Library', navAdd: 'Add', navCategories: 'Categories', navSettings: 'Settings',
  today: 'Today', yesterday: 'Yesterday',
  add: 'Add', addReel: 'Add a Reel', save: 'Save', create: 'Create', cancel: 'Cancel', delete: 'Delete', undo: 'Undo', change: 'Change', show: 'Show', restore: 'Restore', paste: 'Paste', search: 'Search', sort: 'Sort', all: 'All',
  // Dashboard
  dashTitle: 'Your saved Reels', quickAddLabel: 'Add a Reel link', pasteReelLink: 'Paste an Instagram Reel link', reelLink: 'Reel link',
  statReels: 'Reels|Reels', statCategories: 'Categories', statReview: 'Need a category',
  setupTitle: 'Create your categories first', setupText: 'Reels are sorted into categories you define. Start with suggestions or make your own.', setupAction: 'Set up categories',
  reviewTitle: 'Waiting for a category', reviewHint: 'These could not be sorted with confidence. Tap one to choose.', seeAll: 'See all',
  recentTitle: 'Recently added', emptyDashTitle: 'No Reels yet', emptyDashText: 'Share a Reel from Instagram to this app, paste a link above, or import your Instagram data export.',
  // Card / detail
  unknownCreator: 'Creator unknown', noCaption: 'No caption available', chooseCategory: 'Choose a category', uncategorized: 'Uncategorized', openInstagram: 'Open in Instagram', reelDetails: 'Reel details',
  added: 'Added', savedOnInstagram: 'Saved on Instagram', type: 'Type', source: 'Source', collection: 'Instagram collection',
  kind_reel: 'Reel', kind_post: 'Post', kind_tv: 'IGTV video', kind_share: 'Share link',
  source_manual: 'Added by hand', source_share: 'Shared from Instagram', source_export: 'Instagram data export', source_backup: 'Restored backup',
  sharedTitle: 'Shared title', caption: 'Caption', noCaptionHelp: 'When a Reel is added, its caption is fetched from Instagram’s public embed page when possible. You can also paste or edit it here — it improves search and sorting.',
  editCaption: 'Edit caption', addCaption: 'Add caption', captionHelp: 'Copy the caption from Instagram and paste it here. It is used for search and automatic categories.', captionPlaceholder: 'Paste the Reel caption…', recategorizeAfterCaption: 'Sort again using this caption',
  category: 'Category', notes: 'Notes', notesPlaceholder: 'Why did you save this?',
  autoBy_keyword: 'Sorted automatically by keywords: {words}', autoBy_collection: 'Sorted from your Instagram collection {words}', autoBy_creator: 'Sorted by your earlier choices for {words}', autoBy_ai: 'Sorted by your AI provider',
  suggested: 'Suggested', matchedOn: 'Matched: {words}', otherCategories: 'Other categories', allCategories: 'Categories', newCategoryName: 'New category name',
  filedUnder: 'Filed under {name}', categoryCleared: 'Category removed', instagramPreview: 'Instagram preview', loadPreview: 'Load Instagram preview',
  copyLink: 'Copy link', linkCopied: 'Link copied', copyFailed: 'Could not copy', deleteReelQ: 'Delete this Reel?', deleteReelMsg: 'It is removed from this app only. Nothing changes on Instagram.', reelDeleted: 'Reel deleted',
  noCategoriesYet: 'You have no categories yet.', createCategory: 'Create a category',
  // Add
  addTitle: 'Add Reels', manualTitle: 'Add by link', reelLinks: 'Reel link(s)', urlPlaceholder: 'https://www.instagram.com/reel/…\nOne link per line for several',
  captionOptional: 'Caption (optional)', notesOptional: 'Notes (optional)', autoCategory: 'Choose automatically', saveReel: 'Save Reel',
  validLink: 'Valid {kind} link', validLinks: '{n} valid links', multiNote: 'Caption and notes apply only when you add a single link.', someInvalid: '{n} line was not a valid Instagram link|{n} lines were not valid Instagram links',
  urlErr_empty: 'Paste an Instagram Reel link first.', urlErr_not_url: 'This is not a web link. Copy the link from Instagram (Share → Copy link).', urlErr_not_instagram: 'This link is not from Instagram.', urlErr_unsupported: 'This Instagram link is not a Reel or post (profiles, stories and audio pages are not supported).',
  willFile: 'Will be filed under', maybe: 'Maybe', willAsk: 'You will be asked to confirm.', noMatchWillAsk: 'No category matched. You will be asked to choose.', noTextWillAsk: 'A link alone has no text to sort by. Add a caption or notes, or you will be asked to choose.', noCategoriesHint: 'Create categories to enable automatic sorting.',
  savedTo: 'Saved to {name}', whereToFile: 'Where should this Reel go?', addedMany: '{n} Reel added, {filed} sorted automatically|{n} Reels added, {filed} sorted automatically', alreadySaved: 'This Reel is already in your library', alreadySavedMany: '{n} Reels were already in your library',
  clipboardEmpty: 'Clipboard is empty', shareNoLink: 'The shared content had no Instagram link. Paste the link below.',
  shareTitle: 'Share straight from Instagram', shareStep1: 'In Instagram, open a Reel and tap the Share (paper plane) button.', shareStep2: 'Tap “Share to…” (or “More”) and choose Stash.', shareStep3: 'The Reel is saved and sorted. If it is unclear, the app asks you for the category.',
  shareNote: 'If Stash is not in the list, use “Copy link” and paste it here.',
  exportTitle: 'Import from Instagram data export', exportIntro: 'Instagram can give you a file with links to everything you saved. Import it to add all of them at once.', exportHowTo: 'How to get the file',
  exportStep1: 'Instagram → Profile → ☰ → Accounts Center → Your information and permissions.', exportStep2: 'Export your information → Create export → choose your Instagram account → Export to device.', exportStep3: 'Customize information: select only “Saved”. Date range: All time. Format: JSON.', exportStep4: 'Start the export. Instagram sends a notification when the ZIP is ready (minutes to a few days).', exportStep5: 'Download the ZIP and choose it here. You do not need to unzip it.',
  chooseExportFile: 'Choose ZIP / JSON file', reading: 'Reading {name}…', exportNoLinks: 'No Instagram links were found in this file.',
  exportErr_not_zip: 'This file could not be read.', exportErr_zip64: 'This ZIP is too large. Export only “Saved” and try again, or unzip it and choose saved_posts.json.', exportErr_corrupt: 'The ZIP file looks damaged. Download it again.', exportErr_no_inflate: 'This device cannot unzip files. Unzip it and choose saved_posts.json.', exportErr_unsupported_method: 'This ZIP uses an unsupported compression. Unzip it and choose saved_posts.json.', exportErr_no_saved_file: 'No saved posts were found in this ZIP. Make sure “Saved” was selected when you created the export.', exportErr_generic: 'This file could not be imported.',
  exportPreviewTitle: 'Import saved items', fromFiles: 'From: {files}', postsLabel: 'Photo posts', alreadyInLibrary: 'Already in library', collections: 'Collections', includePosts: 'Also import photo posts (not only Reels)', collectionsAsCategories: 'Use my Instagram collections as categories', importN: 'Import {n}', importDone: '{added} imported, {assigned} sorted automatically, {dup} duplicates skipped',
  exportHonest: 'The export contains only links, the creator and the save date — no captions or thumbnails. Items that cannot be sorted wait in “Need a category”.',
  // Library
  libraryTitle: 'Library', searchPlaceholder: 'Search captions, creators, notes…', sortNewest: 'Newest first', sortOldest: 'Oldest first', filterByCategory: 'Filter by category', needsCategory: 'Need a category', resultCount: '{n} Reel|{n} Reels',
  emptyLibTitle: 'Your library is empty', emptyLibText: 'Reels you add show up here, ready to search and filter.', noResultsTitle: 'Nothing found', noResultsText: 'No Reel matches “{q}”.', noResultsCat: 'No Reels in this filter yet.', clearFilters: 'Clear filters',
  // Categories
  categoriesTitle: 'Categories', categoriesIntro: 'Each category has keywords. When a Reel arrives, its caption, title and notes are matched against them.', newCategory: 'New category', editCategory: 'Edit category',
  emptyCatTitle: 'No categories yet', emptyCatText: 'Start with ready-made categories (with keywords in English and Turkish) or create your own.', useStarters: 'Use suggestions', createOwn: 'Create my own', addStarters: 'Add suggested categories',
  startersTitle: 'Suggested categories', startersHelp: 'Each comes with keywords you can edit later.', alreadyExists: 'Already added', addSelected: 'Add selected', startersAdded: '{n} category added|{n} categories added',
  nReels: '{n} Reel|{n} Reels', nKeywords: '{n} keyword|{n} keywords', showReelsIn: 'Show Reels in {name}', editNamed: 'Edit {name}',
  name: 'Name', categoryNamePlaceholder: 'e.g. Recipes', color: 'Color', keywords: 'Keywords', keywordsHelp: 'Words or #hashtags that point to this category. Separate with commas. Case and accents do not matter.', keywordPlaceholder: 'pasta, #recipe, dinner', noKeywords: 'No keywords yet — only the category name is matched.', removeKeyword: 'Remove {k}',
  color_coral: 'Coral', color_amber: 'Amber', color_green: 'Green', color_teal: 'Teal', color_blue: 'Blue', color_violet: 'Violet', color_rose: 'Rose', color_slate: 'Slate',
  categoryCreated: 'Category “{name}” created', categorySaved: 'Category saved', categoryDeleted: 'Category deleted',
  deleteCategoryQ: 'Delete “{name}”?', deleteCategoryMsg: '{n} Reel in it will move to “Need a category”. The Reel itself is kept.|{n} Reels in it will move to “Need a category”. The Reels themselves are kept.', deleteCategoryEmpty: 'This category is empty.',
  err_empty_name: 'Enter a name.', err_duplicate_name: 'A category with this name already exists.', err_not_found: 'This category no longer exists.', err_generic: 'Something went wrong. Try again.',
  autoTitle: 'Automatic sorting', autoText: 'After adding categories or keywords, sort the Reels that are still waiting. Reels you filed yourself are never moved.', recheck: 'Sort waiting Reels ({n})', recheckDone: '{n} Reel sorted|{n} Reels sorted',
  // Settings
  settingsTitle: 'Settings', general: 'General', language: 'Language', deviceLanguage: 'Device language', theme: 'Theme', theme_system: 'System', theme_light: 'Light', theme_dark: 'Dark',
  autoAssign: 'Sort automatically', autoAssignHint: 'File a Reel without asking when the match is clear.', embedPreview: 'Load Instagram previews automatically', embedPreviewHint: 'Shows Instagram’s official embed in Reel details. This contacts Instagram.',
  aiTitle: 'AI sorting (optional)', aiEnable: 'Use an AI provider', aiEnableHint: 'Only for Reels that keywords cannot sort, and only when there is text. Sends that text and your category names to the provider you choose.',
  aiProvider: 'Provider', aiBaseUrl: 'API base URL', aiModel: 'Model', aiModelPlaceholder: 'e.g. gpt-4o-mini', aiKey: 'API key', aiKeyPlaceholder: 'Stored only on this device', aiKeyHint: 'Kept on this device. Never included in backups.', aiTest: 'Test connection', aiTesting: 'Testing…', aiIncomplete: 'Fill in base URL, model and key first.', aiOk: 'Works. Test caption was sorted as: {name}', aiOddReply: 'Connected, but the reply was not understood. Try another model.', aiFailed: 'AI sorting failed: {msg}',
  dataTitle: 'Your data', dataText: '{reels} Reels and {cats} categories are stored on this device only.', exportData: 'Export backup (JSON)', importData: 'Restore backup', backupSaved: 'Backup saved', backupSaveFailed: 'Could not save: {msg}',
  coversTitle: 'Covers and creator info', coversText: 'Covers, the sharer and the caption come from Instagram’s official public embed page — the same data the in-app preview shows. They are downloaded and stored on this device so they keep working offline and after the original image links expire.',
  backfillBtn: 'Update existing Reels', backfillNone: 'All Reels already have covers.', backfillDone: '{ok} of {n} Reels updated.',
  cacheUsage: 'Cover cache: {size}', clearCache: 'Clear cover cache', cacheCleared: 'Cover cache cleared.', cacheClearFailed: 'Cache could not be cleared.',
  coverRefresh: 'Refresh cover', coverRefreshOk: 'Cover and creator info updated.', coverRefreshFailed: 'Could not fetch the cover. Instagram may be unreachable or the post may be gone — try again later.',
  tags: 'Tags', noTagsYet: 'No tags yet. Tags make searching easier.', addTag: 'Add tag', addTagPlaceholder: 'Add a tag and press Enter…', removeTag: 'Remove tag: {t}', addTagSuggestion: '+ {t}', suggestedTags: 'Suggested tags', suggestedTagsHint: 'Tap the ones you want — they are applied only with your confirmation.', createNewNamed: 'Create category “{name}”', rejectAll: 'Reject all', suggestionsRejected: 'Suggestions rejected. You can categorize manually anytime.', filterByTag: 'Filter by tag', viewGrid: 'Grid view', viewList: 'List view', select: 'Select', selectedCount: '{n} selected', categorize: 'Categorize', categorizeSelected: 'Categorize {n} selected', deleteSelectedQ: 'Delete {n} Reels?', deleteSelectedMsg: 'The selected Reels will be permanently removed from this device.', deletedMany: '{n} Reels deleted', filedMany: '{n} Reels filed under “{name}”', categoryClearedMany: 'Category cleared for {n} Reels', clearCategory: 'Remove category', revisitTitle: 'Take another look today', clipboardOffer: 'An unsaved Instagram link is on the clipboard — add it?',
  aiSuggestTags: 'Tag suggestions', aiWhatSent: 'Exactly what is sent to the provider: the Reel’s title, caption, your notes, the creator name/handle and your category names with their keywords. Nothing else. You can turn tag suggestions off with this switch.', aiErrAuth: 'The AI provider rejected your API key. Check the key in Settings.', aiErrQuota: 'The AI provider quota or billing limit was reached.', aiErrOffline: 'Could not reach the AI provider. Check your connection and try again.',
  backupErr_invalid: 'This is not a valid backup file.', backupErr_wrong_app: 'This file is not a Stash backup.', backupErr_newer_schema: 'This backup is from a newer app version. Update the app first.',
  restoreTitle: 'Restore backup', restoreFound: 'Backup contains {reels} Reels and {cats} categories ({date}).', restoreMerge: 'Merge', restoreMergeHint: 'Keep current data and add what is missing. Duplicates are skipped.', restoreReplace: 'Replace', restoreReplaceHint: 'Delete current Reels and categories, then restore the backup.', restoreDone: 'Restored {reels} Reels and {cats} new categories ({dup} duplicates skipped)',
  wipe: 'Delete all data', wipeQ: 'Delete everything?', wipeMsg: 'All Reels, categories and settings are removed from this device. Export a backup first if you might need them.', wipeConfirm: 'Delete everything', wiped: 'All data deleted',
  privacyTitle: 'Privacy', privacy1: 'Everything is stored on this device. There is no account and no server.', privacy2: 'The app never asks for your Instagram password and never reads Instagram cookies or private data.', privacy3: 'Nothing is sent anywhere unless you turn on AI sorting or load an Instagram preview.', privacy4: 'Opening a Reel hands the link to the Instagram app (needs internet).',
  worksTitle: 'What works and what does not', works1: 'Sharing from the Instagram app, adding links by hand and importing your data export all work offline.', works2: 'Instagram does not let apps read your saved list; captions and thumbnails come from Instagram’s official public embed page (when it is reachable), not from your account.', works3: 'Duplicate links are detected, including different link formats of the same Reel.', works4: 'Newer “instagram.com/share/…” links cannot be expanded offline; a duplicate check works only against the same share link.', works5: 'Thumbnails are fetched from the public embed page and stored on this device. If a fetch fails, the card shows a placeholder with a retry action.',
  dbErrorTitle: 'Storage unavailable', dbErrorText: 'The app could not open its local database.',
};

const tr = {
  appName: 'Stash',
  navHome: 'Ana sayfa', navLibrary: 'Kitaplık', navAdd: 'Ekle', navCategories: 'Kategoriler', navSettings: 'Ayarlar',
  today: 'Bugün', yesterday: 'Dün',
  add: 'Ekle', addReel: 'Reel ekle', save: 'Kaydet', create: 'Oluştur', cancel: 'Vazgeç', delete: 'Sil', undo: 'Geri al', change: 'Değiştir', show: 'Göster', restore: 'Geri yükle', paste: 'Yapıştır', search: 'Ara', sort: 'Sırala', all: 'Tümü',
  dashTitle: 'Kaydettiğin Reels\'ler', quickAddLabel: 'Reel bağlantısı ekle', pasteReelLink: 'Instagram Reel bağlantısını yapıştır', reelLink: 'Reel bağlantısı',
  statReels: 'Reel', statCategories: 'Kategori', statReview: 'Kategori bekliyor',
  setupTitle: 'Önce kategorilerini oluştur', setupText: 'Reels\'ler senin belirlediğin kategorilere ayrılır. Önerilerle başla ya da kendin oluştur.', setupAction: 'Kategorileri kur',
  reviewTitle: 'Kategori bekleyenler', reviewHint: 'Bunlar kesin olarak ayrılamadı. Seçmek için birine dokun.', seeAll: 'Tümünü gör',
  recentTitle: 'Son eklenenler', emptyDashTitle: 'Henüz Reel yok', emptyDashText: 'Instagram\'dan bir Reel\'i bu uygulamaya paylaş, yukarıya bağlantı yapıştır ya da Instagram veri dışa aktarımını içe al.',
  unknownCreator: 'Paylaşan bilinmiyor', noCaption: 'Açıklama yok', chooseCategory: 'Kategori seç', uncategorized: 'Kategorisiz', openInstagram: 'Instagram\'da aç', reelDetails: 'Reel ayrıntıları',
  added: 'Eklenme', savedOnInstagram: 'Instagram\'da kaydedilme', type: 'Tür', source: 'Kaynak', collection: 'Instagram koleksiyonu',
  kind_reel: 'Reel', kind_post: 'Gönderi', kind_tv: 'IGTV videosu', kind_share: 'Paylaşım bağlantısı',
  source_manual: 'Elle eklendi', source_share: 'Instagram\'dan paylaşıldı', source_export: 'Instagram veri dışa aktarımı', source_backup: 'Yedekten geri yüklendi',
  sharedTitle: 'Paylaşılan başlık', caption: 'Açıklama', noCaptionHelp: 'Reel eklendiğinde açıklama mümkünse Instagram\'ın herkese açık gömülü sayfasından alınır. Buraya kendin de yapıştırabilir veya düzenleyebilirsin; aramayı ve kategorilemeyi iyileştirir.',
  editCaption: 'Açıklamayı düzenle', addCaption: 'Açıklama ekle', captionHelp: 'Açıklamayı Instagram\'dan kopyalayıp buraya yapıştır. Arama ve otomatik kategori seçiminde kullanılır.', captionPlaceholder: 'Reel açıklamasını yapıştır…', recategorizeAfterCaption: 'Bu açıklamaya göre kategori öner',
  category: 'Kategori', notes: 'Notlar', notesPlaceholder: 'Bunu neden kaydettin?',
  autoBy_keyword: 'Anahtar kelimelerle otomatik ayrıldı: {words}', autoBy_collection: 'Instagram koleksiyonundan ayrıldı: {words}', autoBy_creator: '{words} için önceki seçimlerine göre ayrıldı', autoBy_ai: 'Yapay zekâ sağlayıcın tarafından ayrıldı',
  suggested: 'Önerilen', matchedOn: 'Eşleşen: {words}', otherCategories: 'Diğer kategoriler', allCategories: 'Kategoriler', newCategoryName: 'Yeni kategori adı',
  filedUnder: '{name} kategorisine eklendi', categoryCleared: 'Kategori kaldırıldı', instagramPreview: 'Instagram önizlemesi', loadPreview: 'Instagram önizlemesini yükle',
  copyLink: 'Bağlantıyı kopyala', linkCopied: 'Bağlantı kopyalandı', copyFailed: 'Kopyalanamadı', deleteReelQ: 'Bu Reel silinsin mi?', deleteReelMsg: 'Yalnızca bu uygulamadan silinir. Instagram\'da hiçbir şey değişmez.', reelDeleted: 'Reel silindi',
  noCategoriesYet: 'Henüz kategorin yok.', createCategory: 'Kategori oluştur',
  addTitle: 'Reel ekle', manualTitle: 'Bağlantıyla ekle', reelLinks: 'Reel bağlantı(lar)ı', urlPlaceholder: 'https://www.instagram.com/reel/…\nBirden fazlası için her satıra bir bağlantı',
  captionOptional: 'Açıklama (isteğe bağlı)', notesOptional: 'Notlar (isteğe bağlı)', autoCategory: 'Otomatik seç', saveReel: 'Reel\'i kaydet',
  validLink: 'Geçerli {kind} bağlantısı', validLinks: '{n} geçerli bağlantı', multiNote: 'Açıklama ve notlar yalnızca tek bağlantı eklerken kullanılır.', someInvalid: '{n} satır geçerli bir Instagram bağlantısı değildi',
  urlErr_empty: 'Önce bir Instagram Reel bağlantısı yapıştır.', urlErr_not_url: 'Bu bir web bağlantısı değil. Bağlantıyı Instagram\'dan kopyala (Paylaş → Bağlantıyı kopyala).', urlErr_not_instagram: 'Bu bağlantı Instagram\'a ait değil.', urlErr_unsupported: 'Bu Instagram bağlantısı bir Reel veya gönderi değil (profil, hikâye ve ses sayfaları desteklenmez).',
  willFile: 'Şuraya eklenecek:', maybe: 'Olabilir:', willAsk: 'Onaylaman istenecek.', noMatchWillAsk: 'Hiçbir kategori eşleşmedi. Seçmen istenecek.', noTextWillAsk: 'Tek başına bağlantıda kategori seçmek için metin yok. Açıklama ya da not ekle; yoksa seçmen istenecek.', noCategoriesHint: 'Otomatik kategori seçimi için kategori oluştur.',
  savedTo: '{name} kategorisine kaydedildi', whereToFile: 'Bu Reel nereye gitsin?', addedMany: '{n} Reel eklendi, {filed} tanesi otomatik ayrıldı', alreadySaved: 'Bu Reel zaten kitaplığında', alreadySavedMany: '{n} Reel zaten kitaplığındaydı',
  clipboardEmpty: 'Pano boş', shareNoLink: 'Paylaşılan içerikte Instagram bağlantısı yoktu. Bağlantıyı aşağıya yapıştır.',
  shareTitle: 'Doğrudan Instagram\'dan paylaş', shareStep1: 'Instagram\'da bir Reel aç ve Paylaş (kâğıt uçak) düğmesine dokun.', shareStep2: '“Şurada paylaş…” (ya da “Diğer”) seçeneğine dokun ve Stash\'yı seç.', shareStep3: 'Reel kaydedilir ve ayrılır. Emin olunamazsa uygulama sana kategoriyi sorar.',
  shareNote: 'Stash listede yoksa “Bağlantıyı kopyala”yı kullanıp buraya yapıştır.',
  exportTitle: 'Instagram veri dışa aktarımından al', exportIntro: 'Instagram, kaydettiğin her şeyin bağlantılarını içeren bir dosya verebilir. Hepsini tek seferde eklemek için içe al.', exportHowTo: 'Dosya nasıl alınır',
  exportStep1: 'Instagram → Profil → ☰ → Hesaplar Merkezi → Bilgilerin ve izinlerin.', exportStep2: 'Bilgilerini dışa aktar → Dışa aktarma oluştur → Instagram hesabını seç → Cihaza aktar.', exportStep3: 'Bilgileri özelleştir: yalnızca “Kaydedilenler”i seç. Tarih aralığı: Tüm zamanlar. Biçim: JSON.', exportStep4: 'Dışa aktarmayı başlat. ZIP hazır olunca Instagram bildirim gönderir (birkaç dakika ile birkaç gün arası).', exportStep5: 'ZIP\'i indir ve burada seç. Açmana gerek yok.',
  chooseExportFile: 'ZIP / JSON dosyası seç', reading: '{name} okunuyor…', exportNoLinks: 'Bu dosyada Instagram bağlantısı bulunamadı.',
  exportErr_not_zip: 'Bu dosya okunamadı.', exportErr_zip64: 'Bu ZIP çok büyük. Yalnızca “Kaydedilenler”i dışa aktarıp tekrar dene ya da ZIP\'i açıp saved_posts.json dosyasını seç.', exportErr_corrupt: 'ZIP dosyası bozuk görünüyor. Yeniden indir.', exportErr_no_inflate: 'Bu cihaz ZIP açamıyor. ZIP\'i açıp saved_posts.json dosyasını seç.', exportErr_unsupported_method: 'Bu ZIP desteklenmeyen bir sıkıştırma kullanıyor. Açıp saved_posts.json dosyasını seç.', exportErr_no_saved_file: 'Bu ZIP\'te kaydedilen gönderi bulunamadı. Dışa aktarmayı oluştururken “Kaydedilenler”in seçili olduğundan emin ol.', exportErr_generic: 'Bu dosya içe alınamadı.',
  exportPreviewTitle: 'Kaydedilenleri içe al', fromFiles: 'Kaynak: {files}', postsLabel: 'Fotoğraf gönderileri', alreadyInLibrary: 'Zaten kitaplıkta', collections: 'Koleksiyonlar', includePosts: 'Fotoğraf gönderilerini de al (sadece Reels değil)', collectionsAsCategories: 'Instagram koleksiyonlarımı kategori olarak kullan', importN: '{n} öğeyi al', importDone: '{added} öğe alındı, {assigned} tanesi otomatik ayrıldı, {dup} kopya atlandı',
  exportHonest: 'Dışa aktarım yalnızca bağlantıyı, paylaşanı ve kaydetme tarihini içerir; açıklama veya küçük resim yoktur. Ayrılamayanlar “Kategori bekliyor” bölümünde bekler.',
  libraryTitle: 'Kitaplık', searchPlaceholder: 'Açıklama, paylaşan, not ara…', sortNewest: 'Önce en yeni', sortOldest: 'Önce en eski', filterByCategory: 'Kategoriye göre filtrele', needsCategory: 'Kategori bekliyor', resultCount: '{n} Reel',
  emptyLibTitle: 'Kitaplığın boş', emptyLibText: 'Eklediğin Reels\'ler burada aranmaya ve filtrelenmeye hazır şekilde görünür.', noResultsTitle: 'Bir şey bulunamadı', noResultsText: '“{q}” ile eşleşen Reel yok.', noResultsCat: 'Bu filtrede henüz Reel yok.', clearFilters: 'Filtreleri temizle',
  categoriesTitle: 'Kategoriler', categoriesIntro: 'Her kategorinin anahtar kelimeleri var. Bir Reel geldiğinde açıklaması, başlığı ve notları bunlarla eşleştirilir.', newCategory: 'Yeni kategori', editCategory: 'Kategoriyi düzenle',
  emptyCatTitle: 'Henüz kategori yok', emptyCatText: 'Hazır kategorilerle (Türkçe ve İngilizce anahtar kelimelerle) başla ya da kendin oluştur.', useStarters: 'Önerileri kullan', createOwn: 'Kendim oluşturayım', addStarters: 'Önerilen kategorileri ekle',
  startersTitle: 'Önerilen kategoriler', startersHelp: 'Her biri sonradan düzenleyebileceğin anahtar kelimelerle gelir.', alreadyExists: 'Zaten var', addSelected: 'Seçilenleri ekle', startersAdded: '{n} kategori eklendi',
  nReels: '{n} Reel', nKeywords: '{n} anahtar kelime', showReelsIn: '{name} içindeki Reels\'leri göster', editNamed: '{name} kategorisini düzenle',
  name: 'Ad', categoryNamePlaceholder: 'ör. Tarifler', color: 'Renk', keywords: 'Anahtar kelimeler', keywordsHelp: 'Bu kategoriyi işaret eden kelimeler veya #etiketler. Virgülle ayır. Büyük/küçük harf ve Türkçe karakterler fark etmez.', keywordPlaceholder: 'makarna, #tarif, akşam yemeği', noKeywords: 'Henüz anahtar kelime yok; yalnızca kategori adı eşleştirilir.', removeKeyword: '{k} kaldır',
  color_coral: 'Mercan', color_amber: 'Kehribar', color_green: 'Yeşil', color_teal: 'Camgöbeği', color_blue: 'Mavi', color_violet: 'Mor', color_rose: 'Gül', color_slate: 'Arduvaz',
  categoryCreated: '“{name}” kategorisi oluşturuldu', categorySaved: 'Kategori kaydedildi', categoryDeleted: 'Kategori silindi',
  deleteCategoryQ: '“{name}” silinsin mi?', deleteCategoryMsg: 'İçindeki {n} Reel “Kategori bekliyor” bölümüne taşınır. Reels\'ler silinmez.', deleteCategoryEmpty: 'Bu kategori boş.',
  err_empty_name: 'Bir ad gir.', err_duplicate_name: 'Bu adla bir kategori zaten var.', err_not_found: 'Bu kategori artık yok.', err_generic: 'Bir şeyler ters gitti. Tekrar dene.',
  autoTitle: 'Otomatik kategori', autoText: 'Kategori veya anahtar kelime ekledikten sonra bekleyen Reels\'leri yeniden ayır. Kendi yerleştirdiğin Reels\'lere asla dokunulmaz.', recheck: 'Bekleyenleri ayır ({n})', recheckDone: '{n} Reel ayrıldı',
  settingsTitle: 'Ayarlar', general: 'Genel', language: 'Dil', deviceLanguage: 'Cihaz dili', theme: 'Tema', theme_system: 'Sistem', theme_light: 'Açık', theme_dark: 'Koyu',
  autoAssign: 'Otomatik kategori ata', autoAssignHint: 'Eşleşme netse sormadan kategoriye ekle.', embedPreview: 'Instagram önizlemelerini otomatik yükle', embedPreviewHint: 'Reel ayrıntılarında Instagram\'ın resmi gömülü görünümünü gösterir. Bu, Instagram\'a bağlanır.',
  aiTitle: 'Yapay zekâ ile kategori seçimi (isteğe bağlı)', aiEnable: 'Yapay zekâ sağlayıcısı kullan', aiEnableHint: 'Yalnızca anahtar kelimelerin ayıramadığı ve metni olan Reels için. O metni ve kategori adlarını seçtiğin sağlayıcıya gönderir.',
  aiProvider: 'Sağlayıcı', aiBaseUrl: 'API adresi', aiModel: 'Model', aiModelPlaceholder: 'ör. gpt-4o-mini', aiKey: 'API anahtarı', aiKeyPlaceholder: 'Yalnızca bu cihazda saklanır', aiKeyHint: 'Bu cihazda tutulur. Yedeklere asla eklenmez.', aiTest: 'Bağlantıyı test et', aiTesting: 'Test ediliyor…', aiIncomplete: 'Önce API adresi, model ve anahtarı gir.', aiOk: 'Çalışıyor. Test açıklaması şuraya ayrıldı: {name}', aiOddReply: 'Bağlandı ama yanıt anlaşılamadı. Başka bir model dene.', aiFailed: 'Yapay zekâ ile kategori seçimi başarısız: {msg}',
  dataTitle: 'Verilerin', dataText: '{reels} Reel ve {cats} kategori yalnızca bu cihazda saklanıyor.', exportData: 'Yedeği dışa aktar (JSON)', importData: 'Yedeği geri yükle', backupSaved: 'Yedek kaydedildi', backupSaveFailed: 'Kaydedilemedi: {msg}',
  coversTitle: 'Kapak ve paylaşan bilgisi', coversText: 'Kapak, paylaşan ve açıklama bilgisi, uygulamanın önizlemede de kullandığı Instagram\'ın herkese açık resmî gömülü sayfasından alınır. Orijinal görsel bağlantıları eskidiğinde ve çevrimdışyken de görünsünler diye bu cihaza indirilir.',
  backfillBtn: 'Mevcut reelleri güncelle', backfillNone: 'Tüm reellerin kapağı zaten var.', backfillDone: '{n} reelin {ok} tanesi güncellendi.',
  cacheUsage: 'Kapak önbelleği: {size}', clearCache: 'Kapak önbelleğini temizle', cacheCleared: 'Kapak önbelleği temizlendi.', cacheClearFailed: 'Önbellek temizlenemedi.',
  coverRefresh: 'Kapağı yenile', coverRefreshOk: 'Kapak ve paylaşan bilgisi güncellendi.', coverRefreshFailed: 'Kapak alınamadı. Instagram\'ın erişilemediği veya gönderi silinmiş olabilir; daha sonra tekrar dene.',
  tags: 'Etiketler', noTagsYet: 'Henüz etiket yok. Etiketler aramayı kolaylaştırır.', addTag: 'Etiket ekle', addTagPlaceholder: 'Etiket yaz ve Enter\'a bas…', removeTag: 'Etiketi kaldır: {t}', addTagSuggestion: '+ {t}', suggestedTags: 'Önerilen etiketler', suggestedTagsHint: 'İstediklerine dokun — yalnızca onayınla uygulanırlar.', createNewNamed: '“{name}” kategorisini oluştur', rejectAll: 'Hepsini reddet', suggestionsRejected: 'Öneriler reddedildi. İstediğin zaman elle kategorileyebilirsin.', filterByTag: 'Etikete göre süz', viewGrid: 'Izgara görünüm', viewList: 'Liste görünüm', select: 'Seç', selectedCount: '{n} seçildi', categorize: 'Kategorile', categorizeSelected: 'Seçilen {n} Reel\'i kategorile', deleteSelectedQ: '{n} Reel silinsin mi?', deleteSelectedMsg: 'Seçilen Reeller bu cihazdan kalıcı olarak kaldırılacak.', deletedMany: '{n} Reel silindi', filedMany: '{n} Reel “{name}” altına alındı', categoryClearedMany: '{n} Reel\'in kategorisi kaldırıldı', clearCategory: 'Kategoriyi kaldır', revisitTitle: 'Bugün tekrar bak', clipboardOffer: 'Panoda kaydedilmemiş bir Instagram bağlantısı var — eklensin mi?',
  aiSuggestTags: 'Etiket önerileri', aiWhatSent: 'Sağlayıcıya gönderilenler tam olarak şunlar: Reel\'ın başlığı, açıklaması, notların, paylaşanın adı/kullanıcı adı ve kategorilerinin adları ile anahtar kelimeleri. Başka hiçbir şey. Etiket önerilerini bu düğmeyle kapatabilirsin.', aiErrAuth: 'Sağlayıcı API anahtarını kabul etmedi. Ayarlar\'dan anahtarı kontrol et.', aiErrQuota: 'Sağlayıcının kotası veya fatura limiti doldu.', aiErrOffline: 'Sağlayıcıya ulaşılamadı. Bağlantını kontrol edip tekrar dene.',
  backupErr_invalid: 'Bu geçerli bir yedek dosyası değil.', backupErr_wrong_app: 'Bu dosya bir Stash yedeği değil.', backupErr_newer_schema: 'Bu yedek daha yeni bir uygulama sürümünden. Önce uygulamayı güncelle.',
  restoreTitle: 'Yedeği geri yükle', restoreFound: 'Yedekte {reels} Reel ve {cats} kategori var ({date}).', restoreMerge: 'Birleştir', restoreMergeHint: 'Mevcut verileri koru, eksik olanları ekle. Kopyalar atlanır.', restoreReplace: 'Değiştir', restoreReplaceHint: 'Mevcut Reels ve kategorileri sil, ardından yedeği yükle.', restoreDone: '{reels} Reel ve {cats} yeni kategori geri yüklendi ({dup} kopya atlandı)',
  wipe: 'Tüm verileri sil', wipeQ: 'Her şey silinsin mi?', wipeMsg: 'Tüm Reels, kategoriler ve ayarlar bu cihazdan silinir. Gerekebilirse önce yedek al.', wipeConfirm: 'Her şeyi sil', wiped: 'Tüm veriler silindi',
  privacyTitle: 'Gizlilik', privacy1: 'Her şey bu cihazda saklanır. Hesap ya da sunucu yok.', privacy2: 'Uygulama Instagram şifreni asla istemez; Instagram çerezlerini veya özel verilerini okumaz.', privacy3: 'Yapay zekâ ile kategori seçimini açmadıkça ya da Instagram önizlemesi yüklemedikçe hiçbir yere veri gönderilmez.', privacy4: 'Bir Reel\'i açmak bağlantıyı Instagram uygulamasına iletir (internet gerekir).',
  worksTitle: 'Neler çalışır, neler çalışmaz', works1: 'Instagram uygulamasından paylaşma, bağlantıyı elle ekleme ve veri dışa aktarımını içe alma çevrimdışı çalışır.', works2: 'Instagram, uygulamaların kayıtlı listeni okumasına izin vermez; açıklama ve küçük resimler hesabından değil, Instagram\'ın herkese açık resmî gömülü sayfasından alınır (erişilebilirse).', works3: 'Aynı Reel\'in farklı bağlantı biçimleri dahil kopya bağlantılar algılanır.', works4: 'Yeni “instagram.com/share/…” bağlantıları çevrimdışı çözülemez; bunlarda kopya kontrolü yalnızca aynı paylaşım bağlantısına karşı çalışır.', works5: 'Küçük resimler herkese açık gömülü sayfadan alınıp bu cihazda saklanır. Alınamazsa kartta bir yer tutucu ve yeniden deneme düğmesi görünür.',
  dbErrorTitle: 'Depolama kullanılamıyor', dbErrorText: 'Uygulama yerel veritabanını açamadı.',
};

export const DICTS = { en, tr };

let current = pickDefault();
const listeners = new Set();

function pickDefault() {
  const n = (globalThis.navigator && navigator.language) || 'en';
  return n.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function lang() {
  return current === 'tr' ? 'tr-TR' : 'en-US';
}

export function langCode() {
  return current;
}

export function setLang(code) {
  const next = code === 'tr' || code === 'en' ? code : pickDefault();
  const changed = next !== current;
  current = next;
  if (globalThis.document) document.documentElement.lang = current;
  if (changed) for (const fn of listeners) fn(current);
}

export function onLangChange(fn) {
  listeners.add(fn);
}

export function has(key) {
  return key in DICTS[current] || key in en;
}

export function t(key, vars) {
  let s = DICTS[current][key] ?? en[key];
  if (s == null) return key;
  if (s.includes('|')) {
    const [one, other] = s.split('|');
    s = vars && Number(vars.n) === 1 ? one : other;
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
  return s;
}

/** Translate with a fallback key when `key` is unknown. */
export function tf(key, fallback, vars) {
  return has(key) ? t(key, vars) : t(fallback, vars);
}
