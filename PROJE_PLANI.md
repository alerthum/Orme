# Yokuş Örme — Sipariş Planlama ve Teknik Karar Destek Sistemi

**Bu dosya projenin tek plan / tarihçe kaynağıdır.** İlerleme, kararlar ve sıradaki işler burada kronolojik olarak tutulur. Uygulama kodu: `web/` klasörü.

---

## Mevcut ürün özeti (DEMO V1 — tamamlandı)

- **Stack:** Next.js (App Router), TypeScript, Tailwind, shadcn tarzı UI, TanStack Query/Table, Firebase (opsiyonel), mock seed.
- **Modüller:** Giriş, dashboard, kumaş türleri, **iplik türleri**, makineler, teknik veri kütüphanesi, Excel içe aktarma (önizleme + kolon eşleştirme + tek en için açık/tüp seçimi), sipariş hesaplama, alternatif kıyas, sipariş geçmişi, ayarlar.
- **Hesap motoru:** Teknik kayıtlara göre ağırlıklı skor, tahmini en/gramaj, hammadde tahmini (kaba).
- **Sipariş formu (V1):** Hedef gramaj, **tek en + açık/tüp seçimi**, kumaş türü, **manuel pamuk/polyester/likra %**, miktar.

**Varsayılan geliştirme sunucusu:** `npm run dev` → port **3007** (`web/package.json`).

---

## Tarihçe

### 2026-04-19 — DEMO V1 teslimi

- Next.js projesi `web/` altında kuruldu; Firebase yoksa mock veri ile uçtan uca çalışır.
- Teknik veri, import, sipariş hesaplama ve karşılaştırma ekranları; Vitest + README.
- Sonradan: **iplik türleri** modülü, dashboard metrikleri, port **3007** kalıcı script.

### 2026-04-19 — Plan düzeltmesi: sipariş = reçete / yapı, bileşen = veriden

**İş ihtiyacı (kullanıcı tanımı):**

- Sipariş anında **pamuk / polyester / likra oranını kullanıcı seçmeyecek**; bu oranlar **sizin teknik veri ve reçetelerden** gelecek.
- Örnek: **“20/10 düz iki iplik”** → ön yüz Ne 20, arka Ne 10; iki iplik ile kumaş; bu yapıda likra/poly olmayabilir.
- Kullanıcı dili: *“20/10 düz iki iplik siyah, 1500 kg istiyorum”* → sistem **hangi pus/fein, hangi makinede**, **iplik uzunluğu ne olur**, **makine türüne göre ortalama iplik ihtiyacı** gibi çıktı vermeli.

**V1’deki plan hatası (tespit):**

- Sipariş ekranı bileşen yüzdelerini **form alanı** olarak topluyor; bu, satış/planlama akışınızla çakışıyor. Bileşen ve iplik yapısı **kumaş/reçete tanımı + teknik kayıt** ile bağlanmalı.
- “20/10” gibi **iplik konstrüksiyonu** `fabricType` veya ayrı bir **reçete / varyant** nesnesinde kodlanmalı; teknik kayıt satırı (`yarnTypeSummary`, `yarnLength`, makine, pus/fein) bu yapıyla eşleşmeli.

**Hedef mimari yön (V2 — yapılacaklar listesi):**

| # | İş | Açıklama |
|---|-----|----------|
| V2-1 | **Reçete / kumaş varyantı** | `fabricTypes` genişletme veya `fabricRecipes` koleksiyonu: kod (örn. `D2-20/10`), ön/arka iplik numarası, kategori (düz 2 iplik), isteğe bağlı renk/not; bileşen oranları burada veya bağlı teknik satırlarda. |
| V2-2 | **Sipariş formu sadeleştirme** | Kullanıcı: müşteri, sipariş kodu, **reçete/varyant veya kumaş+yapı seçimi**, gramaj, en (tek + açık/tüp), miktar, tolerans, opsiyonel makine tercihi. **Pamuk/PES/Likra alanlarını kaldır** veya salt okunur “veriden gelen” göster. |
| V2-3 | **Motor girdi birleştirme** | `calculateAlternatives` öncesi: seçilen reçeteye göre teknik kayıtları filtrele (`yarnTypeSummary` / yeni alan eşleşmesi); bileşen skorunu teknik kayıttaki oranlardan üret. |
| V2-4 | **İplik uzunluğu ve tüketim** | Çıktıda: seçilen alternatifin `yarnLength` + makine/pus/fein; kg başına ön/arka iplik ayrımı (teknik tablodan veya katsayı tablosu). |
| V2-5 | **Seed örnek** | En az bir `20/10` düz 2 iplik reçetesi + buna bağlı teknik satırlar + sipariş senaryosu demo. |

