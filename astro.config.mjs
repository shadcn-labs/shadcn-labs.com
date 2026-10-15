// @ts-check
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import { cacheVercel } from "@astrojs/vercel/cache";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
  }),
  // Query-aware contact shells are cached at the edge; deferred public data
  // components set their own CDN cache headers.
  cache: {
    provider: cacheVercel(),
  },
  fonts: [
    {
      cssVariable: "--font-geist-sans",
      fallbacks: ["sans-serif"],
      name: "Geist Sans",
      provider: fontProviders.fontsource(),
      // Astro only loads 400 by default; 500 (headings, buttons) and 700
      // (prices) would otherwise render as 400 or faux bold.
      weights: [400, 500, 600, 700],
    },
    {
      cssVariable: "--font-geist-mono",
      fallbacks: ["monospace"],
      name: "Geist Mono",
      provider: fontProviders.fontsource(),
      weights: [400, 700],
    },
  ],
  image: {
    remotePatterns: [
      {
        hostname: "**.public.blob.vercel-storage.com",
        protocol: "https",
      },
      {
        hostname: "avatars.githubusercontent.com",
        protocol: "https",
      },
    ],
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  integrations: [react()],
  output: "static",
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: true,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      noExternal: ["react-tweet"],
    },
  },
});
