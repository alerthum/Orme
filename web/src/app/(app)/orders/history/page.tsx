"use client";

import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/repositories/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { orderWidthSummary } from "@/lib/order-width";
import * as React from "react";

export default function OrderHistoryPage() {
  const q = useQuery({ queryKey: ["orders"], queryFn: listOrders });
  const sp = useSearchParams();
  const highlight = sp.get("id");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Sipariş geçmişi</h1>
        <p className="text-slate-600">Kaydedilen hesaplamalar ve parametreler</p>
      </div>

      <div className="space-y-4">
        {q.isLoading && <p className="text-sm text-slate-500">Yükleniyor…</p>}
        {(q.data ?? []).map((o) => (
          <Card
            key={o.id}
            className={
              highlight === o.id
                ? "border-sky-300 ring-2 ring-sky-200/60"
                : "border-slate-200/80"
            }
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{o.orderTitle}</CardTitle>
                <p className="text-sm text-slate-500">
                  {o.customerName} • {o.orderCode}
                </p>
              </div>
              <Badge variant="secondary">
                {new Date(o.createdAt as Date).toLocaleString("tr-TR")}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {o.form.fabricRecipeCode != null && o.form.fabricRecipeCode !== "" && (
                <div>
                  <p className="text-xs uppercase text-slate-500">Reçete</p>
                  <p className="font-medium">{o.form.fabricRecipeCode}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase text-slate-500">Hedef GSM</p>
                <p className="font-medium">{o.form.targetGsm}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Hedef en</p>
                <p className="font-medium">{orderWidthSummary(o.form)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Miktar</p>
                <p className="font-medium">
                  {o.form.quantity} {o.form.quantityUnit}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs uppercase text-slate-500">Alternatif sayısı</p>
                <p className="font-medium">{o.recommendedAlternatives.length}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <p className="text-sm text-slate-500">Henüz kayıt yok.</p>
        )}
      </div>
    </div>
  );
}
