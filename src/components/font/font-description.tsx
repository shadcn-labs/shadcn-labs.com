import type { ReactNode } from "react";

import type { FontFamily } from "@/data/goeist-font";
import { cn } from "@/lib/utils";

import { FAMILY_FACE } from "./faces";
import { useFontFamily } from "./use-font-family";

const Em = ({ children }: { children: ReactNode }) => (
  <strong className="text-foreground font-medium">{children}</strong>
);

const DESCRIPTIONS: Record<
  FontFamily,
  { lead: string; paragraphs: ReactNode[] }
> = {
  mono: {
    lead: "Goeist Mono is drawn as if with one round tool.",
    paragraphs: [
      <>
        Every corner is rounded, so <Em>stroke ends, slabs and dots</Em> become
        semicircles while every width stays fixed. Columns line up exactly as
        they do in Geist Mono.
      </>,
      <>
        Made for <Em>code editors, terminals</Em> and tabular data, it keeps
        Geist Mono&rsquo;s <Em>coding ligatures</Em> and the slashed zero that
        tells 0 from O.
      </>,
    ],
  },
  sans: {
    lead: "Goeist Sans is Geist with the corners taken off.",
    paragraphs: [
      <>
        It keeps Geist&rsquo;s{" "}
        <Em>proportions, spacing and OpenType features</Em>, and softens every
        exposed corner and stroke ending. It reads with the same clarity at
        interface sizes and turns friendly when set large.
      </>,
      <>
        Made for <Em>interfaces, body copy and display sizes</Em> where Geist
        should feel a little warmer: dashboards, docs and pages that want
        precision without the sharp edges.
      </>,
    ],
  },
  serif: {
    lead: "Goeist Serif is the editorial partner, softened.",
    paragraphs: [
      <>
        Its <Em>saw-toothed serifs end in half-rounds</Em> and its cut terminals
        in circular arcs, while hairlines and contrast stay fine.
      </>,
      <>
        Made for <Em>headlines, posters</Em> and other display sizes, it keeps
        Geist Serif&rsquo;s Element Shape axis for{" "}
        <Em>round, square, triangle or heart</Em> dots.
      </>,
    ],
  },
};

export const FontDescription = () => {
  const family = useFontFamily();
  const { lead, paragraphs } = DESCRIPTIONS[family];

  return (
    <div className="space-y-4">
      <p
        className={cn(
          "text-3xl leading-tight tracking-[-0.03em] sm:text-4xl",
          FAMILY_FACE[family]
        )}
      >
        {lead}
      </p>
      <div className="text-muted-foreground grid gap-4 sm:grid-cols-2">
        {paragraphs.map((paragraph, index) => (
          <p key={`${family}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};
