"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppSettings, saveAppSettings } from "@/repositories/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import * as React from "react";
import type { ScoringWeights } from "@/types";
import { BookOpen } from "lucide-react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: getAppSettings });
  const [waste, setWaste] = React.useState(5);
  const [dup, setDup] = React.useState(0.85);
  const [weights, setWeights] = React.useState<ScoringWeights>({
    fabricMatch: 0.3,
    gsmProximity: 0.2,
    openWidthProximity: 0.15,
    tubeWidthProximity: 0.1,
    compositionSimilarity: 0.15,
    machinePreference: 0.1,
  });

  React.useEffect(() => {
    if (q.data) {
      setWaste(q.data.defaultWastePercent);
      setDup(q.data.importDuplicateSensitivity);
      setWeights({ ...q.data.scoringWeights });
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () =>
      saveAppSettings({
        defaultWastePercent: waste,
        importDuplicateSensitivity: dup,
        scoringWeights: weights,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Ayarlar kaydedildi");
    },
    onError: (e) => toast.error(String(e)),
  });

  const wField = (key: keyof ScoringWeights, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.05"
        value={weights[key]}
        onChange={(e) =>
          setWeights({ ...weights, [key]: Number(e.target.value) })
        }
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Ayarlar</h1>
        <p className="text-slate-600">
          Fire, skor ağırlıkları, import hassasiyeti ve kısa kullanım kılavuzu
        </p>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Proje kullanım kılavuzu</CardTitle>
              <CardDescription className="mt-0.5">
                Özet akış — ayrıntılar için depodaki{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">PROJE_PLANI.md</code> dosyasına
                bakın.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-slate-700">
          <GuideStep
            n={1}
            title="Başlatma"
            items={[
              "Geliştirme: `web` klasöründe `npm install` ardından `npm run dev` (varsayılan port 3007).",
              "Giriş: soldan modüllere erişim; Firebase yapılandırılmadıysa uygulama örnek (mock) veriyle çalışır.",
            ]}
          />
          <Separator />
          <GuideStep
            n={2}
            title="Temel veri (sıra önerisi)"
            items={[
              "Kumaş türleri: üretimde kullandığınız kumaş ailelerini tanımlayın.",
              "Kumaş reçeteleri: yapı kodu (örn. D2-20/10), ön/arka Ne, iplik etiketi; sipariş ve Excel ile buradan bağlanır.",
              "Makineler: çap, fein aralığı, uygun kumaş türleri.",
              "Teknik veri / Excel içe aktarma: tablo satırları makine + en + gramaj + isteğe bağlı reçete kodu içerir.",
            ]}
          />
          <Separator />
          <GuideStep
            n={3}
            title="Sipariş hesaplama"
            items={[
              "Sipariş hesaplama ekranında müşteri bilgisi, hedef gramaj, tek en (açık veya tüp), miktarı girin.",
              "Reçete seçerseniz motor yalnız o reçeteye bağlı teknik satırları kullanır; pamuk/PES/likra oranı kullanıcıdan istenmez — teknik kayıttan gelir.",
              "Hesapla → alternatiflerde makine, pus/fein, tahmini enler, iplik özeti ve (demo) m/kg ve kg ihtiyacı görünür.",
              "İsterseniz geçmişe kaydedin; karşılaştırma ekranı son hesaplamayı yan yana tabloda açar.",
            ]}
          />
          <Separator />
          <GuideStep
            n={4}
            title="Excel içe aktarma"
            items={[
              ".xlsx yükleyin, sayfayı seçin, kolonları alanlara eşleyin (Türkçe başlıklar otomatik önerilir).",
              "Tek “en” kolonu varsa açık/tüp türünü import öncesinde işaretleyin.",
              "Reçete kodu kolonu, Kumaş reçeteleri listesindeki kodla eşleşirse satıra `fabricRecipeId` ve doğru kumaş türü yazılır.",
            ]}
          />
          <Separator />
          <GuideStep
            n={5}
            title="Bu sayfadaki ayarlar"
            items={[
              "Varsayılan fire: hammadde tahminlerinde çarpan.",
              "Skor ağırlıkları: alternatif sıralamasını etkiler; toplamı pratikte ~1 tutulması iyi olur.",
              "Duplicate hassasiyeti: import benzer satır ayırtında kullanılır (demo).",
            ]}
          />
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
            <strong>Not:</strong> Gramaj, iplik m/kg ve kg dağılımları üretim kalibrasyonu gerektirir; canlıya almadan
            kendi Excel tablolarınızla doğrulayın.
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>Genel</CardTitle>
          <CardDescription>Varsayılan fire ve duplicate eşiği</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-2">
            <Label>Varsayılan fire %</Label>
            <Input
              type="number"
              value={waste}
              onChange={(e) => setWaste(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Duplicate hassasiyeti (0–1)</Label>
            <Input
              type="number"
              step="0.01"
              value={dup}
              onChange={(e) => setDup(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>Skor ağırlıkları</CardTitle>
          <CardDescription>
            Toplam 1.0 olacak şekilde ayarlayın (motor çarpanları)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wField("fabricMatch", "Kumaş eşleşmesi")}
          {wField("gsmProximity", "Gramaj yakınlığı")}
          {wField("openWidthProximity", "Açık en yakınlığı")}
          {wField("tubeWidthProximity", "Tüp en yakınlığı")}
          {wField("compositionSimilarity", "Bileşen benzerliği")}
          {wField("machinePreference", "Makine tercihi")}
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-slate-500">
              Toplam:{" "}
              {Object.values(weights)
                .reduce((a, b) => a + b, 0)
                .toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        Kaydet
      </Button>
    </div>
  );
}

function GuideStep(props: { n: number; title: string; items: string[] }) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-slate-900"
        aria-hidden
      >
        {props.n}
      </div>
      <div className="min-w-0 space-y-2">
        <h3 className="font-semibold text-slate-900">{props.title}</h3>
        <ul className="list-disc space-y-1.5 pl-4 text-slate-600 marker:text-slate-400">
          {props.items.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
