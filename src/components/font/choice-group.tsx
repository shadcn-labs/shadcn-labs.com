import type { ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface Choice<T extends string> {
  label: ReactNode;
  value: T;
}

export const SEGMENT_ITEM =
  "text-muted-foreground hover:text-foreground aria-pressed:text-foreground aria-pressed:bg-white aria-pressed:shadow-sm hover:aria-pressed:bg-white dark:aria-pressed:bg-[#322f22] dark:hover:aria-pressed:bg-[#322f22] h-8 min-w-8 rounded-lg! px-3.5 text-sm font-medium hover:bg-transparent [&_svg:not([class*='size-'])]:size-4";

export const ChoiceGroup = <T extends string>({
  className,
  label,
  onChange,
  options,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: T) => void;
  options: readonly Choice<T>[];
  value: T;
}) => (
  <ToggleGroup
    aria-label={label}
    className={cn("bg-muted/60 gap-0 rounded-xl p-1 shadow-inner", className)}
    spacing={0}
    value={[value]}
    onValueChange={(next) => {
      const [picked] = next as T[];

      if (picked !== undefined) {
        onChange(picked);
      }
    }}
  >
    {options.map((option) => (
      <ToggleGroupItem
        key={option.value}
        value={option.value}
        className={SEGMENT_ITEM}
      >
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);
