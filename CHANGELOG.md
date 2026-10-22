# Değişiklik günlüğü

## 1.0.0 — 2026-10-22

İlk sürüm.

- Instagram'dan Android paylaşım menüsüyle Reel kaydetme (soğuk ve sıcak başlatma).
- Tekli / toplu bağlantı ekleme, panodan yapıştırma, ayrıntılı bağlantı hataları.
- Instagram veri dışa aktarımından (ZIP / JSON / HTML) toplu içe aktarma; koleksiyonları kategoriye çevirme, Meta mojibake düzeltmesi.
- Kategori oluşturma, yeniden adlandırma, renk, anahtar kelimeler, silme; TR/EN hazır öneriler.
- Anahtar kelime + hashtag + koleksiyon + paylaşan geçmişi ile kategori seçimi; emin değilse kullanıcıya sorma.
- İsteğe bağlı yapay zekâ sağlayıcısı (OpenAI, Gemini, OpenRouter, Anthropic, OpenAI uyumlu özel uç nokta).
- Arama, kategori filtreleri, en yeni / en eski sıralama, kopya algılama.
- JSON yedek dışa aktarma ve birleştirerek / değiştirerek geri yükleme.
- Türkçe / İngilizce arayüz, açık / koyu tema, Android geri tuşu, uyarlanabilir ve tematik uygulama simgesi.

## 1.1.1 — 2026-10-22 (Stash)

Renamed to **Stash** (English name; was Sakla in 1.1.0, formerly Reels Organizer). All app-name strings, the share-target label and the release page are now in English. `applicationId` unchanged — installs over existing versions.

## 1.1.0 — 2026-10-22 (Sakla)

Yeni ad: **Sakla** (eski adı Reels Organizer). `applicationId` değişmedi — mevcut kurulumların üzerine yüklenebilir.

### Eklenen

- **Native açılış ekranı:** androidx SplashScreen API ile crimson/cream marka, 450ms ölçek animasyonu; ilk kare çizilene kadar kalır, beyaz parlama yok (Android 7-11 dahil).
- **Kapak resimleri ve paylaşan bilgisi:** kayıt sırasında Instagram'ın herkese açık embed sayfasından çekilir, ≤480px WebP olarak cihazda saklanır. "Kapak yenile" yeniden deneme, tek seferlik "Mevcut reelleri güncelle", Ayarlar'da önbellek boyutu ve temizleme. Meta oEmbed'ten `thumbnail_url`'i kaldırdığı için bu yol kullanılır.
- **AI önerileri genişletildi:** 1-3 mevcut kategori + en fazla 1 yeni kategori + 3-5 etiket önerisi. Etiketler asla otomatik uygulanmaz ("Hepsini reddet" var). Ayarlar'da ne gönderildiği yazar; öneriler kapatılabilir.
- **Etiketler:** elle ekleme, Kitaplık'ta etiket filtre çipleri ve arama.
- **Ana sayfa / Kitaplık ayrımı:** Ana sayfa özet panosu (hızlı ekleme, istatistik, "Bugün tekrar bak", kategori bekleyenler); Kitaplık tam koleksiyon (arama, sıralama, kategori/etiket filtreleri, liste/ızgara, çoklu seçimle toplu kategorileme/silme).
- **Alt sayfalarda sürükle-kapat:** tutamak/başlıktan aşağı sürükleme — %30 eşiği veya hızlı savuruşta kapanır, yoksa geri yaylanır.
- **Dokunma hissi:** tonal dolgu + yumuşak gölge, 0.96 ölçekli basınç efekti, 120-180ms geçişler, native haptic.
- **Pano önerisi:** uygulama ön plana geldiğinde panodaki kaydedilmemiş Instagram bağlantısı için net istem; kullanıcı dokunmadan hiçbir şey eklenmez.

### Düzeltmeler

- Ayrıntı sayfasında "Kapak yenile" ve "Instagram önizlemesini yükle" düğmelerinin üst üste binmesi.
- Kaydırma performansı: sabit bulanık çubukların (backdrop-filter) kaldırılması — Android WebView'da kaydırma takılmasının bilinen sebebi.

### Bilinen sınırlar

- Kapak indirme yalnızca gerçek shortcode'lu herkese açık Reels'larda çalışır; gizli/kaldırılmış içerikte gelmez.
- Performans ölçümü masaüstü Chromium'da yapıldı (ana thread kaydırmada vsync'e bağlı); gerçek cihaz ölçümü yapılmadı.
