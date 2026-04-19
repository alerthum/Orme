# Yokuş Örme Yazılımı

Next.js tabanlı **Örme Sipariş Planlama ve Teknik Karar Destek** uygulaması **`web/`** klasöründedir.

- **Proje planı ve tarihçe:** [PROJE_PLANI.md](PROJE_PLANI.md)
- Kurulum ve çalıştırma: [web/README.md](web/README.md)

```bash
cd web
npm install
npm run dev
```

## Vercel

Bu depoda `package.json` yalnızca **`web/`** altında olduğu için Vercel proje ayarında **Root Directory** mutlaka **`web`** seçilmelidir. Kök dizin (`.`) bırakılırsa derleme “başarılı” görünse bile site **404 NOT_FOUND** verebilir. Ayarı kaydettikten sonra **Deployments → … → Redeploy** ile yeniden yayınlayın. Ayrıntılar: [Vercel Monorepo](https://vercel.com/docs/monorepos).

**Framework Preset:** **Next.js** olmalı; “Other” seçiliyorsa canlıda uygulama açılmaz.

## Excel → teknik veri (demo / Vercel)

`data/excel-kaynak` içindeki `.xlsx` dosyaları yerelde şu komutla `web/src/data/seed/technical-records.json` dosyasına işlenir; bu dosya repoya commit edilir ve **Vercel + boş Firestore** ortamında da alternatif hesabında kullanılır:

```bash
cd web
npm run seed:technical
```

Excel güncellenince komutu tekrar çalıştırıp JSON’u commit edin.
