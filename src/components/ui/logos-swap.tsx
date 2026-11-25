import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import type { Transition, Variants } from "motion/react";
import { Children, useEffect, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_COLUMN_COUNT = 6;
const SWAP_INTERVAL = 1500;
const GOLDEN_RATIO = 1.618;
const EASE_IN_OUT_EXPO = [0.87, 0, 0.13, 1] as const;
const TRANSITION: Transition = { duration: 0.9, ease: EASE_IN_OUT_EXPO };

const LOGO_VARIANTS: Variants = {
  animate: {
    opacity: 1,
    transform: "translateY(0%)",
    transition: { ...TRANSITION, delay: 0.1 },
  },
  exit: { opacity: 0, transform: "translateY(-50%)", transition: TRANSITION },
  initial: { opacity: 0, transform: "translateY(50%)" },
};

/** Golden-ratio steps scatter the slots like a shuffle the server can match. */
const getRank = (slot: number) => (slot * GOLDEN_RATIO) % 1;

const getSwapOrder = (slotCount: number) =>
  Array.from({ length: slotCount }, (_, slot) => slot).toSorted(
    (a, b) => getRank(a) - getRank(b)
  );

export type LogosSwapProps = Omit<ComponentProps<"div">, "ref"> & {
  /** Logo elements to cycle through. Each child is rendered as a single logo. */
  children: ReactNode;
  /**
   * Number of logos shown at once (the swapping slots). Set `--column-count` to
   * wrap them onto fewer visual columns. Must be less than the logo count for
   * swapping to occur.
   * @default 6
   */
  columnCount?: number;
};

export const LogosSwap = ({
  children,
  columnCount = DEFAULT_COLUMN_COUNT,
  className,
  style,
  ...props
}: LogosSwapProps) => {
  const logos = Children.toArray(children);
  const logoCount = logos.length;
  const slotCount = Math.min(columnCount, logoCount);

  const swapOrder = getSwapOrder(slotCount);
  // Queued in swap order so slots start in `children` order; each slot takes
  // the next logo on its turn, ruling out on-screen duplicates.
  const queue = [
    ...swapOrder.map((slot) => logos[slot]),
    ...logos.slice(slotCount),
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "100px" });
  const shouldReduceMotion = useReducedMotion();

  const shouldPlay = isInView && logoCount > slotCount && !shouldReduceMotion;

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!shouldPlay) {
      return;
    }

    const intervalId = window.setInterval(
      () => setStep((previous) => previous + 1),
      SWAP_INTERVAL
    );

    return () => window.clearInterval(intervalId);
  }, [shouldPlay]);

  if (logoCount === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-slot="logos-swap"
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(var(--column-count, ${slotCount}), minmax(0, 1fr))`,
        ...style,
      }}
      {...props}
    >
      {Array.from({ length: slotCount }, (_, slot) => {
        const turn = swapOrder.indexOf(slot);
        const swapCount = Math.ceil((step - turn) / slotCount);
        const queueIndex = (turn + swapCount * slotCount) % logoCount;

        return (
          <div
            key={slot}
            data-slot="logos-swap-slot"
            className="-my-3 grid h-20 min-w-0 grid-cols-1 grid-rows-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] py-3"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={queueIndex}
                data-slot="logos-swap-logo"
                className="col-start-1 row-start-1 flex min-h-0 min-w-0 items-center justify-center"
                variants={LOGO_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {queue[queueIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
