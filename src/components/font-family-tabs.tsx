import { useEffect, useState } from "react";

import {
  getFontFamilyFromUrl,
  isFontFamily,
  setFontFamily,
  setFontFamilyInUrl,
} from "@/components/font/use-font-family";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FontFamily } from "@/data/goeist-font";
import { cn } from "@/lib/utils";

const FAMILIES = [
  { className: "font-sans", label: "Sans", value: "sans" },
  { className: "font-serif", label: "Serif", value: "serif" },
  { className: "font-mono", label: "Mono", value: "mono" },
] as const;

const triggerClassName =
  "rounded-lg px-3.5 py-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-white data-active:text-foreground data-active:shadow-sm dark:data-active:bg-[#322f22]";

export const FontFamilyTabs = () => {
  const [family, setFamily] = useState<FontFamily>("sans");

  useEffect(() => {
    // Read the URL on the client only — never during the server render — so the
    // pre-rendered HTML always matches the first client render (no hydration
    // mismatch).
    setFamily(getFontFamilyFromUrl());

    const onPopState = () => {
      const next = getFontFamilyFromUrl();
      setFamily(next);
      setFontFamily(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <Tabs
      value={family}
      onValueChange={(value) => {
        if (!isFontFamily(value)) {
          return;
        }

        setFamily(value);
        setFontFamilyInUrl(value);
        setFontFamily(value);
      }}
    >
      <TabsList
        aria-label="Font families"
        className="bg-muted/60 text-muted-foreground relative z-20 inline-flex items-center gap-0 rounded-xl p-1 text-sm font-medium shadow-inner backdrop-blur-sm select-none"
      >
        {FAMILIES.map((familyItem) => (
          <TabsTrigger
            key={familyItem.value}
            value={familyItem.value}
            className={cn(triggerClassName, familyItem.className)}
          >
            {familyItem.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
