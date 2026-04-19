import { Suspense } from "react";

export default function OrderHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="p-8 text-sm text-slate-500">Yükleniyor…</div>}>{children}</Suspense>;
}
