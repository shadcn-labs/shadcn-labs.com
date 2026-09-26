import { ROUTES } from "./routes";

export const FALLBACK_SITE_ORIGIN = "https://pdfcn.dev" as const;

const getBaseUrl = () => {
  if (import.meta.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  if (import.meta.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${import.meta.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return import.meta.env.SITE_URL ?? FALLBACK_SITE_ORIGIN;
};

const baseUrl = getBaseUrl();

export const SITE = {
  AUTHOR: {
    NAME: "Aniket Pawar",
    TWITTER: "@aniketpawar",
    URL: "https://aniketpawar.com",
  },
  DESCRIPTION: {
    LONG: "Open-source shadcn/ui component registries and tools for React — termcn, agentcn, ogimagecn, framecn, mcpcn, and more.",
    SHORT: "Pushing the limits of shadcn/ui ecosystem",
  },
  LOCALE: "en_US",
  NAME: "Shadcn Labs",
  OG_IMAGE: "/og.png",
  OG_IMAGE_ALT: "Shadcn Labs",
  URL: baseUrl,
};

export const META_THEME_COLORS = {
  dark: "#1c1a12",
  light: "#f5f4ef",
};

export const UTM_PARAMS = {
  utm_source: new URL(baseUrl).hostname,
};

export const NAV = [
  { href: ROUTES.HOME, label: "home" },
  { href: ROUTES.ABOUT, label: "about" },
  { href: ROUTES.CONTACT, label: "contact" },
  { href: ROUTES.PRESS, label: "press" },
];
