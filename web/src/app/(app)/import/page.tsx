"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createImportJob,
  listImportJobs,
  updateImportJob,
} from "@/repositories/import-jobs";
import {
  createTechnicalRecord,
  replaceTechnicalRecordsFromSource,
} from "@/repositories/technical-records";
import { listMachines } from "@/repositories/machines";
import { listFabricTypes } from "@/repositories/fabric-types";
import { listFabricRecipes } from "@/repositories/fabric-recipes";
import {
  listSheetNames,
  previewSheet,
  parseSheetToObjects,
  rowToTechnicalDraft,
} from "@/services/import/parse-xlsx";
import {
  enrichEnlerDraftsWithGramajMedian,
  enlerDraftsToTechnicalArgs,
  isDuzIkiIplikWorkbook,
  parseIkiIplikWorkbook,
  pickMachineForDuzIkiIplik,
  SHEET_ENLER,
} from "@/services/excel-sources/duz-iki-iplik";
import {
  mappingConfidence,
  suggestColumnMapping,
} from "@/services/import/column-mapper";
import type { TechnicalImportFieldKey } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FIELD_OPTIONS: { value: TechnicalImportFieldKey; label: string }[] = [
  { value: "skip", label: "— Atla" },
  { value: "fabricType", label: "Kumaş türü" },
  { value: "fabricRecipeCode", label: "Reçete kodu (örn. D2-20/10)" },
  { value: "pusFein", label: "Pus / Fein" },
  { value: "needleCount", label: "İğne sayısı" },
  { value: "tubeWidth", label: "Tüp en" },
  { value: "openWidth", label: "Açık en" },
  {
    value: "singleWidth",
    label: "En (tek kolon — türü aşağıdan seçin)",
  },
  { value: "weightGsm", label: "Gramaj (GSM)" },
  { value: "yarnLength", label: "İplik uzunluğu" },
  { value: "machineType", label: "Makine tipi" },
  { value: "machineDiameter", label: "Makine çapı" },
  { value: "cottonRatio", label: "Pamuk %" },
  { value: "polyesterRatio", label: "Polyester %" },
  { value: "lycraRatio", label: "Likra %" },
  { value: "viscoseRatio", label: "Viskon %" },
  { value: "notes", label: "Not" },
];

