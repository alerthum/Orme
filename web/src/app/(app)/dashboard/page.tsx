"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listFabricTypes } from "@/repositories/fabric-types";
import { listMachines } from "@/repositories/machines";
import { listTechnicalRecords } from "@/repositories/technical-records";
import { listImportJobs } from "@/repositories/import-jobs";
import { listOrders } from "@/repositories/orders";
import { listYarnTypes } from "@/repositories/yarn-types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Database, Layers, Cog, FileSpreadsheet, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const qFab = useQuery({ queryKey: ["fabricTypes"], queryFn: listFabricTypes });
  const qMac = useQuery({ queryKey: ["machines"], queryFn: listMachines });
  const qTech = useQuery({ queryKey: ["technical"], queryFn: () => listTechnicalRecords() });
  const qImp = useQuery({ queryKey: ["imports"], queryFn: listImportJobs });
  const qOrd = useQuery({ queryKey: ["orders"], queryFn: listOrders });
  const qYarn = useQuery({ queryKey: ["yarnTypes"], queryFn: listYarnTypes });

  const fabricByCat =
    qFab.data?.reduce<Record<string, number>>((acc, f) => {
      acc[f.category] = (acc[f.category] ?? 0) + 1;
      return acc;
    }, {}) ?? {};
  const chartData = Object.entries(fabricByCat).map(([name, count]) => ({
    name,
    count,
  }));

  const lowConfidence =
    qTech.data?.filter((r) => (r.confidenceScore ?? 1) < 0.75).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Özet metrikler, son içe aktarmalar ve sipariş aktivitesi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/orders/calculate">Yeni hesaplama</Link>
          </Button>
          <Button asChild>
            <Link href="/import">Excel yükle</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Kumaş türleri"
          value={qFab.data?.length ?? "—"}
          hint="Aktif katalog"
          icon={Layers}
          loading={qFab.isLoading}
        />
        <MetricCard
          title="İplik türleri"
          value={qYarn.data?.length ?? "—"}
          hint="Hammadde bileşen"
          icon={Package}
          loading={qYarn.isLoading}
        />
        <MetricCard
          title="Makineler"
          value={qMac.data?.length ?? "—"}
          hint="Kayıtlı ünite"
          icon={Cog}
          loading={qMac.isLoading}
        />
        <MetricCard
          title="Teknik kayıt"
          value={qTech.data?.length ?? "—"}
          hint="Kütüphane"
          icon={Database}
          loading={qTech.isLoading}
        />
        <MetricCard
          title="Import işleri"
          value={qImp.data?.length ?? "—"}
          hint="Son yüklemeler"
          icon={FileSpreadsheet}
          loading={qImp.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/80">
          <CardHeader>
            <CardTitle>Kumaş türleri – kategori dağılımı</CardTitle>
            <CardDescription>En sık kullanılan kategoriler (demo seed)</CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-[288px] min-w-0">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500">Veri yok</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Sistem durumu</CardTitle>
            <CardDescription>Demo V1 göstergeleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Eksik güven uyarısı
                </p>
                <p className="text-xs text-amber-800/90">
                  {lowConfidence} teknik kayıt düşük güven skorunda (&lt;0.75).
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Veri güveni
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {qTech.data?.length
                  ? Math.round(
                      (qTech.data.filter((r) => (r.confidenceScore ?? 0.8) >= 0.8)
                        .length /
                        qTech.data.length) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-slate-500">Yüksek güvenli kayıt oranı</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Son Excel içe aktarmaları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(qImp.data ?? []).slice(0, 5).map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{j.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {j.stats?.rowsImported ?? 0} satır • güven{" "}
                    {j.stats?.confidenceScore != null
                      ? Math.round(j.stats.confidenceScore * 100)
                      : "—"}
                    %
                  </p>
                </div>
                <Badge variant="outline">{j.status}</Badge>
              </div>
            ))}
            {!qImp.data?.length && (
              <p className="text-sm text-slate-500">Henüz içe aktarma yok.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Son sipariş hesapları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(qOrd.data ?? []).slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{o.orderTitle}</p>
                  <p className="text-xs text-slate-500">{o.customerName}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/orders/history?id=${o.id}`}>Aç</Link>
                </Button>
              </div>
            ))}
            {!qOrd.data?.length && (
              <p className="text-sm text-slate-500">Henüz kayıt yok.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard(props: {
  title: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  const Icon = props.icon;
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {props.title}
        </CardTitle>
        <Icon className="h-4 w-4 text-sky-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-slate-900">
          {props.loading ? "…" : props.value}
        </div>
        <p className="text-xs text-slate-500">{props.hint}</p>
      </CardContent>
    </Card>
  );
}
