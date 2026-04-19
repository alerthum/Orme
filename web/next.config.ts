import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /** Kök `/` için RSC `redirect()` yerine config yönlendirmesi — Vercel’de statik ○ + redirect uyumsuzluğunu önler */
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