**Not:** Hammadde kg formülleri endüstriye özel kalibre gerektirir; üretimde Excel’lerinizle doğrulama adımı plana dahildir.

---

## Neredeyiz? (durum özeti)

| Alan | Durum |
|------|--------|
| DEMO V1 kod tabanı | Tamam (`web/`) |
| Tek plan dosyası | Bu dosya (`PROJE_PLANI.md`) |
| Sipariş = reçete odaklı akış | **Uygulandı (V2 çekirdek)** — reçete seçimi + motor filtresi |
| Bileşen oranları veriden | **Uygulandı** — formdan kaldırıldı; skor/çıktı teknik kayıt + reçete |
| 20/10 düz 2 iplik örneği | **Seed + sipariş demo varsayılanı** (`D2-20/10`, teknik satırlar) |

---

## Cursor plan dosyası ile ilişki

Cursor IDE içindeki `örme_demo_v1_planı_*.plan.md` dosyası ilk DEMO kapsamını içerir; **güncel tarihçe ve V2 yönü bu repodaki `PROJE_PLANI.md` üzerinden** yürütülür. İsterseniz Cursor planına da aynı “Tarihçe” başlığını kopyalayabilirsiniz.

---

## Excel kaynak envanteri (`data/excel-kaynak/`)

**Kaynak dosyalar (7 adet, kumaş ailesi başına bir çalışma kitabı):** `İKİ İPLİK.xlsx`, `İNTERLOK.xlsx`, `KAŞKORSE.xlsx`, `LACOSTLAR.xlsx`, `RİBANA.xlsx`, `SÜPREM.xlsx`, `ÜÇİPLİKLER.xlsx`.

**Otomatik özet:** `web/scripts/analyze-excel-kaynak.mjs` — çalıştırma: `cd web && node scripts/analyze-excel-kaynak.mjs` (çıktıyı UTF-8 dosyaya yönlendirin). Üretilen `_analiz-ozet.txt` her sayfa için satır/sütun sayısı ve ilk hücre önizlemesi içerir.

### Sayfa envanteri (tek tek)

| Dosya | Sayfa adları (özet) | Not |
|--------|---------------------|-----|
| **İKİ İPLİK** (7 sheet) | 28 FAYN FULL LYC … GRMAJ; … ENLER; DÜZ İKİ İPLİK GRAMAJ; DÜZ İKİ İPLİK ENLERİ; İKİ İPLK ORTLMA İPLİK VE LYC ORA; 150DN POLY … ORANLARI; 90DN POLY … ORANLARI | Çok katmanlı başlık: fein/denye blokları, dış-iç iplik, gramaj ızgarası; “ENLER” sayfalarında KUMAŞ CİNSİ + iğne + may genişliği + mamül en; geniş “ORANLARI” sayfaları (1024 sütuna kadar) gramaj×en×iplik grubuna göre Pam/Pol/Lyc |
| **İNTERLOK** (2) | DÜZ İNTERLOK GRAMAJLARI; DÜZ İNTERLOK ENLERİ | Fayn × iplik no ızgarası; en tablosu yapısı İKİ İPLİK “ENLER” ile aynı aile |
| **KAŞKORSE** (8) | 18/17/16/15 FAYN %5 LYC … GRAMAJ; 18 FAYN … ENLERİ; 2X1 DÜZ … GRAMAJ / ENLERİ; %5 LYC … LYC ORANLARI | Aynı gramaj mantığı; farklı fayn sayfaları; rib benzeri en sayfası |
| **LACOSTLAR** (6) | TEK TOP / ÇİFT TOPLAMA gramaj ve en; TEK TOP … İP. UZN.; TEK TOPLAMA … ENLERİ | Lakost varyantları ayrı sheet; ip uzunluğu grid’i |
| **RİBANA** (13) | TAM DOLU İĞNELİ düz rib GRAMAJ/ENLER; 1X1 çift kat gramaj; FULL LYC / %5 LYC ribana gramaj+en; 17–18 fayn ribana; %5 LYC … ORANLARI (iki sayfa) | En çok sayfa çeşitliliği; bazı isimler tekrar/variant (RDÜZ vs DÜZ) |
| **SÜPREM** (10) | FULL LYC / %5 LYC süprem gramaj+en; DÜZ süprem gramaj, mamül en, gramaja göre iplik uzunluğu; KALIN FAYN; çoklu LYC ORANLARI sayfaları | Süprem + lyc oran matrisleri |
| **ÜÇ İPLİKLER** (5) | 70DN POLY; 90DN POLY; ARA İPLİK 36-1 / 30-1 / 20-1 | Satırlar “kumaş cinsi” kodu (örn. 40/70/10); bloklar hedef gramaj (280–380 g/m²) başlıklı; sütunlar dış/ara/poly/arka iplik cm + Pam/Pol/Lyc oranları + mamül gramaj — yatay tekrarlayan şablon |

