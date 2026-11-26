import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Testimonial = ({
  className,
  ...props
}: ComponentProps<"figure">) => (
  <figure className={cn("flex h-full flex-col", className)} {...props} />
);

export const TestimonialQuote = ({
  className,
  ...props
}: ComponentProps<"blockquote">) => (
  <blockquote
    className={cn(
      "text-foreground grow px-5 py-4 text-base text-pretty",
      className
    )}
    {...props}
  />
);

export const TestimonialAuthor = ({
  className,
  ...props
}: ComponentProps<"figcaption">) => (
  <figcaption
    className={cn(
      "grid grid-cols-[auto_1fr] grid-rows-2 items-center gap-x-3.5 px-5 pt-1 pb-4",
      className
    )}
    {...props}
  />
);

export const TestimonialAuthorName = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    className={cn(
      "text-foreground flex items-center gap-1.5 text-sm font-medium",
      className
    )}
    {...props}
  />
);

export const TestimonialAuthorTagline = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div className={cn("text-muted-foreground text-xs", className)} {...props} />
);
