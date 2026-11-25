import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CommandIcon,
  CornerDownLeftIcon,
  HeartIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TriangleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const ARTBOARD = 320;

interface Example {
  id: string;
  background: string;
  bordered?: "light" | "dark";
  title: string;
  note: string;
  render: () => ReactNode;
}

const Artboard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex size-full flex-col overflow-hidden p-6", className)}>
    {children}
  </div>
);

const TerminalPrompt = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p className={cn("flex items-center gap-1.5", className)}>
    <span className="flex items-center text-[#f06292]">
      ~/app <ChevronRightIcon className="size-3" />
    </span>
    {children}
  </p>
);

const DOT_SHAPES = [
  { label: "Round", value: 0 },
  { label: "Square", value: 25 },
  { label: "Triangle", value: 50 },
  { label: "Heart", value: 100 },
];

const BookCover = () => {
  const [index, setIndex] = useState(3);
  const shape = DOT_SHAPES[index];

  return (
    <button
      type="button"
      aria-label={`Dot shape: ${shape.label}. Click for the next shape.`}
      onClick={() => setIndex((current) => (current + 1) % DOT_SHAPES.length)}
      className="flex size-full cursor-pointer flex-col justify-between p-6 text-left text-white"
      style={{ fontVariationSettings: `"ELSH" ${shape.value}` }}
    >
      <span className="flex w-full justify-between font-sans text-[10px] font-medium tracking-[0.3em] uppercase">
        <span>A novel</span>
        <span className="tracking-[0.15em] opacity-80">{shape.label} dots</span>
      </span>
      <span className="font-serif text-6xl leading-[0.9] tracking-[-0.03em]">
        The soft corner. Fin. i!
      </span>
      <span className="flex w-full items-end justify-between font-sans text-[10px] tracking-[0.2em] uppercase">
        <span>Aniket Pawar</span>
        <span className="opacity-80">tap to change</span>
      </span>
    </button>
  );
};

const TRACKS = [
  { artist: "Goeist Quartet", length: 238, title: "Rounded Edges" },
  { artist: "The Terminals", length: 201, title: "Soft Corners" },
  { artist: "Serif & Sons", length: 264, title: "Heart Dots" },
];

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

