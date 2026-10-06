import { defineConfig } from "oxlint";
import astro from "ultracite/oxlint/astro";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core, astro],
  // Vendored EvilCharts registry code: kept as upstream ships it so
  // `shadcn add @evilcharts/...` can update it without a lint rewrite.
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "src/components/evilcharts/**",
  ],
});
