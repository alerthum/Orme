"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createYarnType,
  deleteYarnType,
  listYarnTypes,
  updateYarnType,
} from "@/repositories/yarn-types";
import type { YarnType } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const kinds = [
  "Pamuk",
  "Polyester",
  "Likra",
  "Viskon",
  "Modal",
  "Elastan",
  "Diğer",
];

export default function YarnTypesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["yarnTypes"], queryFn: listYarnTypes });
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<YarnType | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    kind: "Pamuk",
    description: "",
    unit: "kg",
    isActive: true,
  });

  const reset = () => {
    setEditing(null);
    setForm({
      name: "",
      kind: "Pamuk",
      description: "",
      unit: "kg",
      isActive: true,
    });
  };

  const mCreate = useMutation({
    mutationFn: () =>
      createYarnType({
        name: form.name,
        kind: form.kind,
        description: form.description || undefined,
        unit: form.unit,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yarnTypes"] });
      toast.success("İplik türü kaydedildi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mUpdate = useMutation({
    mutationFn: () =>
      updateYarnType(editing!.id, {
        name: form.name,
        kind: form.kind,
        description: form.description || undefined,
        unit: form.unit,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yarnTypes"] });
      toast.success("Güncellendi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteYarnType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["yarnTypes"] });
      toast.success("Silindi");
    },
  });

  const filtered = (q.data ?? []).filter(
    (y) =>
      y.name.toLowerCase().includes(search.toLowerCase()) ||
      y.kind.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (row: YarnType) => {
    setEditing(row);
    setForm({
      name: row.name,
      kind: row.kind,
      description: row.description ?? "",
      unit: row.unit,
      isActive: row.isActive,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">İplik türleri</h1>
          <p className="text-slate-600">
            Hammadde bileşenleri — pamuk, polyester, likra vb.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => reset()}>
              <Plus className="h-4 w-4" />
              Yeni iplik
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "İplik türü düzenle" : "Yeni iplik türü"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Ad</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="örn. Ne 30/1 Penye"
                />
              </div>
              <div className="space-y-2">
                <Label>Tür</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Aktif
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button
                disabled={!form.name}
                onClick={() => (editing ? mUpdate.mutate() : mCreate.mutate())}
              >
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {q.isLoading ? (
            <p className="text-sm text-slate-500">Yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">Kayıt yok</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.kind}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "success" : "secondary"}>
                        {row.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Silmek istediğinize emin misiniz?")) {
                            mDelete.mutate(row.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
