"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFabricType,
  deleteFabricType,
  listFabricTypes,
  updateFabricType,
} from "@/repositories/fabric-types";
import type { FabricType } from "@/types";
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

const categories = [
  "Süprem",
  "Ribana",
  "İnterlok",
  "İki İplik",
  "Üç İplik",
  "Lakost",
  "Selanik",
  "Diğer",
];

export default function FabricTypesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FabricType | null>(null);
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    category: "İki İplik",
    subCategory: "",
    description: "",
    isActive: true,
  });

  const reset = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      category: "İki İplik",
      subCategory: "",
      description: "",
      isActive: true,
    });
  };

  const mCreate = useMutation({
    mutationFn: () =>
      createFabricType({
        code: form.code,
        name: form.name,
        category: form.category,
        subCategory: form.subCategory || undefined,
        description: form.description || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricTypes"] });
      toast.success("Kaydedildi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mUpdate = useMutation({
    mutationFn: () =>
      updateFabricType(editing!.id, {
        code: form.code,
        name: form.name,
        category: form.category,
        subCategory: form.subCategory || undefined,
        description: form.description || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricTypes"] });
      toast.success("Güncellendi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteFabricType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricTypes"] });
      toast.success("Silindi");
    },
    onError: (e) => toast.error(String(e)),
  });

  const filtered = (q.data ?? []).filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (row: FabricType) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      category: row.category,
      subCategory: row.subCategory ?? "",
      description: row.description ?? "",
      isActive: row.isActive,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Kumaş türleri</h1>
          <p className="text-slate-600">Katalog yönetimi ve arama</p>
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
              Yeni
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Kumaş türü düzenle" : "Yeni kumaş türü"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kod</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ad</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Kategori</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Alt kategori</Label>
                <Input
                  value={form.subCategory}
                  onChange={(e) =>
                    setForm({ ...form, subCategory: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
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
                disabled={!form.code || !form.name}
                onClick={() =>
                  editing ? mUpdate.mutate() : mCreate.mutate()
                }
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
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.category}</TableCell>
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
