// @ts-check
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
  }),
  fonts: [
    {
      cssVariable: "--font-geist-sans",
      fallbacks: ["sans-serif"],
      name: "Geist Sans",
      provider: fontProviders.fontsource(),
    },
    {
      cssVariable: "--font-geist-mono",
      fallbacks: ["monospace"],
      name: "Geist Mono",
      provider: fontProviders.fontsource(),
    },
  ],
  image: {
    remotePatterns: [
      {
        hostname: "**.public.blob.vercel-storage.com",
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
  },
});
