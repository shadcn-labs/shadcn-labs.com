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
  // Serves the on-demand routes (src/pages/issues.astro and
  // src/pages/contributors.astro) from the Vercel edge, so GitHub is hit at
  // most once per TTL no matter how many people load the pages.
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
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      noExternal: ["react-tweet"],
    },
  },
});
