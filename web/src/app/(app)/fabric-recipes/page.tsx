"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFabricRecipe,
  deleteFabricRecipe,
  listFabricRecipes,
  updateFabricRecipe,
} from "@/repositories/fabric-recipes";
import { listFabricTypes } from "@/repositories/fabric-types";
import type { FabricRecipe } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const structurePresets = [
  "düz 2 iplik",
  "full lycra 2 iplik",
  "interlok",
  "ribana",
  "diğer",
];

export default function FabricRecipesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["fabricRecipes"], queryFn: listFabricRecipes });
  const qFab = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FabricRecipe | null>(null);
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    fabricTypeId: "",
    structureCategory: "düz 2 iplik",
    frontYarnNe: 20,
    backYarnNe: 10,
    yarnConstructionLabel: "",
    colorOrVariantNote: "",
    isActive: true,
  });

  const reset = () => {
    setEditing(null);
    const firstFt = qFab.data?.[0]?.id ?? "";
    setForm({
      code: "",
      name: "",
      fabricTypeId: firstFt,
      structureCategory: "düz 2 iplik",
      frontYarnNe: 20,
      backYarnNe: 10,
      yarnConstructionLabel: "",
      colorOrVariantNote: "",
      isActive: true,
    });
  };

  React.useEffect(() => {
    if (!form.fabricTypeId && qFab.data?.[0]?.id) {
      setForm((f) => ({ ...f, fabricTypeId: qFab.data![0]!.id }));
    }
  }, [qFab.data, form.fabricTypeId]);

  const mCreate = useMutation({
    mutationFn: () => {
      const label =
        form.yarnConstructionLabel.trim() ||
        `${form.frontYarnNe}/${form.backYarnNe}`;
      return createFabricRecipe({
        code: form.code.trim(),
        name: form.name.trim(),
        fabricTypeId: form.fabricTypeId,
        structureCategory: form.structureCategory.trim(),
        frontYarnNe: form.frontYarnNe,
        backYarnNe: form.backYarnNe,
        yarnConstructionLabel: label,
        colorOrVariantNote: form.colorOrVariantNote.trim() || undefined,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricRecipes"] });
      toast.success("Reçete kaydedildi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mUpdate = useMutation({
    mutationFn: () => {
      const label =
        form.yarnConstructionLabel.trim() ||
        `${form.frontYarnNe}/${form.backYarnNe}`;
      return updateFabricRecipe(editing!.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        fabricTypeId: form.fabricTypeId,
        structureCategory: form.structureCategory.trim(),
        frontYarnNe: form.frontYarnNe,
        backYarnNe: form.backYarnNe,
        yarnConstructionLabel: label,
        colorOrVariantNote: form.colorOrVariantNote.trim() || undefined,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricRecipes"] });
      toast.success("Güncellendi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFabricRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricRecipes"] });
      toast.success("Silindi");
    },
    onError: (e) => toast.error(String(e)),
  });

  const fabricName = React.useCallback(
    (id: string) => qFab.data?.find((f) => f.id === id)?.name ?? id,
    [qFab.data]
  );

  const rows = React.useMemo(() => {
    const list = q.data ?? [];
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (r) =>
        r.code.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.yarnConstructionLabel.toLowerCase().includes(s)
    );
  }, [q.data, search]);

  const openEdit = (row: FabricRecipe) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      fabricTypeId: row.fabricTypeId,
      structureCategory: row.structureCategory,
      frontYarnNe: row.frontYarnNe,
      backYarnNe: row.backYarnNe,
      yarnConstructionLabel: row.yarnConstructionLabel,
      colorOrVariantNote: row.colorOrVariantNote ?? "",
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const canSave =
    form.code.trim() &&
    form.name.trim() &&
    form.fabricTypeId &&
    form.frontYarnNe > 0 &&
    form.backYarnNe > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Kumaş reçeteleri</h1>
          <p className="text-slate-600">
            Yapı varyantları; sipariş ve Excel içe aktarmada kod ile eşleşir (
            <code className="rounded bg-slate-100 px-1 text-xs">fabricRecipes</code>).
          </p>
        </div>
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni reçete
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Reçeteyi düzenle" : "Yeni reçete"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div>
                <Label>Kod</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="örn. D2-24/12"
                />
              </div>
              <div>
                <Label>Kumaş türü</Label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  value={form.fabricTypeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fabricTypeId: e.target.value }))
                  }
                >
                  {(qFab.data ?? []).map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Ad</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Yapı kategorisi</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                value={form.structureCategory}
                onChange={(e) =>
                  setForm((f) => ({ ...f, structureCategory: e.target.value }))
                }
              >
                {structurePresets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ön Ne</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.frontYarnNe}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      frontYarnNe: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Arka Ne</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.backYarnNe}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      backYarnNe: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>İplik etiketi (teknik satır / yarnTypeSummary)</Label>
              <Input
                value={form.yarnConstructionLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, yarnConstructionLabel: e.target.value }))
                }
                placeholder={`Boşsa ${form.frontYarnNe}/${form.backYarnNe} kullanılır`}
              />
            </div>
            <div>
              <Label>Renk / varyant notu</Label>
              <Textarea
                value={form.colorOrVariantNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, colorOrVariantNote: e.target.value }))
                }
                rows={2}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              Aktif
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button
                disabled={!canSave || mCreate.isPending || mUpdate.isPending}
                onClick={() => (editing ? mUpdate.mutate() : mCreate.mutate())}
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>Reçete listesi</CardTitle>
          <CardDescription>
            Excel içe aktarmada &quot;Reçete kodu&quot; kolonunu bu listedeki kodla eşleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Kod, ad veya iplik etiketi ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          {q.isLoading && <p className="text-sm text-slate-500">Yükleniyor…</p>}
          <div className="rounded-xl border border-slate-200/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kumaş türü</TableHead>
                  <TableHead>Yapı</TableHead>
                  <TableHead>İplik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.code}</TableCell>
                    <TableCell className="max-w-[200px]">{r.name}</TableCell>
                    <TableCell>{fabricName(r.fabricTypeId)}</TableCell>
                    <TableCell className="text-slate-600">{r.structureCategory}</TableCell>
                    <TableCell>
                      Ne {r.frontYarnNe} / Ne {r.backYarnNe} ({r.yarnConstructionLabel})
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? "secondary" : "outline"}>
                        {r.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => {
                            if (confirm(`"${r.code}" silinsin mi?`)) mDelete.mutate(r.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!q.isLoading && rows.length === 0 && (
            <p className="text-sm text-slate-500">Kayıt bulunamadı.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
