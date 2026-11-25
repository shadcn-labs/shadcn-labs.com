import type { ComponentType, HTMLAttributes } from "react";
import type { MarqueeProps as FastMarqueeProps } from "react-fast-marquee";
import FastMarqueeImport from "react-fast-marquee";

import { cn } from "@/lib/utils";

// react-fast-marquee ships CJS; under Astro's SSR interop the default import
// can surface as the module namespace `{ default }` instead of the component.
const FastMarquee =
  (
    FastMarqueeImport as unknown as {
      default?: ComponentType<FastMarqueeProps>;
    }
  ).default ?? (FastMarqueeImport as ComponentType<FastMarqueeProps>);

export type MarqueeProps = HTMLAttributes<HTMLDivElement>;

export const Marquee = ({ className, ...props }: MarqueeProps) => (
  <div
    className={cn("relative w-full overflow-hidden", className)}
    {...props}
  />
);

export type MarqueeContentProps = FastMarqueeProps;

export const MarqueeContent = ({
  loop = 0,
  autoFill = true,
  pauseOnHover = true,
  ...props
}: MarqueeContentProps) => (
  <FastMarquee
    autoFill={autoFill}
    loop={loop}
    pauseOnHover={pauseOnHover}
    {...props}
  />
);

export type MarqueeItemProps = HTMLAttributes<HTMLDivElement>;

export const MarqueeItem = ({ className, ...props }: MarqueeItemProps) => (
  <div className={cn("shrink-0", className)} {...props} />
);
