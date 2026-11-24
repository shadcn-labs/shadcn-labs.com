import type { APIRoute } from "astro";

import { isNoindexRoute } from "@/constants/noindex";
import { ROUTES } from "@/constants/routes";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("https://www.shadcn-labs.com");
  const paths = [...new Set(Object.values(ROUTES))].filter(
    (path) => !isNoindexRoute(path)
  );

  const entries = paths
    .map((path) => {
      const route = path.endsWith("/") ? path : `${path}/`;
      return `  <url><loc>${new URL(route, origin).href}</loc></url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
