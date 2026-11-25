// Single source of truth for routes that must not be indexed.
// Used both for the `noindex` meta tag (in the base layout) and for
// excluding routes from `/sitemap.xml`.
export const NOINDEX_ROUTES = ["/sponsors/welcome"] as const;

const normalizePath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname;

export const isNoindexRoute = (pathname: string) =>
  NOINDEX_ROUTES.some((route) => normalizePath(pathname) === route);
