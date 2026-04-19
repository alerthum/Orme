"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const { profile, signInEmail, signInGoogle, demoSignIn, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("demo@yokus.local");
  const [password, setPassword] = React.useState("");
  const firebaseOn = isFirebaseConfigured();

  React.useEffect(() => {
    if (!loading && profile) {
      router.replace("/dashboard");
    }
  }, [loading, profile, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!firebaseOn) {
        demoSignIn();
        toast.success("Demo oturumu başlatıldı");
        router.push("/dashboard");
        return;
      }
      await signInEmail(email, password);
      toast.success("Giriş başarılı");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Giriş başarısız");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/40">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Yokuş Örme Yazılımı · DEMO V1
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Örme siparişinde
              <span className="text-sky-700"> saniyeler içinde </span>
              teknik öneri.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              Makine, pus/fein, iğne, tahmini en ve gramaj; hammadde ihtiyacı ve
              alternatifler tek ekranda. Satıştan planlamaya ortak dil.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                Firebase hazır
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                Excel önizleme
              </span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                Skorlu alternatifler
              </span>
            </div>
          </div>

          <Card className="border-slate-200/80 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle>Giriş</CardTitle>
              <CardDescription>
                {firebaseOn
                  ? "E-posta ile giriş veya Google (yapılandırıldıysa)."
                  : "Firebase yapılandırılmadı — tek tıkla demo oturumu."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!firebaseOn}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!firebaseOn}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {firebaseOn ? "Giriş yap" : "Demo ile devam et"}
                </Button>
                {firebaseOn && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await signInGoogle();
                        router.push("/dashboard");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Google giriş hatası"
                        );
                      }
                    }}
                  >
                    Google ile giriş
                  </Button>
                )}
              </form>
              <p className="mt-4 text-center text-xs text-slate-500">
                Devam ederek{" "}
                <Link href="#" className="underline">
                  kullanım koşullarını
                </Link>{" "}
                kabul etmiş olursunuz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
