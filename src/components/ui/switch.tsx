import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

const Switch = ({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-foreground/15 dark:data-unchecked:bg-foreground/25 relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent p-px transition-colors outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 aria-invalid:ring-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className="pointer-events-none block rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] ring-0 transition-transform duration-200 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 data-unchecked:translate-x-0"
    />
  </SwitchPrimitive.Root>
);

export { Switch };
