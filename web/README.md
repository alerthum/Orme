# Yokuş Örme Yazılımı – Sipariş Planlama ve Teknik Karar Destek (DEMO V1)

Proje planı ve tarihçe (tek kaynak): üst dizinde [../PROJE_PLANI.md](../PROJE_PLANI.md).

Yuvarlak örme siparişlerinde hedef gramaj, en ve bileşenlere göre makine alternatifleri, tahmini teknik çıktılar ve hammadde ihtiyacı (net / fire dahil) üreten web uygulaması.

## Teknolojiler

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Radix tabanlı UI bileşenleri (shadcn tarzı)
- TanStack Query, TanStack Table
- React Hook Form + Zod
- Recharts
- Firebase (Auth, Firestore, Storage) — **opsiyonel**
- SheetJS (`xlsx`) ile istemci tarafı Excel okuma
- Vitest (birim testleri)

## Proje konumu

Uygulama bu repoda **`web/`** klasöründedir (npm proje adı kısıtı nedeniyle oluşturulmuştur).

```bash
cd web
npm install
```

## Ortam değişkenleri

`.env.local.example` dosyasını kopyalayın:

```bash
copy .env.local.example .env.local
```

- **Firebase alanları boş bırakılırsa** uygulama **demo (mock) veri** ile çalışır: `src/lib/mock-db.ts` içindeki seed otomatik yüklenir; giriş için Firebase gerekmez.
- Firebase kullanmak için [Firebase Console](https://console.firebase.google.com) üzerinden web uygulaması ekleyip değerleri doldurun. Firestore ve Storage’ı etkinleştirin. Demo güvenlik kuralları için kökteki `firestore.rules` örneğine bakın (production’da sıkılaştırın).

Önerilen demo bayrağı:

```env
NEXT_PUBLIC_DEMO_SKIP_AUTH=true
```

Firebase yokken zaten mock oturumu açılır; bu bayrak Firebase varken geliştirme kolaylığı sağlar.

## Çalıştırma

```bash
npm run dev
```

Tarayıcı: `http://localhost:3007` — kök `/` dashboard’a yönlendirir (`npm run dev` varsayılan port).

## Build

```bash
npm run build
npm start
```

## Testler

```bash
npm run test
```

## Mimari notlar

- **Veri katmanı:** `src/repositories/*` — Firebase yapılandırılmışsa Firestore, değilse bellek içi mock store.
- **Hesap motoru:** `src/services/calculation/engine.ts` — ağırlıklı skor, güven seviyesi, komşu interpolasyonu ve hammadde tahmini.
- **Excel:** `src/services/import/*` — sayfa önizleme, kolon eşleştirme, teknik kayıt üretimi.
- **Tipler:** `src/types/index.ts`
- **İplik türleri:** `src/app/(app)/yarn-types/page.tsx`, koleksiyon `yarnTypes`

## Demo akışı

1. Giriş: Firebase yoksa “Demo ile devam et” veya doğrudan oturum açılır.
2. Dashboard: özet kartlar, grafik, son import ve siparişler.
3. **Sipariş hesaplama:** Formu doldurup **Hesapla** — alternatif kartları ve hammaddeler.
4. **Alternatif kıyas:** Hesaplamadan sonra aynı oturumda `Karşılaştırma` sekmesi; veri `sessionStorage` ile taşınır.
5. **Excel içe aktar:** `.xlsx` yükleyin, sayfa ve kolonları eşleştirin.

## NOTE / sonraki faz

- Hammadde kg hesapları **tahmini** kabullerle çalışır; gerçek tüketim makine ve proses parametrelerine göre kalibre edilmelidir.
- Karmaşık birleşik Excel başlıkları için tam otomatik şema çıkarımı bu DEMO kapsamında değildir; kolon eşleştirme ile genişletilir.
- Production’da hesap motoru ve import doğrulaması sunucu tarafında (Cloud Functions / Admin SDK) tekrarlanabilir.
