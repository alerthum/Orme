"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderFormSchema, type OrderFormValues } from "@/validators/order";
import { listFabricTypes } from "@/repositories/fabric-types";
import { listFabricRecipes } from "@/repositories/fabric-recipes";
import { listTechnicalRecords } from "@/repositories/technical-records";
import { getAppSettings } from "@/repositories/settings";
import { createOrder } from "@/repositories/orders";
import { calculateAlternatives } from "@/services/calculation/engine";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import type { CalculationAlternative } from "@/types";
import { WIDTH_KIND_LABELS } from "@/lib/order-width";

const STORAGE_KEY = "yokus-last-calculation";

export default function OrderCalculatePage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const qFab = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const qRecipes = useQuery({ queryKey: ["fabricRecipes"], queryFn: listFabricRecipes });
  const qTech = useQuery({ queryKey: ["technical-all"], queryFn: () => listTechnicalRecords() });
  const qSet = useQuery({ queryKey: ["settings"], queryFn: getAppSettings });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as Resolver<OrderFormValues>,
    defaultValues: {
      customerName: "Demo Tekstil A.Ş.",
      orderCode: `SO-${Date.now().toString().slice(-6)}`,
      orderTitle: "20/10 düz iki iplik siyah — 1500 kg (demo)",
      fabricRecipeId: "",
      fabricRecipeCode: "",
      fabricTypeId: "",
      targetGsm: 185,
      targetWidth: 168,
      widthKind: "open",
      quantity: 1500,
      quantityUnit: "kg",
      tolerancePercent: 3,
    },
  });

  React.useEffect(() => {
    const list = qRecipes.data;
    if (!list?.length) return;
    if (form.getValues("fabricRecipeId")) return;
    const demo = list.find((r) => r.code === "D2-20/10");
    if (demo) {
      form.setValue("fabricRecipeId", demo.id);
      form.setValue("fabricRecipeCode", demo.code);
      form.setValue("fabricTypeId", demo.fabricTypeId);
    }
  }, [qRecipes.data, form]);

  React.useEffect(() => {
    if (form.getValues("fabricRecipeId")) return;
    const first = qFab.data?.[0]?.id;
    if (first && !form.getValues("fabricTypeId")) {
      form.setValue("fabricTypeId", first);
    }
  }, [qFab.data, form]);

  const [alternatives, setAlternatives] = React.useState<CalculationAlternative[]>([]);

  const runCalc = () => {
    const vals = form.getValues();
    const parsed = orderFormSchema.safeParse(vals);
    if (!parsed.success) {
      toast.error("Formu kontrol edin");
      return;
    }
    if (!qSet.data || !qTech.data) {
      toast.error("Ayarlar veya teknik veri yüklenmedi");
      return;
    }
    const recipeId = parsed.data.fabricRecipeId?.trim();
    const activeRecipe = recipeId
      ? qRecipes.data?.find((r) => r.id === recipeId)
      : undefined;
    const mergedInput = {
      ...parsed.data,
      fabricRecipeId: recipeId || undefined,
      fabricRecipeCode: parsed.data.fabricRecipeCode?.trim() || activeRecipe?.code,
    };
    const alts = calculateAlternatives({
      input: mergedInput,
      records: qTech.data,
      settings: qSet.data,
      activeRecipe,
    });
    setAlternatives(alts);
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ alternatives: alts, form: mergedInput })
      );
    } catch {
      /* ignore */
    }
    toast.success(`${alts.length} alternatif hesaplandı`);
  };

  const mSave = useMutation({
    mutationFn: async () => {
      const parsed = orderFormSchema.safeParse(form.getValues());
      if (!parsed.success) {
        throw new Error("Form doğrulanamadı");
      }
      const vals = parsed.data;
      const best = alternatives[0];
      return createOrder({
        orderTitle: vals.orderTitle,
        customerName: vals.customerName,
        orderCode: vals.orderCode,
        form: vals,
        recommendedAlternatives: alternatives,
        selectedAlternativeId: best?.technicalRecordId,
        userNote: undefined,
        createdBy: profile?.email,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Sipariş geçmişine kaydedildi");
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Sipariş hesaplama</h1>
          <p className="text-slate-600">
            Hedef gramaj ve en — makine alternatifleri ve hammadde tahmini
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/orders/compare">Karşılaştırma ekranı</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Parametreler</CardTitle>
            <CardDescription>Müşteri ve teknik hedefler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Müşteri">
                <Input {...form.register("customerName")} />
              </Field>
              <Field label="Sipariş kodu">
                <Input {...form.register("orderCode")} />
              </Field>
              <Field label="Sipariş adı" className="sm:col-span-2">
                <Input {...form.register("orderTitle")} />
              </Field>
              <Field label="Kumaş reçetesi / yapı" className="sm:col-span-2">
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  value={form.watch("fabricRecipeId") ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    form.setValue("fabricRecipeId", id || undefined);
                    const r = (qRecipes.data ?? []).find((x) => x.id === id);
                    form.setValue("fabricRecipeCode", r?.code ?? undefined);
                    if (r) {
                      form.setValue("fabricTypeId", r.fabricTypeId);
                    }
                  }}
                >
                  <option value="">Reçete yok — yalnızca kumaş türüne göre</option>
                  {(qRecipes.data ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Pamuk / PES / likra oranları siparişte girilmez; teknik kayıt ve reçeteye bağlıdır.
                </p>
              </Field>
              <Field label="Kumaş türü" className="sm:col-span-2">
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  {...form.register("fabricTypeId")}
                >
                  <option value="">Seçin</option>
                  {(qFab.data ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hedef gramaj (g/m²)">
                <Input type="number" step="0.1" {...form.register("targetGsm")} />
              </Field>
              <Field label="Hedef en" className="sm:col-span-2">
                <p className="mb-2 text-xs text-slate-500">
                  Yalnızca bir en değeri girin; açık mı tüp mü olduğunu seçin.
                </p>
                <div className="mb-3 flex flex-wrap gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={form.watch("widthKind") === "open"}
                      onChange={() => form.setValue("widthKind", "open")}
                    />
                    {WIDTH_KIND_LABELS.open}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={form.watch("widthKind") === "tube"}
                      onChange={() => form.setValue("widthKind", "tube")}
                    />
                    {WIDTH_KIND_LABELS.tube}
                  </label>
                </div>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  {...form.register("targetWidth")}
                />
              </Field>
              <Field label="Miktar">
                <Input type="number" {...form.register("quantity")} />
              </Field>
              <Field label="Birim">
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  {...form.register("quantityUnit")}
                >
                  <option value="kg">kg</option>
                  <option value="ton">ton</option>
                  <option value="m">metre</option>
                </select>
              </Field>
              <Field label="Tolerans %">
                <Input type="number" {...form.register("tolerancePercent")} />
              </Field>
              <Field label="Fire % (sipariş özel)">
                <Input type="number" {...form.register("wastePercentOverride")} />
              </Field>
              <Field label="Tercih makine tipi">
                <Input {...form.register("preferredMachineType")} placeholder="Yuvarlak" />
              </Field>
              <Field label="Tercih çap (&quot;)">
                <Input type="number" {...form.register("preferredDiameter")} />
              </Field>
              <Field label="Tercih pus/fein">
                <Input type="number" {...form.register("preferredPusFein")} />
              </Field>
              <Field label="İçerik notu" className="sm:col-span-2">
                <Textarea {...form.register("fabricContentNote")} rows={2} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={runCalc}>
                Hesapla
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!alternatives.length}
                onClick={() => mSave.mutate()}
              >
                Geçmişe kaydet
              </Button>
            </div>
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-sm text-red-600">Zorunlu alanları doldurun.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle>Önerilen alternatifler</CardTitle>
              <CardDescription>Skor ve güven — tahmini teknik çıktılar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alternatives.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Hesaplamak için formu doldurup &quot;Hesapla&quot;ya basın.
                </p>
              ) : (
                alternatives.slice(0, 4).map((a) => (
                  <div
                    key={a.technicalRecordId}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{a.machineName}</p>
                        <p className="text-xs text-slate-500">
                          {a.diameter}&quot; • Fein {a.pusFein} • İğne {a.needleCount}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={a.isRecommended ? "default" : "secondary"}>
                          Skor {a.matchScore}
                        </Badge>
                        <Badge variant="outline">{a.confidence}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-slate-50 py-2">
                        <p className="text-xs text-slate-500">Açık en</p>
                        <p className="font-medium">{a.estimatedOpenWidth} cm</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 py-2">
                        <p className="text-xs text-slate-500">Tüp en</p>
                        <p className="font-medium">{a.estimatedTubeWidth} cm</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 py-2">
                        <p className="text-xs text-slate-500">Gramaj</p>
                        <p className="font-medium">{a.estimatedGsm}</p>
                      </div>
                    </div>
                    {(a.yarnTypeSummary != null ||
                      a.yarnLengthMPerKg != null ||
                      a.dataDrivenCompositionNote) && (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-700">
                        {a.yarnTypeSummary != null && (
                          <p>
                            <span className="font-medium text-slate-600">İplik yapısı:</span>{" "}
                            {a.yarnTypeSummary}
                          </p>
                        )}
                        {a.yarnLengthMPerKg != null && (
                          <p>
                            <span className="font-medium text-slate-600">İplik uzunluğu (demo):</span>{" "}
                            {a.yarnLengthMPerKg} m / kg mamül
                          </p>
                        )}
                        {a.dataDrivenCompositionNote != null && (
                          <p className="mt-1">
                            <span className="font-medium text-slate-600">Bileşen (teknik kayıt):</span>{" "}
                            {a.dataDrivenCompositionNote}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      {a.materials.map((m) => (
                        <div key={m.component} className="flex justify-between">
                          <span>{m.component}</span>
                          <span>
                            Net {m.netKg.toFixed(1)} kg • Fire dahil{" "}
                            {m.withWasteKg.toFixed(1)} kg
                          </span>
                        </div>
                      ))}
                    </div>
                    {a.advantageNote && (
                      <p className="mt-2 text-xs text-sky-800">{a.advantageNote}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={props.className}>
      <Label className="mb-1.5 block">{props.label}</Label>
      {props.children}
    </div>
  );
}