**Ortak yapısal gerçek:** Tablolar **düz satır = tek teknik kayıt** değil; birleşik hücreler, çok satırlı başlık ve **yatay tekrarlayan bloklar** (pus/makine/fein dilimleri) var. Mevcut uygulamadaki tek satırlık Excel import bu formatı **doğrudan desteklemiyor**.

---

## Sistem planı — Excel’e göre V3 yönü

| Faz | İş | Açıklama |
|-----|-----|----------|
| **V3-1** | **Sayfa sınıflandırma** | Her sheet için meta: `workbookId`, `sheetRole` ∈ { GRAMAJ_IZGARA, ENLER_MAKINE, BILESEN_MATRISI, UC_IPLIK_BLOK, DIGER }; kaynak dosya adı ↔ `fabricType` / aile kodu eşlemesi. |
| **V3-2** | **Ayrıştırıcı (parser) ailesi** | (1) Gramaj ızgarası: satır anahtarı (ör. dış ölçü + tüp), sütun anahtarı (fayn, Ne), hücre = GSM. (2) Enler: satır = kumaş cinsi metni + iğne; blok = makine çapı + fein → açık en cm. (3) Bileşen matrisi: çok sütunlu “Gr/Pam/Pol/Lyc” tekrarları → normalizasyon. (4) Üç iplik: blok başlığından hedef GSM, satırdan yapı kodu ve üç iplik oranları. |
| **V3-3** | **Dahili model** | Seçenek A: Ham JSON + indeks (hızlı); Seçenek B: `TechnicalRecord` üretimi için **expand** edilmiş normalize satırlar (yavaş ama mevcut motorla uyumlu). Muhtemelen ikisi: ham arşiv + türetilmiş kayıt. |
| **V3-4** | **UI** | Sihirbaz: dosya → sayfa → şablon seçimi → önizleme (ilk N üretilen kayıt) → içe aktar; hata raporu (birleşik hücre, boş blok). |
| **V3-5** | **Sipariş motoru** | Grid interpolasyonu: hedef GSM + en + fein + kumaş satırı metni ile komşu hücrelerden tahmin; bileşen için ilgili matris sayfasına yönlendirme (poly denye tipi: 90/150 DN vb.). |

**Risk / not:** `ORANLARI` sayfalarında yüzde alanları bazen `$` ile görünüyor (Excel biçimi); içe aktarımda sayı normalizasyonu şart. Çok geniş sütunlar (AMJ = 1024) performans ve bellek için **streaming / blok bazlı** işleme gerektirebilir.

---

## Son güncelleme

- **2026-04-19:** Tarihçe eklendi; V2 reçete odaklı düzeltme maddeleri yazıldı.
- **2026-04-19 (devam):** `FabricRecipe` modeli, mock `fabricRecipes`, teknik kayıtta `fabricRecipeId` + ön/arka iplik kg katsayıları; sipariş formunda reçete seçimi ve pamuk/PES/likra alanlarının kaldırılması; motorun reçeteye göre filtrelemesi, bileşen skorunda kullanıcı oranı olmaması, çıktıda iplik uzunluğu ve veri kaynaklı bileşen notu; `D2-20/10` seed senaryosu.
- **2026-04-19 (devam 2):** `/fabric-recipes` kataloğu + menü; sipariş geçmişinde reçete kodu; kıyas tablosunda iplik özeti / m/kg / toplam iplik kg; teknik kütüphane detayında reçete kodu ve iplik uzunluğu.
- **2026-04-19 (devam 3):** Excel import’ta `fabricRecipeCode` kolon tipi ve otomatik başlık eşlemesi; içe aktarılan satırda reçete kodu → `fabricRecipeId` + kumaş türü reçeteden; `yarnTypeSummary` reçete etiketinden. Kumaş reçeteleri ekranında CRUD (ekle / düzenle / sil).
- **2026-04-19 — Excel kaynakları:** `data/excel-kaynak/` altında 7 kumaş-ailesi çalışma kitabı tarandı (**51 sheet**). Yapı çok katmanlı başlık ve ızgara olduğu için mevcut düz import yetersiz; plana **V3** (sayfa rolü, parser ailesi, normalize model, sihirbaz UI, grid interpolasyon) eklendi. Özet script: `web/scripts/analyze-excel-kaynak.mjs`.
