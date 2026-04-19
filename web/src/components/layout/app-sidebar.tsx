"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Cog,
  Database,
  FileSpreadsheet,
  Calculator,
  GitCompare,
  History,
  Settings,
  Package,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fabric-types", label: "Kumaş türleri", icon: Layers },
  { href: "/fabric-recipes", label: "Kumaş reçeteleri", icon: BookMarked },
  { href: "/yarn-types", label: "İplik türleri", icon: Package },
  { href: "/machines", label: "Makineler", icon: Cog },
  { href: "/technical-library", label: "Teknik veri", icon: Database },
  { href: "/import", label: "Excel içe aktar", icon: FileSpreadsheet },
  { href: "/orders/calculate", label: "Sipariş hesaplama", icon: Calculator },
  { href: "/orders/compare", label: "Alternatif kıyas", icon: GitCompare },
  { href: "/orders/history", label: "Sipariş geçmişi", icon: History },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { profile, signOutApp, demoSignIn } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          YÖ
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Yokuş Örme Yazılımı</p>
          <p className="text-xs text-slate-500">Planlama &amp; KDS</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile?.displayName ?? "—"}
            </p>
            <p className="truncate text-xs text-slate-500">{profile?.email}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {profile?.role ?? "—"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => signOutApp()}
          >
            Çıkış
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" asChild>
            <Link href="/login">Giriş</Link>
          </Button>
        </div>
        {profile?.uid === "demo" && (
          <Button variant="ghost" size="sm" className="w-full" onClick={demoSignIn}>
            Demo oturumu yenile
          </Button>
        )}
      </div>
    </aside>
  );
}
