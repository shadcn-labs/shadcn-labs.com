import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const FAMILIES = [
  { className: "font-sans", label: "Sans", value: "sans" },
  { className: "font-serif", label: "Serif", value: "serif" },
  { className: "font-mono", label: "Mono", value: "mono" },
] as const;

const triggerClassName =
  "rounded-lg px-3.5 py-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-white data-active:text-foreground data-active:shadow-sm dark:data-active:bg-[#322f22]";

export const FontFamilyTabs = () => (
  <Tabs
    defaultValue="sans"
    onValueChange={(value) => {
      document.dispatchEvent(
        new CustomEvent("font-pill-change", { detail: { family: value } })
      );
    }}
  >
    <TabsList
      aria-label="Font families"
      className="bg-muted/60 text-muted-foreground relative z-20 inline-flex items-center gap-0 rounded-xl p-1 text-sm font-medium shadow-inner backdrop-blur-sm select-none"
    >
      {FAMILIES.map((family) => (
        <TabsTrigger
          key={family.value}
          value={family.value}
          className={cn(triggerClassName, family.className)}
        >
          {family.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
