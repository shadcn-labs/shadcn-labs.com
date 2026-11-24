// @ts-check
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import { cacheVercel } from "@astrojs/vercel/cache";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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
  // Canonical production origin used to build absolute canonical + sitemap URLs.
  site: "https://www.shadcn-labs.com",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      noExternal: ["react-tweet"],
    },
  },
});
