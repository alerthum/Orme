"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTechnicalRecords,
  deleteTechnicalRecord,
} from "@/repositories/technical-records";
import { listFabricTypes } from "@/repositories/fabric-types";
import { listFabricRecipes } from "@/repositories/fabric-recipes";
import type { TechnicalRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function TechnicalLibraryPage() {
  const qc = useQueryClient();
  const [fabricFilter, setFabricFilter] = React.useState<string>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [detail, setDetail] = React.useState<TechnicalRecord | null>(null);

  const qFab = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const qRec = useQuery({ queryKey: ["fabricRecipes"], queryFn: listFabricRecipes });
  const q = useQuery({
    queryKey: ["technical", fabricFilter],
    queryFn: () =>
      listTechnicalRecords(fabricFilter === "all" ? undefined : fabricFilter),
  });

  const mDel = useMutation({
    mutationFn: (id: string) => deleteTechnicalRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["technical"] });
      toast.success("Silindi");
    },
  });

  const columns = React.useMemo<ColumnDef<TechnicalRecord>[]>(
    () => [
      { accessorKey: "fabricTypeName", header: "Kumaş" },
      { accessorKey: "machineName", header: "Makine" },
      {
        accessorKey: "pusFein",
        header: "Pus/Fein",
        cell: (c) => c.getValue() as number,
      },
      {
        accessorKey: "needleCount",
        header: "İğne",
        cell: (c) => c.getValue() as number,
      },
      {
        accessorKey: "openWidth",
        header: "Açık en",
        cell: (c) => (c.getValue() as number | undefined)?.toFixed(1) ?? "—",
      },
      {
        accessorKey: "tubeWidth",
        header: "Tüp en",
        cell: (c) => (c.getValue() as number | undefined)?.toFixed(1) ?? "—",
      },
      {
        accessorKey: "weightGsm",
        header: "Gramaj",
        cell: (c) => c.getValue() as number,
      },
      {
        id: "src",
        header: "Kaynak",
        cell: ({ row }) =>
          row.original.sourceFileName ? (
            <span className="text-xs text-slate-500">
              {row.original.sourceFileName}
            </span>
          ) : (
            <Badge variant="secondary">Manuel</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => setDetail(row.original)}>
              Detay
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm("Kaydı silinsin mi?")) mDel.mutate(row.original.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [mDel]
  );

  const table = useReactTable({
    data: q.data ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Teknik veri kütüphanesi</h1>
        <p className="text-slate-600">
          Örme parametreleri, tahmini enler ve gramaj — filtre &amp; tablo. Kayıtlarda
          açık en ve tüp en ayrı tutulur; sipariş hesaplamada ise tek en girişi ve
          tür seçimi (açık / tüp) kullanılır.
        </p>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Kayıtlar</CardTitle>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={fabricFilter}
              onChange={(e) => setFabricFilter(e.target.value)}
            >
              <option value="all">Tüm kumaşlar</option>
              {(qFab.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Tabloda ara..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-slate-500">Yükleniyor…</p>
          ) : (q.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500">Kayıt yok — import veya seed ekleyin.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
                  {table.getPageCount() || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Teknik kayıt</DialogTitle>
          </DialogHeader>
          {detail && (
            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-500">Kumaş:</span>{" "}
                  <span className="font-medium">{detail.fabricTypeName}</span>
                </p>
                <p>
                  <span className="text-slate-500">Makine:</span>{" "}
                  {detail.machineName} ({detail.machineDiameter}&quot;)
                </p>
                <p>
                  <span className="text-slate-500">Pus/Fein:</span> {detail.pusFein} •{" "}
                  <span className="text-slate-500">İğne:</span> {detail.needleCount}
                </p>
                <p>
                  <span className="text-slate-500">İplik özeti:</span>{" "}
                  {detail.yarnTypeSummary ?? "—"}
                </p>
                {detail.fabricRecipeId != null && (
                  <p>
                    <span className="text-slate-500">Reçete:</span>{" "}
                    {qRec.data?.find((x) => x.id === detail.fabricRecipeId)?.code ??
                      detail.fabricRecipeId}
                  </p>
                )}
                {detail.yarnLength != null && (
                  <p>
                    <span className="text-slate-500">İplik uzunluğu (demo m/kg):</span>{" "}
                    {detail.yarnLength}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Açık / Tüp:</span>{" "}
                  {detail.openWidth ?? "—"} / {detail.tubeWidth ?? "—"} cm
                </p>
                <p>
                  <span className="text-slate-500">Gramaj:</span> {detail.weightGsm} g/m²
                </p>
                <p>
                  <span className="text-slate-500">Bileşen:</span> Pamuk{" "}
                  {detail.cottonRatio ?? "—"}% • PES {detail.polyesterRatio ?? "—"}% •
                  Likra {detail.lycraRatio ?? "—"}%
                </p>
                {detail.notes && (
                  <p className="rounded-lg bg-slate-50 p-2 text-slate-700">{detail.notes}</p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
