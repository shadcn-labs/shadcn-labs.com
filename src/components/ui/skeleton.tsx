import { cn } from "cn";

const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn(
      "bg-muted animate-pulse rounded-md motion-reduce:animate-none",
      className
    )}
    {...props}
  />
);

export { Skeleton };