export default function ImportPage() {
  const qc = useQueryClient();
  const qJobs = useQuery({ queryKey: ["imports"], queryFn: listImportJobs });
  const qMac = useQuery({ queryKey: ["machines"], queryFn: listMachines });
  const qFab = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const qRecipes = useQuery({ queryKey: ["fabricRecipes"], queryFn: listFabricRecipes });

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [buffer, setBuffer] = React.useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [sheets, setSheets] = React.useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState<string>("");
  const [preview, setPreview] = React.useState<ReturnType<typeof previewSheet> | null>(null);
  const [mapping, setMapping] = React.useState<Record<string, TechnicalImportFieldKey>>({});
  const [, setJobId] = React.useState<string | null>(null);
  const [resultStats, setResultStats] = React.useState<{
    imported: number;
    errors: number;
    confidence: number;
  } | null>(null);
  const [importWidthKind, setImportWidthKind] = React.useState<"open" | "tube">(
    "open"
  );
  const [structuredFabricOverride, setStructuredFabricOverride] = React.useState<
    string | null
  >(null);
  const defaultStructuredFabricId =
    qFab.data?.find((f) => f.code === "D2")?.id ?? qFab.data?.[0]?.id ?? "";
  const fabricIdForStructured = structuredFabricOverride ?? defaultStructuredFabricId;
  const showDuzIkiIplikShortcut = buffer != null && isDuzIkiIplikWorkbook(sheets);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const ab = await f.arrayBuffer();
    setBuffer(ab);
    setFileName(f.name);
    const names = listSheetNames(ab);
    setSheets(names);
    setSelectedSheet(names[0] ?? "");
    setStep(2);
    toast.success("Dosya okundu");
  };

  React.useEffect(() => {
    if (!buffer || !selectedSheet) return;
    try {
      const prev = previewSheet(buffer, selectedSheet, 15);
      setPreview(prev);
      const sug = suggestColumnMapping(prev.headers);
      const clean: Record<string, TechnicalImportFieldKey> = {};
      for (const h of prev.headers) {
        clean[h] = sug[h] ?? "skip";
      }
      setMapping(clean);
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Önizleme hatası");
    }
  }, [buffer, selectedSheet]);

  const mJob = useMutation({
    mutationFn: async () => {
      let storagePath: string | undefined;
      if (isFirebaseConfigured() && buffer) {
        const st = getFirebaseStorage();
        if (st) {
          const path = `imports/${Date.now()}-${fileName}`;
          const r = ref(st, path);
          await uploadBytes(r, buffer);
          storagePath = await getDownloadURL(r);
        }
      }
      const id = await createImportJob({
        fileName,
        storagePath,
        status: "mapping",
        sheetNames: sheets,
        selectedSheet,
        columnMapping: mapping as Record<string, string>,
      });
      setJobId(id);
      return id;
    },
  });

  const mImport = useMutation({
    mutationFn: async (payload: {
      jid: string | null;
      singleWidthKind: "open" | "tube";
    }) => {
      if (!buffer || !selectedSheet) throw new Error("Dosya yok");
      const rows = parseSheetToObjects(buffer, selectedSheet);
      const machine = qMac.data?.[0];
      const fabric = qFab.data?.[0];
      if (!machine || !fabric) throw new Error("Makine veya kumaş seed eksik");
      const recipes = qRecipes.data ?? [];

      const mappingTyped = mapping as Record<string, TechnicalImportFieldKey>;
      let imported = 0;
      let errors = 0;

      for (const row of rows) {
        try {
          const draft = rowToTechnicalDraft(
            row,
            mappingTyped,
            {
              fabricTypeId: fabric.id,
              fabricTypeName: fabric.name,
              machineId: machine.id,
              machineName: machine.name,
            },
            payload.singleWidthKind
          );
          if (
            draft.weightGsm == null &&
            draft.openWidth == null &&
            draft.tubeWidth == null
          ) {
            errors++;
            continue;
          }

          const recipeMatch =
            draft.fabricRecipeCode != null
              ? recipes.find(
                  (r) =>
                    r.code.trim().toLowerCase() ===
                    draft.fabricRecipeCode!.trim().toLowerCase()
                )
              : undefined;
          const fabricTypeId = recipeMatch?.fabricTypeId ?? fabric.id;
          const fabricTypeName =
            qFab.data?.find((f) => f.id === fabricTypeId)?.name ?? fabric.name;

          await createTechnicalRecord({
            fabricRecipeId: recipeMatch?.id,
            fabricTypeId,
            fabricTypeName,
            machineId: machine.id,
            machineName: machine.name,
            machineType: draft.machineType ?? machine.type,
            machineDiameter: draft.machineDiameter ?? machine.diameter,
            pusFein: draft.pusFein ?? machine.pusFeinMax,
            needleCount: draft.needleCount ?? machine.needleMax,
            yarnTypeSummary: recipeMatch?.yarnConstructionLabel ?? "Import",
            cottonRatio: draft.cottonRatio,
            polyesterRatio: draft.polyesterRatio,
            lycraRatio: draft.lycraRatio,
            viscoseRatio: draft.viscoseRatio,
            tubeWidth: draft.tubeWidth,
            openWidth: draft.openWidth,
            weightGsm: draft.weightGsm ?? 180,
            yarnLength: draft.yarnLength,
            isApproved: false,
            isActive: true,
            sourceFileName: fileName,
            sourceSheetName: selectedSheet,
            confidenceScore: mappingConfidence(mappingTyped),
            notes: draft.notes,
          });
          imported++;
        } catch {
          errors++;
        }
      }

      const conf = mappingConfidence(mappingTyped);
      if (payload.jid) {
        await updateImportJob(payload.jid, {
          status: "completed",
          stats: {
            rowsRead: rows.length,
            rowsImported: imported,
            rowsError: errors,
            duplicateCount: 0,
            autoMappedColumns: Object.values(mappingTyped).filter(Boolean).length,
            userMappedColumns: 0,
            confidenceScore: conf,
          },
        });
      }

      return { imported, errors, confidence: conf };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["technical"] });
      qc.invalidateQueries({ queryKey: ["imports"] });
      setResultStats(res);
      setStep(4);
      toast.success("İçe aktarma tamamlandı");
    },
    onError: (e) => toast.error(String(e)),
  });

  const mBulkKaynak = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dev/bulk-import-kaynak", { method: "POST" });
      const j = (await res.json()) as {
        ok?: boolean;
        totalRecords?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      return j;
    },
    onSuccess: (j) => {
      qc.invalidateQueries({ queryKey: ["technical"] });
      qc.invalidateQueries({ queryKey: ["technical-all"] });
      toast.success(`excel-kaynak: ${j.totalRecords ?? 0} teknik kayıt`);
      const errs = j.errors ?? [];
      if (errs.length > 0) {
        toast.warning(errs.slice(0, 4).join(" · "));
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const mStructuredDuzIkiIplik = useMutation({
    mutationFn: async () => {
      if (!buffer) throw new Error("Dosya yok");
      const machines = qMac.data ?? [];
      const recipes = qRecipes.data ?? [];
      const fabric = qFab.data?.find((f) => f.id === fabricIdForStructured);
      if (!machines.length) throw new Error("Makine listesi boş");
      if (!fabric) throw new Error("Kumaş türü seçin");

      const { enler, gramaj, workbook } = parseIkiIplikWorkbook(buffer);
      const enriched = enrichEnlerDraftsWithGramajMedian(enler, gramaj);
      const sourceName = fileName.trim() || workbook;
      const rows = enlerDraftsToTechnicalArgs(enriched, {
        fabricTypeId: fabric.id,
        fabricTypeName: fabric.name,
        recipes,
        sourceWorkbookName: sourceName,
        sourceSheetName: SHEET_ENLER,
        pickMachine: (d, pus, needle) =>
          pickMachineForDuzIkiIplik(machines, d, pus, needle),
      });
      const n = await replaceTechnicalRecordsFromSource(
        sourceName,
        SHEET_ENLER,
        rows
      );
      return { imported: n };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["technical"] });
      qc.invalidateQueries({ queryKey: ["technical-all"] });
      toast.success(`Düz iki iplik (ENLER+GRAMAJ): ${res.imported} kayıt`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Excel içe aktarma</h1>
        <p className="text-slate-600">
          Yükleme, sayfa seçimi, kolon eşleştirme ve teknik kayıt oluşturma (DEMO). Reçete
          kodu kolonunu &quot;Kumaş reçeteleri&quot; ekranındaki kodla eşleştirebilirsiniz.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((s) => (
          <Badge key={s} variant={step >= s ? "default" : "outline"}>
            {s}.{" "}
            {s === 1
              ? "Dosya"
              : s === 2
                ? "Sayfa"
                : s === 3
                  ? "Eşleştirme"
                  : "Sonuç"}
          </Badge>
        ))}
      </div>

      <Card className="border-amber-200/80 bg-amber-50/25">
        <CardHeader>
          <CardTitle className="text-amber-950">Toplu: tüm excel-kaynak</CardTitle>
          <CardDescription>
            Sunucu <code className="text-xs">data/excel-kaynak/*.xlsx</code> dosyalarını okur;
            ENLER, gramaj ızgaraları, ORANLARI ve üç iplik sayfalarını ayrıştırır. Geliştirme
            ortamında veya ALLOW_BULK_IMPORT=1 iken çalışır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="border-amber-300"
            disabled={mBulkKaynak.isPending}
            onClick={() => mBulkKaynak.mutate()}
          >
            {mBulkKaynak.isPending ? "İçe aktarılıyor…" : "Tüm kaynak Excel’leri içe aktar"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Dosya yükleme
          </CardTitle>
          <CardDescription>.xlsx — SheetJS ile istemci tarafı parse</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {fileName && (
            <p className="mt-2 text-sm text-slate-600">
              Seçili: <span className="font-medium">{fileName}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {showDuzIkiIplikShortcut && (
        <Card className="border-indigo-200/80 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-indigo-950">Yapılandırılmış kaynak: Düz iki iplik</CardTitle>
            <CardDescription>
              Dosyada &quot;{SHEET_ENLER}&quot; ve &quot;DÜZ İKİ İPLİK GRAMAJ&quot; bulundu.
              Kolon eşleştirmesine gerek yok; ENLER teknik kayıt, GRAMAJ ile GSM medyanı
              doldurulur.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="structured-fabric">Kumaş türü</Label>
              <select
                id="structured-fabric"
                className="h-10 w-full min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={fabricIdForStructured}
                onChange={(e) => setStructuredFabricOverride(e.target.value)}
              >
                {(qFab.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} — {f.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="default"
              className="bg-indigo-700 hover:bg-indigo-800"
              disabled={mStructuredDuzIkiIplik.isPending || !fabricIdForStructured}
              onClick={() => mStructuredDuzIkiIplik.mutate()}
            >
              {mStructuredDuzIkiIplik.isPending
                ? "İçe aktarılıyor…"
                : "Düz iki iplik olarak içe aktar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {sheets.length > 0 && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Sayfa seçimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Sheet</Label>
            <select
              className="h-10 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              {sheets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Önizleme &amp; kolon eşleştirme</CardTitle>
            <CardDescription>
              {preview.rowCount} satır • Otomatik öneriler Türkçe/İngilizce başlıklara göre
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm">
              <p className="font-medium text-slate-800">
                Tek bir &quot;en&quot; kolonu eşleştiriyorsanız türünü seçin:
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="importWidthKind"
                    checked={importWidthKind === "open"}
                    onChange={() => setImportWidthKind("open")}
                  />
                  Açık en
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="importWidthKind"
                    checked={importWidthKind === "tube"}
                    onChange={() => setImportWidthKind("tube")}
                  />
                  Tüp en
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Ayrı &quot;Açık en&quot; ve &quot;Tüp en&quot; kolonları
                eşleştirdiyseniz bu seçim yalnızca &quot;En (tek kolon)&quot;
                satırlarını etkiler.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview.headers.map((h) => (
                      <TableHead key={h} className="min-w-[140px]">
                        <div className="space-y-2">
                          <span className="font-mono text-xs">{h}</span>
                          <select
                            className="h-9 w-full rounded-md border border-slate-200 text-xs"
                            value={mapping[h] ?? "skip"}
                            onChange={(e) =>
                              setMapping({
                                ...mapping,
                                [h]: e.target.value as TechnicalImportFieldKey,
                              })
                            }
                          >
                            {FIELD_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.slice(0, 8).map((row, i) => (
                    <TableRow key={i}>
                      {preview.headers.map((h) => (
                        <TableCell key={h} className="max-w-[180px] truncate text-xs">
                          {String(row[h] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  const jid = await mJob.mutateAsync();
                  setJobId(jid);
                  await mImport.mutateAsync({
                    jid,
                    singleWidthKind: importWidthKind,
                  });
                }}
                disabled={mImport.isPending || mJob.isPending}
              >
                İşi oluştur ve içe aktar
              </Button>
              <Badge variant="secondary">
                Eşleştirme güveni:{" "}
                {Math.round(mappingConfidence(mapping as Record<string, TechnicalImportFieldKey | undefined>) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && resultStats && (
        <Card className="border-emerald-200/80 bg-emerald-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="h-5 w-5" />
              İçe aktarma özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-emerald-900 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-emerald-700/80">İçe alınan</p>
              <p className="text-2xl font-semibold">{resultStats.imported}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-emerald-700/80">Hatalı</p>
              <p className="text-2xl font-semibold">{resultStats.errors}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-emerald-700/80">Güven</p>
              <p className="text-2xl font-semibold">
                {Math.round(resultStats.confidence * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="text-base">Son import işleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(qJobs.data ?? []).map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{j.fileName}</p>
                <p className="text-xs text-slate-500">{j.status}</p>
              </div>
              <Badge variant="outline">{j.sheetNames.length} sayfa</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