const Player = () => {
  const [track, setTrack] = useState(0);
  const [elapsed, setElapsed] = useState(84);
  const [playing, setPlaying] = useState(false);
  const { artist, length, title } = TRACKS[track];

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((current) => (current + 1) % length);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [playing, length]);

  const skip = (step: number) => {
    setTrack((current) => (current + step + TRACKS.length) % TRACKS.length);
    setElapsed(0);
  };

  return (
    <Artboard className="justify-center">
      <div className="rounded-2xl bg-[#1c1a12] p-4 text-[#f5f4ef]">
        <div className="flex items-center gap-3">
          <div className="size-14 shrink-0 rounded-xl bg-[radial-gradient(circle_at_30%_30%,#f78db3,#ec407a_60%,#1c1a12)]" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-[-0.02em]">
              {title}
            </p>
            <p className="text-xs text-[#a8a291]">{artist}</p>
          </div>
        </div>
        <div className="mt-4 h-1 rounded-full bg-[#f5f4ef]/15">
          <div
            className="h-full rounded-full bg-[#f06292] transition-[width] duration-1000 ease-linear"
            style={{ width: `${(elapsed / length) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-[#a8a291] tabular-nums">
          <span>{clock(elapsed)}</span>
          <span>−{clock(length - elapsed)}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label="Previous track"
            className="cursor-pointer"
            onClick={() => skip(-1)}
          >
            <SkipBackIcon className="size-5 fill-current" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#f5f4ef] text-[#1c1a12]"
            onClick={() => setPlaying((current) => !current)}
          >
            {playing ? (
              <PauseIcon className="size-4 fill-current" />
            ) : (
              <PlayIcon className="ml-0.5 size-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next track"
            className="cursor-pointer"
            onClick={() => skip(1)}
          >
            <SkipForwardIcon className="size-5 fill-current" />
          </button>
        </div>
      </div>
    </Artboard>
  );
};

const INGREDIENTS = [
  { item: "cups flour", quarters: 6 },
  { item: "cup milk", quarters: 3 },
  { item: "tsp salt", quarters: 1 },
  { item: "eggs, whisked", quarters: 8 },
];

const FRACTIONS = ["", "1/4", "1/2", "3/4"];

const mixed = (quarters: number) => {
  const whole = Math.floor(quarters / 4);

  return {
    part: FRACTIONS[quarters % 4],
    whole: whole > 0 ? String(whole) : "",
  };
};

const Recipe = () => {
  const [servings, setServings] = useState(4);

  return (
    <Artboard className="justify-center text-[#1c1a12]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-[0.2em] text-[#6b6455] uppercase">
          Serves {servings} · 20 min
        </p>
        <div className="flex items-center gap-1">
          {[-2, 2].map((step) => (
            <button
              key={step}
              type="button"
              aria-label={step < 0 ? "Fewer servings" : "More servings"}
              disabled={servings + step < 2 || servings + step > 12}
              onClick={() => setServings((current) => current + step)}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#1c1a12] text-[#f5f4ef] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {step < 0 ? (
                <MinusIcon className="size-3.5" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-3xl leading-none font-bold tracking-[-0.04em]">
        Soft pancakes
      </p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {INGREDIENTS.map(({ item, quarters }) => {
          const { part, whole } = mixed((quarters * servings) / 4);

          return (
            <li
              key={item}
              className="flex gap-3 border-b border-[#1c1a12]/10 pb-1.5"
            >
              <span className="flex w-12 gap-1 font-semibold tabular-nums">
                {whole && <span>{whole}</span>}
                {part && (
                  <span style={{ fontFeatureSettings: '"frac" 1' }}>
                    {part}
                  </span>
                )}
              </span>
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </Artboard>
  );
};

const FONTS = [
  { face: "font-sans", label: "Goeist Sans", meta: "9 weights · italics" },
  { face: "font-mono", label: "Goeist Mono", meta: "9 weights · ligatures" },
  { face: "font-serif", label: "Goeist Serif", meta: "4 dot shapes" },
];

const CommandMenu = () => {
  const [active, setActive] = useState(0);
  const font = FONTS[active];

  return (
    <Artboard>
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white text-[12px] text-[#1c1a12] shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
        <div className="flex items-center gap-2 border-b border-[#eee] px-3 py-2.5 text-[#8a8577]">
          <SearchIcon className="size-3.5" />
          <span className="flex-1">Search fonts…</span>
          <Kbd className="bg-[#f2f1ec] text-[#8a8577]">
            <CommandIcon />K
          </Kbd>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div
            role="listbox"
            aria-label="Fonts"
            tabIndex={0}
            aria-activedescendant={`font-option-${active}`}
            className="border-r border-[#eee] p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#f06292] focus-visible:ring-inset"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setActive(
                  (current) => (current + step + FONTS.length) % FONTS.length
                );
              }
            }}
          >
            <p className="px-2 pt-1.5 pb-1 text-[10px] font-medium text-[#8a8577]">
              Families
            </p>
            {FONTS.map((item, index) => (
              <div
                key={item.label}
                id={`font-option-${index}`}
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                onClick={() => setActive(index)}
                onKeyDown={() => setActive(index)}
                onPointerEnter={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5",
                  index === active && "bg-[#fbd5e2]"
                )}
              >
                <span className={item.face}>{item.label}</span>
                <CornerDownLeftIcon className="size-3 text-[#8a8577]" />
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-col justify-between p-3">
            <p
              className={cn(
                "text-5xl leading-none tracking-[-0.03em]",
                font.face
              )}
            >
              Aa
            </p>
            <div>
              <p className={cn("text-sm font-medium", font.face)}>
                {font.label}
              </p>
              <p className="text-[10px] text-[#8a8577]">{font.meta}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[#eee] px-3 py-2 text-[10px] text-[#8a8577]">
          <span className="flex items-center gap-1">
            <Kbd className="bg-[#f2f1ec] text-[#8a8577]">
              <ArrowUpIcon />
            </Kbd>
            <Kbd className="bg-[#f2f1ec] text-[#8a8577]">
              <ArrowDownIcon />
            </Kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd className="bg-[#f2f1ec] text-[#8a8577]">
              <CornerDownLeftIcon />
            </Kbd>
            select
          </span>
        </div>
      </div>
    </Artboard>
  );
};

type DiffKind = "changed" | "context";

const DIFF: [number, string, number, string, DiffKind][] = [
  [10, ":root {", 10, ":root {", "context"],
  [11, "  --ink: #1c1a12;", 11, "  --ink: #1c1a12;", "context"],
  [12, "  --radius: 0px;", 12, "  --radius: 0.625rem;", "changed"],
  [13, '  --font: "Geist";', 13, '  --font: "Goeist";', "changed"],
  [14, '  --mono: "Geist Mono";', 14, '  --mono: "Goeist Mono";', "changed"],
  [15, "  --primary: #f06292;", 15, "  --primary: #f06292;", "context"],
  [16, "  --muted: #ebeae4;", 16, "  --muted: #ebeae4;", "context"],
  [17, "}", 17, "}", "context"],
];

const DiffSide = ({
  code,
  kind,
  line,
  side,
}: {
  code: string;
  kind: DiffKind;
  line: number;
  side: "old" | "new";
}) => {
  const changed = kind !== "context";

  return (
    <p
      className={cn(
        "flex min-w-0",
        changed && side === "old" && "bg-[#fee2e2]",
        changed && side === "new" && "bg-[#dcfce7]"
      )}
    >
      <span className="w-8 shrink-0 pr-2 text-right text-[#a8a291] tabular-nums">
        {line}
      </span>
      <span className="w-4 shrink-0 text-[#8a8577]">
        {changed && (side === "old" ? "-" : "+")}
      </span>
      <span className="truncate whitespace-pre">{code}</span>
    </p>
  );
};

const EXAMPLES: Example[] = [
  {
    background: "#F7B9CF",
    id: "receipt",
    note: "Goeist Mono · tabular figures",
    render: () => (
      <Artboard className="items-center justify-center">
        <div className="w-56 bg-[#fffdf8] px-4 py-4 font-mono text-[10px] leading-relaxed text-[#1c1a12] shadow-[0_10px_30px_rgb(0_0_0/0.12)]">
          <p className="text-center text-xs font-semibold tracking-widest">
            CORNER CAFÉ
          </p>
          <p className="text-center text-[#8a8577]">25 NOV 2026 · 21:04</p>
          <div className="my-2 border-t border-dashed border-[#d9d4c3]" />
          {[
            ["Flat white 2×", "9.00"],
            ["Croissant", "3.80"],
            ["Oat milk", "0.60"],
            ["Tip 10%", "1.34"],
          ].map(([item, price]) => (
            <p key={item} className="flex justify-between tabular-nums">
              <span>{item}</span>
              <span>{price}</span>
            </p>
          ))}
          <div className="my-2 border-t border-dashed border-[#d9d4c3]" />
          <p className="flex justify-between text-xs font-semibold tabular-nums">
            <span>TOTAL</span>
            <span>€14.74</span>
          </p>
          <p className="mt-2 flex items-center justify-center gap-1 text-[#8a8577]">
            thank you <HeartIcon className="size-2.5 fill-current" />
          </p>
        </div>
      </Artboard>
    ),
    title: "Receipt",
  },
  {
    background: "#1C1A12",
    bordered: "dark",
    id: "terminal",
    note: "Goeist Mono · terminal",
    render: () => (
      <Artboard className="p-0 font-mono text-[11px] leading-[1.5] text-[#f5f4ef]">
        <div className="relative flex h-8 shrink-0 items-center gap-2 border-b border-black/50 bg-[#2a2820] px-3">
          <span className="size-3 rounded-full bg-[#ff5f57] ring-1 ring-black/20 ring-inset" />
          <span className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/20 ring-inset" />
          <span className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/20 ring-inset" />
          <span className="pointer-events-none absolute inset-x-0 text-center font-sans text-[11px] font-medium text-[#a8a291]">
            app — zsh — 80×24
          </span>
        </div>
        <div
          className="px-4 py-3"
          style={{
            fontFeatureSettings: '"liga" 0, "calt" 0',
            fontVariantLigatures: "none",
          }}
        >
          <TerminalPrompt>pnpm add goeist</TerminalPrompt>
          <p className="text-[#a8a291]">Packages: +1</p>
          <p className="text-[#a8a291]">
            Progress: resolved 412, reused 411, downloaded 1, added 1, done
          </p>
          <p>
            <span className="text-[#86efac]">+</span> goeist{" "}
            <span className="text-[#a8a291]">0.1.0</span>
          </p>
          <p className="text-[#a8a291]">Done in 1.2s</p>

          <TerminalPrompt className="pt-1.5">cat lib/soft.ts</TerminalPrompt>
          <p>
            <span className="text-[#f06292]">export const</span> soft = (r:{" "}
            <span className="text-[#f7b9cf]">number</span>) =&gt;
          </p>
          <p className="pl-4">r &gt;= 8 &amp;&amp; r !== 0;</p>
          <p>
            <span className="text-[#f06292]">export const</span> round = (n:{" "}
            <span className="text-[#f7b9cf]">number</span>) =&gt;
          </p>
          <p className="pl-4">Math.round(n * 2) / 2;</p>

          <TerminalPrompt className="pt-1.5">pnpm dev</TerminalPrompt>
          <p className="flex items-center gap-1.5">
            <TriangleIcon className="size-2.5 fill-current" />
            Next.js 16.0.3 <span className="text-[#a8a291]">(Turbopack)</span>
          </p>
          <p className="text-[#a8a291]">- Local: http://localhost:3000</p>
          <p className="flex items-center gap-1.5 text-[#86efac]">
            <CheckIcon className="size-3" />
            <span className="text-[#f5f4ef]">Ready in 412ms</span>
          </p>
          <TerminalPrompt>
            <span className="h-3.5 w-1.5 animate-pulse bg-[#f5f4ef]" />
          </TerminalPrompt>
        </div>
      </Artboard>
    ),
    title: "Terminal",
  },
  {
    background: "#F06292",
    id: "book",
    note: "Goeist Serif · dot shapes (ELSH)",
    render: () => <BookCover />,
    title: "Book cover",
  },
  {
    background: "#E6E3D7",
    id: "player",
    note: "Goeist Sans · weights 400–700",
    render: () => <Player />,
    title: "Now playing",
  },
  {
    background: "#FBD5E2",
    id: "chat",
    note: "Goeist Sans · interface sizes",
    render: () => (
      <Artboard className="justify-end gap-2 text-[13px] leading-snug">
        <p className="max-w-[75%] self-start rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[#1c1a12]">
          did you ship the font?
        </p>
        <p className="max-w-[75%] self-end rounded-2xl rounded-br-md bg-[#f06292] px-3 py-2 text-white">
          yep, rounded every corner
        </p>
        <p className="max-w-[75%] self-start rounded-2xl rounded-bl-md bg-white px-3 py-2 text-[#1c1a12]">
          even the dots on the i?
        </p>
        <p className="max-w-[75%] self-end rounded-2xl rounded-br-md bg-[#f06292] px-3 py-2 text-white">
          especially the dots.
        </p>
        <p className="self-end text-[10px] text-[#9d5a74]">Read 21:06</p>
      </Artboard>
    ),
    title: "Chat",
  },
  {
    background: "#FFFFFF",
    bordered: "light",
    id: "diff",
    note: "Goeist Mono · code review",
    render: () => (
      <Artboard className="p-0">
        <div className="flex size-full flex-col font-mono text-[11px] leading-6 text-[#1c1a12]">
          <p className="flex items-center justify-between border-b border-[#e5e5e5] bg-[#ebeae4] px-4 py-2 text-[#6b6455]">
            src/styles/tokens.css
            <span className="font-sans text-[10px]">
              <span className="text-[#16a34a]">+3</span>{" "}
              <span className="text-[#dc2626]">−3</span>
            </span>
          </p>
          <p className="bg-[#f5f4ef] px-4 text-[#8a8577]">@@ -10,8 +10,8 @@</p>
          <div className="grid grid-cols-2 divide-x divide-[#e5e5e5]">
            {(["old", "new"] as const).map((side) => (
              <div key={side}>
                {DIFF.map(([oldLine, oldCode, newLine, newCode, kind]) => (
                  <DiffSide
                    key={`${side}-${oldLine}`}
                    code={side === "old" ? oldCode : newCode}
                    kind={kind}
                    line={side === "old" ? oldLine : newLine}
                    side={side}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="mt-auto flex items-center gap-1.5 border-t border-[#e5e5e5] px-4 py-2 font-sans text-xs">
            <CircleCheckIcon className="size-3.5 text-[#16a34a]" />
            <span className="font-semibold">aniket</span> approved these changes
          </p>
        </div>
      </Artboard>
    ),
    title: "Code review",
  },
  {
    background: "#D9D4C3",
    id: "recipe",
    note: "Goeist Sans · fractions (frac)",
    render: () => <Recipe />,
    title: "Recipe card",
  },
  {
    background: "#1C1A12",
    bordered: "dark",
    id: "card",
    note: "Serif, Sans and Mono together",
    render: () => (
      <Artboard className="items-center justify-center">
        <div className="flex h-36 w-60 flex-col justify-between rounded-xl bg-[#f5f4ef] p-4 text-[#1c1a12] shadow-[0_12px_30px_rgb(0_0_0/0.4)]">
          <div>
            <p className="font-serif text-2xl leading-none tracking-[-0.02em]">
              Aniket Pawar
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-[0.15em] text-[#f06292] uppercase">
              Type &amp; interfaces
            </p>
          </div>
          <div className="font-mono text-[9px] leading-relaxed text-[#6b6455]">
            <p>hello@shadcn-labs.com</p>
            <p>shadcn-labs.com/font</p>
          </div>
        </div>
      </Artboard>
    ),
    title: "Business card",
  },
  {
    background: "#EC407A",
    id: "signage",
    note: "Goeist Sans Bold · wayfinding",
    render: () => (
      <Artboard className="justify-center gap-2 text-white">
        {[
          { Icon: ArrowRightIcon, label: "Gates B10–B24" },
          { Icon: ArrowDownIcon, label: "Baggage claim" },
          { Icon: ArrowUpRightIcon, label: "Exit" },
        ].map(({ Icon, label }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg bg-[#1c1a12] px-4 py-3 text-xl font-bold tracking-[-0.02em]"
          >
            <span>{label}</span>
            <Icon className="size-6 text-[#f7b9cf]" strokeWidth={2.5} />
          </div>
        ))}
      </Artboard>
    ),
    title: "Wayfinding",
  },
  {
    background: "#F5E1E8",
    id: "cyrillic",
    note: "Goeist Sans · Cyrillic",
    render: () => (
      <Artboard className="justify-between text-[#1c1a12]">
        <p className="text-[10px] font-medium tracking-[0.3em] text-[#c2185b] uppercase">
          Кириллица
        </p>
        <p className="text-6xl leading-[0.85] font-black tracking-[-0.05em]">
          Мягкие углы.
        </p>
        <p className="text-xs text-[#6b6455]">
          Съешь же ещё этих мягких французских булок.
        </p>
      </Artboard>
    ),
    title: "Poster",
  },
  {
    background: "#F7B9CF",
    id: "palette",
    note: "Goeist Sans · command menu",
    render: () => <CommandMenu />,
    title: "Command menu",
  },
];

const BENTO: { id: string; span: string }[] = [
  { id: "book", span: "col-span-2 row-span-2" },
  { id: "terminal", span: "col-span-2" },
  { id: "receipt", span: "" },
  { id: "chat", span: "" },
  { id: "diff", span: "col-span-2" },
  { id: "palette", span: "col-span-2" },
  { id: "cyrillic", span: "row-span-2" },
  { id: "recipe", span: "row-span-2" },
  { id: "signage", span: "row-span-2" },
  { id: "player", span: "" },
  { id: "card", span: "" },
];

const useArtboardFit = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ height: 0, scale: 0, width: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      const scale = Math.min(width, height) / ARTBOARD;

      if (scale > 0) {
        setFit({ height: height / scale, scale, width: width / scale });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, fit] as const;
};

const ExampleTile = ({
  className,
  example,
}: {
  className: string;
  example: Example;
}) => {
  const [ref, { height, scale, width }] = useArtboardFit();

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        example.bordered === "light" && "border-border border",
        example.bordered === "dark" && "dark:border-border dark:border",
        className
      )}
      style={{ background: example.background }}
    >
      <div
        role="group"
        aria-label={`${example.title} example, ${example.note}`}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          height,
          transform: `scale(${scale})`,
          visibility: scale > 0 ? "visible" : "hidden",
          width,
        }}
      >
        {example.render()}
      </div>
    </div>
  );
};

export const FontExamples = () => (
  <div className="grid grid-flow-dense auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] lg:auto-rows-[17rem] lg:grid-cols-4">
    {BENTO.map(({ id, span }) => {
      const example = EXAMPLES.find((item) => item.id === id);

      return (
        example && <ExampleTile key={id} className={span} example={example} />
      );
    })}
  </div>
);
