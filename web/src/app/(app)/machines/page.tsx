"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMachine,
  deleteMachine,
  listMachines,
  updateMachine,
} from "@/repositories/machines";
import { listFabricTypes } from "@/repositories/fabric-types";
import type { Machine } from "@/types";
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
import * as React from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function MachinesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["machines"], queryFn: listMachines });
  const qf = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const [filter, setFilter] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Machine | null>(null);
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    type: "Yuvarlak",
    diameter: 34,
    pusFeinMin: 20,
    pusFeinMax: 32,
    needleMin: 2000,
    needleMax: 3600,
    suitableFabricTypeIds: [] as string[],
    isActive: true,
  });

  const reset = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      type: "Yuvarlak",
      diameter: 34,
      pusFeinMin: 20,
      pusFeinMax: 32,
      needleMin: 2000,
      needleMax: 3600,
      suitableFabricTypeIds: [],
      isActive: true,
    });
  };

  const mCreate = useMutation({
    mutationFn: () =>
      createMachine({
        code: form.code,
        name: form.name,
        type: form.type,
        diameter: form.diameter,
        pusFeinMin: form.pusFeinMin,
        pusFeinMax: form.pusFeinMax,
        needleMin: form.needleMin,
        needleMax: form.needleMax,
        suitableFabricTypeIds: form.suitableFabricTypeIds,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Makine kaydedildi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mUpdate = useMutation({
    mutationFn: () =>
      updateMachine(editing!.id, {
        code: form.code,
        name: form.name,
        type: form.type,
        diameter: form.diameter,
        pusFeinMin: form.pusFeinMin,
        pusFeinMax: form.pusFeinMax,
        needleMin: form.needleMin,
        needleMax: form.needleMax,
        suitableFabricTypeIds: form.suitableFabricTypeIds,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Güncellendi");
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(String(e)),
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteMachine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Silindi");
    },
  });

  const filtered = (q.data ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(filter.toLowerCase()) ||
      m.code.toLowerCase().includes(filter.toLowerCase())
  );

  const openEdit = (row: Machine) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      type: row.type,
      diameter: row.diameter,
      pusFeinMin: row.pusFeinMin,
      pusFeinMax: row.pusFeinMax,
      needleMin: row.needleMin,
      needleMax: row.needleMax,
      suitableFabricTypeIds: [...row.suitableFabricTypeIds],
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const toggleFabric = (id: string) => {
    setForm((f) => ({
      ...f,
      suitableFabricTypeIds: f.suitableFabricTypeIds.includes(id)
        ? f.suitableFabricTypeIds.filter((x) => x !== id)
        : [...f.suitableFabricTypeIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Makineler</h1>
          <p className="text-slate-600">Çap, pus/fein ve iğne aralıkları</p>
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
              Yeni makine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Makine düzenle" : "Yeni makine"}
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
              <div className="space-y-2">
                <Label>Tip</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Çap (&quot;)</Label>
                <Input
                  type="number"
                  value={form.diameter}
                  onChange={(e) =>
                    setForm({ ...form, diameter: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Pus/Fein min</Label>
                <Input
                  type="number"
                  value={form.pusFeinMin}
                  onChange={(e) =>
                    setForm({ ...form, pusFeinMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Pus/Fein max</Label>
                <Input
                  type="number"
                  value={form.pusFeinMax}
                  onChange={(e) =>
                    setForm({ ...form, pusFeinMax: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>İğne min</Label>
                <Input
                  type="number"
                  value={form.needleMin}
                  onChange={(e) =>
                    setForm({ ...form, needleMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>İğne max</Label>
                <Input
                  type="number"
                  value={form.needleMax}
                  onChange={(e) =>
                    setForm({ ...form, needleMax: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Uygun kumaş türleri</Label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
                  {(qf.data ?? []).map((ft) => (
                    <label key={ft.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.suitableFabricTypeIds.includes(ft.id)}
                        onChange={() => toggleFabric(ft.id)}
                      />
                      {ft.name}
                    </label>
                  ))}
                </div>
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
          <CardTitle className="text-base">Makine listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filtre..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          {q.isLoading ? (
            <p className="text-sm text-slate-500">Yükleniyor…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Çap</TableHead>
                  <TableHead>Pus/Fein</TableHead>
                  <TableHead>İğne</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.diameter}&quot;</TableCell>
                    <TableCell>
                      {row.pusFeinMin}–{row.pusFeinMax}
                    </TableCell>
                    <TableCell>
                      {row.needleMin}–{row.needleMax}
                    </TableCell>
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
