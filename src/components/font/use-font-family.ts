import { useEffect, useState } from "react";

import type { FontFamily } from "@/data/goeist-font";

export const FONT_FAMILY_EVENT = "font-pill-change";

/** Query parameter that selects the active font family (e.g. `?type=serif`). */
export const FONT_FAMILY_PARAM = "type";

export const isFontFamily = (value: unknown): value is FontFamily =>
  value === "sans" || value === "mono" || value === "serif";

export const setFontFamily = (family: FontFamily) => {
  document.documentElement.dataset.fontFamily = family;
  document.dispatchEvent(
    new CustomEvent(FONT_FAMILY_EVENT, { detail: { family } })
  );
};

/**
 * Reads the active family from `?type=` in the URL, falling back to `sans`.
 *
 * Client-only: touches `window`, so only call it from `useEffect`, event
 * handlers, or `<script>` tags — never during the server render — to avoid
 * hydration mismatches.
 */
export const getFontFamilyFromUrl = (): FontFamily => {
  const value = new URLSearchParams(window.location.search).get(
    FONT_FAMILY_PARAM
  );

  return isFontFamily(value) ? value : "sans";
};

/** Updates the `?type=` query parameter in place without reloading the page. */
export const setFontFamilyInUrl = (family: FontFamily) => {
  const url = new URL(window.location.href);
  url.searchParams.set(FONT_FAMILY_PARAM, family);
  window.history.pushState({}, "", url);
};

export const useFontFamily = () => {
  const [family, setFamily] = useState<FontFamily>("sans");

  useEffect(() => {
    // Runs client-side only. Prefer the URL so a deep link like
    // /font?type=serif hydrates correctly, then fall back to any dataset value.
    const fromUrl = new URLSearchParams(window.location.search).get(
      FONT_FAMILY_PARAM
    );
    const current = document.documentElement.dataset.fontFamily;

    let initial: FontFamily = "sans";
    if (isFontFamily(fromUrl)) {
      initial = fromUrl;
    } else if (isFontFamily(current)) {
      initial = current;
    }

    setFamily(initial);

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ family?: string }>).detail?.family;

      if (isFontFamily(next)) {
        setFamily(next);
      }
    };

    document.addEventListener(FONT_FAMILY_EVENT, onChange);
    return () => document.removeEventListener(FONT_FAMILY_EVENT, onChange);
  }, []);

  return family;
};
