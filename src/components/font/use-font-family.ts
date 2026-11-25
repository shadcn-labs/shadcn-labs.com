import { useEffect, useState } from "react";

import type { FontFamily } from "@/data/goeist-font";

export const FONT_FAMILY_EVENT = "font-pill-change";

export const isFontFamily = (value: unknown): value is FontFamily =>
  value === "sans" || value === "mono" || value === "serif";

export const setFontFamily = (family: FontFamily) => {
  document.documentElement.dataset.fontFamily = family;
  document.dispatchEvent(
    new CustomEvent(FONT_FAMILY_EVENT, { detail: { family } })
  );
};

export const useFontFamily = () => {
  const [family, setFamily] = useState<FontFamily>("sans");

  useEffect(() => {
    const current = document.documentElement.dataset.fontFamily;

    if (isFontFamily(current)) {
      setFamily(current);
    }

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
