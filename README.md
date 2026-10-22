<div align="center">

<img src="www/icons/icon.svg" width="88" alt="Sakla simgesi" />

# Sakla

**Instagram'da kaydettiğin Reels'leri kendi kategorilerine ayıran, tamamen cihazında çalışan Android uygulaması.** (Eski adı: Reels Organizer)

[![CI](https://github.com/firatnexus/reels-organizer/actions/workflows/ci.yml/badge.svg)](https://github.com/firatnexus/reels-organizer/actions/workflows/ci.yml)
[![Android APK](https://github.com/firatnexus/reels-organizer/actions/workflows/android.yml/badge.svg)](https://github.com/firatnexus/reels-organizer/actions/workflows/android.yml)
[![Release](https://img.shields.io/github/v/release/firatnexus/reels-organizer?label=APK)](https://github.com/firatnexus/reels-organizer/releases/latest)
![Android 6.0+](https://img.shields.io/badge/Android-6.0%2B-3DDC84?logo=android&logoColor=white)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

[**APK'yı indir**](https://github.com/firatnexus/reels-organizer/releases/latest) · [Nasıl çalışır](#nasıl-çalışır) · [Instagram ile ne çalışır?](#instagram-ile-ne-çalışır-ne-çalışmaz) · [Geliştirme](#geliştirme) · [English](#english)

<img src="docs/screenshots/light-home.png" width="236" alt="Ana sayfa" /><img src="docs/screenshots/light-library.png" width="236" alt="Kitaplık" /><img src="docs/screenshots/light-pick.png" width="236" alt="Kategori seçimi ve etiket önerileri" /><img src="docs/screenshots/dark-detail.png" width="236" alt="Ayrıntı sayfası, karanlık tema" />

</div>

---

## Özellikler

- **Instagram'dan paylaş → kaydet.** Instagram'da bir Reel'de *Paylaş → Sakla'ya kaydet*'e dokun; bağlantı kaydedilir ve kategoriye ayrılır.
- **Bağlantı yapıştır.** Tek bağlantı ya da her satıra bir tane olacak şekilde toplu ekleme. Panodan tek dokunuşla yapıştırma.
- **Instagram veri dışa aktarımını içe al.** Instagram'ın "Bilgilerini indir" ZIP/JSON/HTML dosyasındaki kaydedilenleri tek seferde ekler. Instagram koleksiyonlarını kategori olarak alabilir.
- **Kendi kategorilerin.** Oluştur, yeniden adlandır, renk ve anahtar kelime ver, sil. Tarifler, Oyun Fikirleri, Teknoloji, Seyahat, Komik Videolar, Öğrenme gibi hazır öneriler TR/EN anahtar kelimelerle gelir.
- **Güvenilir otomatik kategori.** Anahtar kelime, hashtag, Instagram koleksiyonu ve senin önceki seçimlerine (aynı paylaşan) göre puanlar. Emin değilse **sana sorar**; tahmin uydurmaz.
- **İsteğe bağlı yapay zekâ.** OpenAI, Gemini, OpenRouter, Anthropic ya da OpenAI uyumlu herhangi bir uç nokta. Yalnızca sen açarsan ve yalnızca anahtar kelimelerin ayıramadığı, metni olan Reels için kullanılır.
- **Kapak resimleri.** Kayıt sırasında Instagram'ın herkese açık embed sayfasından kapak ve paylaşan bilgisi çekilir, ≤480px WebP olarak cihazda saklanır. Kapak gelmezse "Kapak yenile" ile tekrar denenebilir; Ayarlar'da önbellek boyutu ve temizleme var. Mevcut kayıtlar için tek seferlik "Mevcut reelleri güncelle" düğmesi.
- **Etiketler.** Elle eklenir veya AI önerisiyle önerilir (3-5 etiket, dokunarak onaylanır, asla otomatik uygulanmaz). Kitaplıkta etiket çipleri ve etiketle arama.
- **Ana sayfa / Kitaplık ayrımı.** Ana sayfa: hızlı ekleme, istatistikler, "Bugün tekrar bak" (eski bir Reel), kategori bekleyenler. Kitaplık: tüm koleksiyon — arama, sıralama, kategori/etiket filtreleri, liste/ızgara görünümü, çoklu seçimle toplu kategorileme/silme.
- **Hızlı bulma.** Açıklama, paylaşan, not, etiket ve kategori adında arama (Türkçe karakterlere duyarsız: `sarki` → "şarkı"), kategori filtreleri, en yeni/en eski sıralama.
- **Kopya kontrolü.** `instagram.com/reel/…`, `/reels/…`, `m.instagram.com`, `?igsh=` gibi farklı biçimler aynı Reel olarak tanınır.
- **Yedekle / geri yükle.** Tüm kitaplığı JSON olarak dışa aktar; birleştirerek ya da tamamen değiştirerek geri yükle.
- **Yerel ve özel.** Hesap yok, sunucu yok, analitik yok. Veriler IndexedDB'de, cihazında kalır. Android bulut yedeğine de gönderilmez.
- **Native hissiyat.** Açılışta animasyonlu karşılama ekranı (beyaz parlama yok), aşağı kaydırarak kapanan alt sayfalar, dokunma titreşimi (haptic), basınç efektli düğmeler.
- **Pano önerisi.** Uygulama ön plana geldiğinde panoda kaydedilmemiş bir Instagram bağlantısı varsa net bir istemle sunulur; hiçbir şey sen dokunmadan eklenmez.
- Türkçe / İngilizce arayüz, açık/koyu tema, Android geri tuşu desteği, tamamen çevrimdışı açılış (fontlar dahil her şey APK içinde).

## Kurulum (APK)

1. Telefonundan [son sürüm sayfasını](https://github.com/firatnexus/reels-organizer/releases/latest) aç ve `reels-organizer-x.y.z.apk` dosyasını indir.
2. Dosyayı aç. Android "bilinmeyen uygulamaları yükleme" izni isterse tarayıcın (ya da dosya yöneticin) için **bu kaynağa izin ver**'i aç.
3. **Yükle**'ye dokun, ardından uygulamayı aç.
4. Instagram'da bir Reel'de **Paylaş** (kâğıt uçak) → **Diğer / Şuraya paylaş…** → **Sakla'ya kaydet**. İlk seferde listede en sona düşebilir; uzun basıp sabitleyebilirsin.

> Android 6.0 ve üzeri, güncel bir **Android System WebView** (Chrome 111+) gerekir; Play Store üzerinden otomatik güncellenir.
>
> Play Store'da yayınlanmadığı için Play Protect "tanınmayan uygulama" uyarısı gösterebilir. Uygulama hiçbir izin istemez; yalnızca `INTERNET` (Reel'i Instagram'da açmak, isteğe bağlı önizleme ve yapay zekâ için) bildirilir.
>
> Güncellemeler aynı imza anahtarıyla imzalanır, yeni APK'yı eskisinin üzerine kurabilirsin; veriler korunur.

## Nasıl çalışır

```text
Instagram ──Paylaş──▶ Android paylaşım menüsü ──ACTION_SEND──▶ ReelsBridge (Java)
                                                                    │
Bağlantı yapıştır / toplu ekle / dışa aktarım dosyası ───────────────┤
                                                                    ▼
                     instagram/url.js  ─▶ doğrula, kanonik URL, kopya anahtarı
                     categorize/engine ─▶ anahtar kelime + koleksiyon + paylaşan geçmişi
                                         (emin değilse) ─▶ isteğe bağlı yapay zekâ
                                         (hâlâ emin değilse) ─▶ kullanıcıya sor
                     instagram/embed  ─▶ herkese açık embed sayfasından kapak/paylaşan/etiket ( başarısızsa sessizce atlanır)
                     storage/repo.js   ─▶ IndexedDB (reels, categories, settings)
```

### Kategori seçimi

| Sinyal | Ağırlık | Not |
| --- | --- | --- |
| Kategori adı metinde geçiyor | 1.5 | |
| Anahtar kelime (tam kelime) | 1.0 | |
| Hashtag ile eşleşme (`#gamedev`, `#easyRecipe`) | ×1.5 | camelCase/alt çizgi bölünür |
| Çok kelimeli ifade (`akşam yemeği`) | 1.2 | |
| Önek (`tarif` → `tarifi`) | 0.8 | |
| Instagram koleksiyon adı = kategori adı veya anahtar kelimesi | +3 | dışa aktarımdan gelir |
| Aynı paylaşan için senin önceki seçimlerin | en fazla +2 | yalnızca elle yaptığın seçimler sayılır |

En iyi puan **≥ 1** ve ikincinin **en az 2 katı** ise Reel otomatik eklenir. Değilse "Kategori bekleyenler"e düşer ve önerilerle birlikte seçmen istenir. Metin yoksa (örneğin sadece bağlantı paylaşıldıysa) uygulama açıklama uydurmaz; seçimi sana bırakır ya da açıklamayı yapıştırmanı önerir.

Yapay zekâ açıksa: yalnızca yerel sonuç *emin değilse* ve Reel'in gerçek bir metni varsa çağrılır. Model en fazla 3 mevcut kategori ve en fazla 1 yeni kategori önerir; güven ≥ 0.6 ise otomatik eklenir, altındaysa sadece öneri olur. Ayrıca 3-5 etiket önerir — bunlar asla otomatik uygulanmaz, dokunarak onaylanır ("Hepsini reddet" ile tümü reddedilir). Ayarlar'da ne gönderildiği yazar (yalnızca Reel metni ve kategori adları) ve öneriler tamamen kapatılabilir.

## Instagram ile ne çalışır, ne çalışmaz?

Bu uygulama Instagram'a **giriş yapmaz**, şifre veya çerez istemez, sayfaları arka planda okumaz. Bu kısıtlar bilinçli ve aşağıdaki tabloyu belirler:

| Özellik | Durum | Neye bağlı |
| --- | --- | --- |
| Instagram'dan *Paylaş → Sakla'ya kaydet* | ✅ Çalışır | Android paylaşım menüsü (`ACTION_SEND text/plain`). Instagram yalnızca **bağlantıyı** paylaşır. |
| Bağlantı yapıştırma, toplu ekleme, panodan yapıştırma | ✅ Çalışır, çevrimdışı | — |
| Instagram veri dışa aktarımından toplu içe aktarma | ✅ Çalışır, çevrimdışı | Instagram'ın dışa aktarım biçimi (`your_instagram_activity/saved/saved_posts.json`, `saved_collections.json`). Meta biçimi değiştirirse ayrıştırıcının güncellenmesi gerekebilir. |
| Kopya algılama | ✅ Çalışır | Kısa kod içeren bağlantılarda tam. Yeni `instagram.com/share/…` bağlantıları çevrimdışı çözülemez; bunlarda yalnızca aynı paylaşım bağlantısı tekrar edilirse yakalanır. |
| "Instagram'da aç" | ✅ Çalışır | Instagram uygulaması yüklüyse orada, değilse tarayıcıda açılır (internet gerekir). |
| Paylaşan kullanıcı adı | ✅ Çoğunlukla | Kayıt sırasında herkese açık embed sayfasından çekilir ve saklanır; gelmezse bağlantıdaki, paylaşılan metindeki veya dışa aktarımdaki bilgi kullanılır. |
| Açıklama (caption) | ✅ Çoğunlukla | Kayıt sırasında embed sayfasından çekilir. Instagram paylaşırken açıklamayı göndermez; gelmezse elle yapıştırabilirsin. |
| Küçük resim | ✅ Kayıt sırasında | Meta oEmbed yanıtlarından `thumbnail_url` alanını kaldırdığı için herkese açık embed sayfası kullanılır; kapak ≤480px WebP olarak cihazda saklanır. Gizli/kaldırılmış içerikte gelmez — "Kapak yenile" ile tekrar denenebilir. |
| Kaydedilenleri Instagram'dan otomatik çekme | ❌ Yok | Instagram'ın resmi API'si kişisel hesaplarda kaydedilenleri vermez. Bunu yapan araçlar şifre/çerez kullanır; bu uygulama kullanmaz. Toplu aktarım için **veri dışa aktarımını** kullan. |

### Instagram veri dışa aktarımı nasıl alınır

1. Instagram → **Ayarlar ve gizlilik** → **Hesaplar Merkezi** → **Bilgilerin ve izinlerin** → **Bilgilerini indir**.
2. **Bilgileri indir veya aktar** → Instagram hesabın → **Bilgilerin bir kısmı** → **Kaydedilenler**.
3. **Cihaza indir**, biçim **JSON**, tarih aralığı **Tüm zamanlar**.
4. Hazır olduğunda gelen ZIP'i indir ve uygulamada **Ekle → Instagram veri dışa aktarımından al** ile seç. ZIP'i açmana gerek yok.

## Gizlilik

- Tüm veriler cihazdaki IndexedDB'de durur. Uygulamanın sunucusu yok.
- Android otomatik bulut yedeği ve cihazdan cihaza aktarım kapalıdır (`allowBackup=false`, `data_extraction_rules.xml`). Taşımak için uygulama içi JSON yedeğini kullan.
- Ağ yalnızca şu durumlarda kullanılır: Reel'i Instagram'da açtığında, gömülü önizlemeyi kendin yüklediğinde (Instagram'a bağlanır) ve yapay zekâyı açtıysan (Reel metni + kategori adları seçtiğin sağlayıcıya gider).
- Yapay zekâ API anahtarı yalnızca cihazda saklanır ve yedeklere **asla** yazılmaz.

## Geliştirme

Gereksinimler: Node.js 20+, JDK 21, Android SDK (platform 35, build-tools 35).

```bash
npm install
npm run serve          # www/ klasörünü http://localhost:5173 adresinde açar (tarayıcıda hızlı geliştirme)
npm test               # birim testleri (node:test)
npx playwright install chromium
npm run test:e2e       # uçtan uca testler (telefon + masaüstü görünümü)
npm run apk:debug      # android/app/build/outputs/apk/debug/app-debug.apk
```

Android Studio ile çalışmak için: `npm run sync && npx cap open android`.

### İmzalı sürüm APK'sı

`android/keystore.properties` (git'e girmez) ya da ortam değişkenleri:

```properties
storeFile=/tam/yol/reels-organizer-release.jks
storePassword=…
keyAlias=reels-organizer
keyPassword=…
```

```bash
npm run apk:release    # android/app/build/outputs/apk/release/app-release.apk
```

GitHub Actions'ta aynı imzayı kullanmak için depo sırları: `RO_KEYSTORE_BASE64` (`base64 -w0 release.jks`), `RO_KEYSTORE_PASSWORD`, `RO_KEY_ALIAS`, `RO_KEY_PASSWORD`. Sırlar yoksa iş akışı debug APK üretir. `v*` etiketi gönderildiğinde APK otomatik olarak GitHub Release'e eklenir.

### Yeni sürüm

1. `www/src/version.js` içinde `APP_VERSION` ve `VERSION_CODE` değerlerini artır (Gradle sürümü buradan okur).
2. `CHANGELOG.md`'yi güncelle.
3. `git tag vX.Y.Z && git push --tags`.

### Proje yapısı

```text
www/                        Capacitor'ın APK'ya paketlediği web katmanı (derleme adımı yok, saf ES modülleri)
├─ index.html
├─ styles/app.css           mobil öncelikli arayüz, açık/koyu tema
├─ fonts/                   Satoshi + Cabinet Grotesk (Fontshare, APK içinde)
├─ vendor/capacitor.js      @capacitor/core çalışma zamanı (scripts/vendor.mjs kopyalar)
└─ src/
   ├─ app.js                yönlendirici, paylaşım kuyruğu, geri tuşu
   ├─ instagram/url.js      Instagram bağlantı ayrıştırma, doğrulama, kanonik URL
   ├─ categorize/           normalize · keyword · creator · ai · engine · starters
   ├─ io/                   zip okuyucu · Instagram dışa aktarım ayrıştırıcı · JSON yedek
   ├─ storage/              IndexedDB (db.js) ve depo katmanı (repo.js)
   ├─ core/                 store (uygulama durumu) · platform (yerel köprü) · i18n
   └─ ui/                   dom yardımcıları · bileşenler · tema · views/
android/                    Capacitor 7 Android projesi
└─ app/src/main/java/…/ReelsBridgePlugin.java   paylaşım alma, Instagram'da açma, dosya kaydetme, pano, sistem çubukları
tests/unit/                 node:test + fake-indexeddb
tests/e2e/                  Playwright: 8 temel iş akışı + dışa aktarım içe alma
scripts/                    serve.mjs · vendor.mjs · make_icons.mjs
```

### Testler neyi kapsar

| İş akışı | Test |
| --- | --- |
| 1. Kategori oluştur / yeniden adlandır / sil, aynı ad engeli, önerilen kategoriler | `e2e: 1 ·`, `store.test` |
| 2. Reel bağlantısı ekle, geçersiz bağlantı hataları, kopya algılama | `e2e: 2+3 ·`, `url.test`, `store.test` |
| 3. Otomatik kategori, emin değilse sorma, elle değiştirme | `e2e: 2+3 ·`, `categorize.test` |
| 4. Arama (Türkçe karakter duyarsız), filtre, sıralama | `e2e: 4 ·` |
| 5. Instagram'da aç | `e2e: 5 ·` (tarayıcıda açılır pencere; Android'de `ACTION_VIEW`) |
| 6. Yedeği dışa aktar → sil → geri yükle | `e2e: 6 ·`, `store.test` |
| 7. Açılış, tüm ekranlar, dış istek olmadan yüklenme | `e2e: 7 ·` + CI'da APK derlemesi |
| 8. Paylaşımla Reel ekleme (soğuk ve sıcak başlatma) | `e2e: 8 ·` (Android intent yükü `?text=` ile taklit edilir) |
| Instagram ZIP içe aktarma, mojibake düzeltme, koleksiyonlar | `instagram-export.test`, `e2e` |
| TR/EN çeviri anahtarlarının eksiksizliği | `i18n.test` |

Gerçek bir Android cihazdaki paylaşım menüsü ve Instagram uygulamasına geçiş otomatik testlerde taklit edilir; bunları cihazda elle doğrulamak gerekir.

---

## English

**Sakla** (formerly **Reels Organizer**) is a local-first Android app (Capacitor 7) for sorting the Instagram Reels you save into your own categories.

- Share a Reel from Instagram to the app, paste links (one or many), or import Instagram's "Download your information" export (ZIP/JSON/HTML, including collections).
- Categories you control, with keyword, hashtag, collection and creator-history matching. When a match is uncertain, the app **asks you**. An optional AI provider (OpenAI-compatible or Anthropic) can be enabled with your own API key; it also suggests 3-5 tags, which are never auto-applied.
- Cover images and the sharer's username are downloaded at save time from Instagram's public embed page and stored locally as small WebP files (with a "refresh cover" retry and a one-time backfill for existing reels).
- Home is a compact dashboard (quick add, stats, pending quick-categorize, a daily "take another look" pick); the Library holds the full collection with search, sort, category/tag filters, grid/list toggle and multi-select bulk actions.
- Search across caption, sharer, notes, tags and category names, duplicate detection, JSON backup/restore, Turkish/English UI, light/dark theme.
- Native splash screen, swipe-down-to-close sheets, tactile buttons with haptics, and a foreground-only clipboard offer (nothing is added without your tap).
- No account, no server, no Instagram login. It never asks for passwords or reads cookies. Data stays in IndexedDB on the device, and Android cloud backup is disabled.

**What depends on Instagram:** Meta removed `thumbnail_url`/`author_name` from oEmbed responses (Nov 3, 2025), so covers are fetched from the public embed page instead; private or removed reels get no cover. The official API cannot list a personal account's saved posts, so bulk import uses the data export instead.

Install: download the APK from [Releases](https://github.com/firatnexus/reels-organizer/releases/latest) and allow installing from that source. Build: `npm install && npm run apk:debug`. Tests: `npm test && npm run test:e2e`.

## Lisans

[MIT](LICENSE). Satoshi ve Cabinet Grotesk yazı tipleri [Fontshare](https://www.fontshare.com) (ITF Free Font License) kaynaklıdır.
