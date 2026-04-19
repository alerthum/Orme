"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { CalculationAlternative } from "@/types";
import type { OrderFormValues } from "@/validators/order";
import { orderWidthSummary } from "@/lib/order-width";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const STORAGE_KEY = "yokus-last-calculation";

export default function ComparePage() {
  const [payload, setPayload] = React.useState<{
    alternatives: CalculationAlternative[];
    form: OrderFormValues;
  } | null>(null);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const columns = React.useMemo<ColumnDef<CalculationAlternative>[]>(
    () => [
      {
        accessorKey: "machineName",
        header: "Makine",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.machineName}</p>
            {row.original.isRecommended && (
              <Badge className="mt-1" variant="success">
                Önerilen
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "spec",
        header: "Çap / Fein / İğne",
        cell: ({ row }) =>
          `${row.original.diameter}" / ${row.original.pusFein} / ${row.original.needleCount}`,
      },
      {
        accessorKey: "estimatedOpenWidth",
        header: "Açık en",
      },
      {
        accessorKey: "estimatedTubeWidth",
        header: "Tüp en",
      },
      {
        accessorKey: "estimatedGsm",
        header: "Gramaj",
      },
      {
        id: "yarnSum",
        header: "İplik özeti",
        cell: ({ row }) => row.original.yarnTypeSummary ?? "—",
      },
      {
        id: "yarnLen",
        header: "m/kg (demo)",
        cell: ({ row }) =>
          row.original.yarnLengthMPerKg != null
            ? row.original.yarnLengthMPerKg.toFixed(2)
            : "—",
      },
      {
        accessorKey: "matchScore",
        header: "Skor",
      },
      {
        accessorKey: "confidence",
        header: "Güven",
      },
      {
        id: "yarnKg",
        header: "İplik ihtiyacı (fire dahil)",
        cell: ({ row }) => {
          const parts = row.original.materials.filter(
            (x) =>
              x.component.toLowerCase().includes("iplik") ||
              x.component.toLowerCase().includes("ana")
          );
          const t = parts.reduce((s, x) => s + x.withWasteKg, 0);
          return t > 0 ? `${t.toFixed(1)} kg` : "—";
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: payload?.alternatives ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Alternatif makina kıyası
          </h1>
          <p className="text-slate-600">
            Son hesaplamadan gelen alternatifler yan yana
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/orders/calculate">Hesaplamaya dön</Link>
        </Button>
      </div>

      {!payload && (
        <Card className="border-amber-200/80 bg-amber-50/50">
          <CardHeader>
            <CardTitle>Veri yok</CardTitle>
            <CardDescription>
              Önce sipariş hesaplama ekranında &quot;Hesapla&quot; çalıştırın.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {payload && (
        <>
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base">Sipariş özeti</CardTitle>
              <CardDescription>
                {payload.form.orderTitle} — {payload.form.customerName} — Hedef GSM{" "}
                {payload.form.targetGsm}, {orderWidthSummary(payload.form)}
                {payload.form.fabricRecipeCode
                  ? ` • Reçete ${payload.form.fabricRecipeCode}`
                  : ""}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle>Karşılaştırma tablosu</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {payload.alternatives.map((a) => (
              <Card key={a.technicalRecordId} className="border-slate-200/80">
                <CardHeader>
                  <CardTitle className="text-base">{a.machineName}</CardTitle>
                  <CardDescription>
                    Skor {a.matchScore} • Güven {a.confidence}
                    {a.materials.length > 1
                      ? ` • ${a.materials.length} hammadde kalemi`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Tahmini açık / tüp: {a.estimatedOpenWidth} / {a.estimatedTubeWidth}{" "}
                    cm
                  </p>
                  <p>Gramaj: {a.estimatedGsm} g/m²</p>
                  {(a.yarnTypeSummary != null || a.yarnLengthMPerKg != null) && (
                    <p className="text-slate-600">
                      İplik: {a.yarnTypeSummary ?? "—"}
                      {a.yarnLengthMPerKg != null
                        ? ` • ${a.yarnLengthMPerKg.toFixed(2)} m/kg (demo)`
                        : ""}
                    </p>
                  )}
                  <div className="rounded-lg bg-slate-50 p-2 text-xs">
                    {a.materials.map((m, idx) => (
                      <div
                        key={`${m.component}-${idx}`}
                        className="flex justify-between py-0.5"
                      >
                        <span>{m.component}</span>
                        <span>{m.withWasteKg.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
