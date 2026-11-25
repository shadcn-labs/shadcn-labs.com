import { NumberField } from "@base-ui/react/number-field";
import {
  Columns2Icon,
  LayersIcon,
  MoveHorizontalIcon,
  SplineIcon,
  SquareIcon,
  TypeIcon,
} from "lucide-react";
import type { Font, PathCommand } from "opentype.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { FAMILY_NAMES, STATIC_WEIGHTS, glyphSources } from "@/data/goeist-font";
import type { StaticWeight } from "@/data/goeist-font";
import { cn } from "@/lib/utils";

import { FAMILY_FACE } from "./faces";
import { useFontFamily } from "./use-font-family";

type CompareMode = "single" | "side" | "overlay";
type ViewMode = "solid" | "anchors";
type Point = readonly [number, number];

interface Outline {
  advance: number;
  d: string;
  handles: (readonly [number, number, number, number])[];
  name: string;
  off: Point[];
  on: Point[];
}

interface Metrics {
  ascender: number;
  baseline: number;
  capHeight: number;
  descender: number;
  pDescender: number;
  xHeight: number;
}

interface LoadedFonts {
  geist: Font;
  goeist: Font;
}

const GOEIST_COLOR = "var(--primary)";
const GEIST_COLOR = "oklch(0.62 0.14 245)";
const PADDING = 140;
const HEADROOM = 80;
const DEFAULT_CHAR = "R";

const fontCache = new Map<string, Promise<Font>>();

const loadFont = (url: string) => {
  const cached = fontCache.get(url);

  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const [{ parse }, response] = await Promise.all([
      import("opentype.js"),
      fetch(url),
    ]);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }

    return parse(await response.arrayBuffer());
  })();

  promise.catch(() => fontCache.delete(url));
  fontCache.set(url, promise);
  return promise;
};

const isVisibleCodepoint = (cp: number) =>
  cp > 0x20 &&
  !(cp >= 0x7f && cp <= 0xa0) &&
  cp !== 0xad &&
  !(cp >= 0x3_00 && cp <= 0x3_6f) &&
  !(cp >= 0x20_00 && cp <= 0x20_0f) &&
  !(cp >= 0x20_28 && cp <= 0x20_2f) &&
  !(cp >= 0x20_5f && cp <= 0x20_6f) &&
  !(cp >= 0xe0_00 && cp <= 0xf8_ff) &&
  cp !== 0xfe_ff;

const characterSet = (font: Font) => {
  const cmap = font.tables.cmap as unknown as {
    glyphIndexMap: Record<string, number>;
  };

  return Object.keys(cmap.glyphIndexMap)
    .map(Number)
    .filter(isVisibleCodepoint)
    .toSorted((a, b) => a - b)
    .map((cp) => String.fromCodePoint(cp));
};

const readMetrics = (font: Font): Metrics => {
  const os2 = font.tables.os2 as unknown as {
    sCapHeight: number;
    sxHeight: number;
  };

  return {
    ascender: font.ascender,
    baseline: 0,
    capHeight: os2.sCapHeight,
    descender: font.descender,
    pDescender: font.charToGlyph("p").getBoundingBox().y1,
    xHeight: os2.sxHeight,
  };
};

const toOutline = (font: Font, char: string): Outline | null => {
  const glyph = font.charToGlyph(char);

  if (glyph.index === 0) {
    return null;
  }

  const { commands } = glyph.getPath(0, 0, font.unitsPerEm);
  const on: Point[] = [];
  const off: Point[] = [];
  const handles: Outline["handles"] = [];
  let d = "";
  let previous: Point = [0, 0];
  let start: Point = [0, 0];

  for (const command of commands as PathCommand[]) {
    switch (command.type) {
      case "M": {
        d += `M${command.x} ${command.y}`;
        previous = [command.x, command.y];
        start = previous;
        on.push(previous);
        break;
      }
      case "L": {
        d += `L${command.x} ${command.y}`;
        previous = [command.x, command.y];
        on.push(previous);
        break;
      }
      case "Q": {
        d += `Q${command.x1} ${command.y1} ${command.x} ${command.y}`;
        off.push([command.x1, command.y1]);
        handles.push(
          [previous[0], previous[1], command.x1, command.y1],
          [command.x1, command.y1, command.x, command.y]
        );
        previous = [command.x, command.y];
        on.push(previous);
        break;
      }
      case "C": {
        d += `C${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
        off.push([command.x1, command.y1], [command.x2, command.y2]);
        handles.push(
          [previous[0], previous[1], command.x1, command.y1],
          [command.x2, command.y2, command.x, command.y]
        );
        previous = [command.x, command.y];
        on.push(previous);
        break;
      }
      case "Z": {
        d += "Z";
        previous = start;
        break;
      }
      default: {
        break;
      }
    }
  }

  return {
    advance: glyph.advanceWidth ?? font.unitsPerEm,
    d,
    handles,
    name: glyph.name ?? "",
    off,
    on,
  };
};

const codepointLabel = (char: string) =>
  `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;

interface Layer {
  color: string;
  outline: Outline;
}

const useAspectRatio = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;

      if (height > 0) {
        setAspect(width / height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, aspect] as const;
};

const GlyphCanvas = ({
  label,
  layers,
  metrics,
  view,
}: {
  label?: ReactNode;
  layers: Layer[];
  metrics: Metrics;
  view: ViewMode;
}) => {
  const [ref, aspect] = useAspectRatio();
  const top = metrics.ascender + HEADROOM;
  const height = top - metrics.descender + HEADROOM;
  const content =
    Math.max(520, ...layers.map((layer) => layer.outline.advance)) +
    PADDING * 2;
  const width = Math.max(content, height * aspect);
  const overlay = layers.length > 1;
  const guides = [
    { label: "Cap height", y: metrics.capHeight },
    { label: "x-height", y: metrics.xHeight },
    { label: "Baseline", y: metrics.baseline },
    { label: "Descender", y: metrics.pDescender },
  ];

  return (
    <div ref={ref} className="relative min-h-0 flex-1">
      {label && (
        <span className="text-muted-foreground absolute bottom-3 left-4 text-xs">
          {label}
        </span>
      )}
      <svg
        viewBox={`0 ${-top} ${width} ${height}`}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        {guides.map((guide) => {
          const value = String(Math.round(guide.y));
          const badgeWidth = 22 + value.length * 18;

          return (
            <g key={guide.label} className="text-muted-foreground">
              <line
                x1={0}
                x2={width}
                y1={-guide.y}
                y2={-guide.y}
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              <text x={28} y={-guide.y - 14} fill="currentColor" fontSize={28}>
                {guide.label}
              </text>
              <rect
                x={width - badgeWidth - 24}
                y={-guide.y - 19}
                width={badgeWidth}
                height={38}
                rx={8}
                className="fill-foreground"
              />
              <text
                x={width - badgeWidth / 2 - 24}
                y={-guide.y + 9}
                fontSize={26}
                textAnchor="middle"
                className="fill-background font-mono"
              >
                {value}
              </text>
            </g>
          );
        })}

        {layers.map(({ color, outline }) => {
          const x = (width - outline.advance) / 2;
          let fillOpacity = 1;

          if (view === "anchors") {
            fillOpacity = 0.08;
          } else if (overlay) {
            fillOpacity = 0.45;
          }

          return (
            <g
              key={`${color}-${outline.name}`}
              transform={`translate(${x} 0)`}
              style={{ color }}
            >
              <path
                d={outline.d}
                fill="currentColor"
                fillOpacity={fillOpacity}
                stroke={view === "anchors" ? "currentColor" : "none"}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              {view === "anchors" && (
                <>
                  {outline.handles.map(([x1, y1, x2, y2]) => (
                    <line
                      key={`h-${x1}-${y1}-${x2}-${y2}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeOpacity={0.45}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {outline.off.map(([px, py], index) => (
                    <circle
                      key={`off-${index}-${px}-${py}`}
                      cx={px}
                      cy={py}
                      r={8}
                      fill="var(--background)"
                      stroke="currentColor"
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {outline.on.map(([px, py], index) => (
                    <rect
                      key={`on-${index}-${px}-${py}`}
                      x={px - 9}
                      y={py - 9}
                      width={18}
                      height={18}
                      rx={3}
                      fill="currentColor"
                    />
                  ))}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Legend = ({ color, name }: { color: string; name: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="size-2 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
    {name}
  </span>
);

const present = (layers: (Layer | null)[]) =>
  layers.filter((layer): layer is Layer => layer !== null);

const VIEWS = [
  {
    icon: <SquareIcon className="fill-current" />,
    label: "Solid",
    value: "solid",
  },
  { icon: <SplineIcon />, label: "Anchors", value: "anchors" },
] as const;

const COMPARISONS = [
  { icon: <TypeIcon />, label: "Goeist", value: "single" },
  { icon: <Columns2Icon />, label: "Side by side", value: "side" },
  { icon: <LayersIcon />, label: "Overlay", value: "overlay" },
] as const;

const PanelTabs = <T extends string>({
  edge,
  label,
  onChange,
  options,
  value,
}: {
  edge: "top" | "bottom";
  label: string;
  onChange: (value: T) => void;
  options: readonly { icon: ReactNode; label: string; value: T }[];
  value: T;
}) => (
  <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
    <TabsList
      aria-label={label}
      className={cn(
        "border-border/60 divide-border/60 h-auto w-full gap-0 divide-x rounded-none bg-transparent p-0",
        edge === "bottom" ? "border-b" : "border-t"
      )}
    >
      {options.map((option) => (
        <TabsTrigger
          key={option.value}
          value={option.value}
          className={cn(
            "text-muted-foreground hover:text-foreground data-active:text-foreground relative flex-1 gap-2 rounded-none px-3 py-3 data-active:bg-transparent data-active:shadow-none [&_svg]:size-4",
            "after:bg-foreground after:absolute after:inset-x-0 after:h-0.5 after:opacity-0 data-active:after:opacity-100",
            edge === "bottom" ? "after:-bottom-px" : "after:-top-px"
          )}
        >
          {option.icon}
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

const WeightField = ({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: number) => void;
  value: number;
}) => (
  <NumberField.Root
    disabled={disabled}
    max={900}
    min={100}
    snapOnStep
    step={100}
    value={value}
    onValueChange={(next) => {
      if (next !== null) {
        onChange(next);
      }
    }}
    className="flex items-center gap-1.5"
  >
    <MoveHorizontalIcon className="size-3.5" aria-hidden="true" />
    <span>wght</span>
    <NumberField.Input
      aria-label="Weight"
      className="text-foreground focus-visible:ring-ring/50 w-9 rounded bg-transparent text-right font-mono tabular-nums outline-none focus-visible:ring-2"
    />
  </NumberField.Root>
);

const DRAG_STEP_PX = 24;

const CanvasScrub = ({
  children,
  disabled,
  onChange,
  value,
}: {
  children: ReactNode;
  disabled: boolean;
  onChange: (value: number) => void;
  value: number;
}) => {
  const drag = useRef<{ startValue: number; startX: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 touch-none flex-col select-none",
        !disabled && (dragging ? "cursor-grabbing" : "cursor-move")
      )}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) {
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startValue: value, startX: event.clientX };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (!drag.current) {
          return;
        }

        const steps = Math.round(
          (event.clientX - drag.current.startX) / DRAG_STEP_PX
        );
        const next = Math.min(
          900,
          Math.max(100, drag.current.startValue + steps * 100)
        );

        if (next !== value) {
          onChange(next);
        }
      }}
      onPointerUp={() => {
        drag.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
    >
      {children}
    </div>
  );
};

const GlyphStage = ({
  compare,
  geist,
  goeist,
  metrics,
  names,
  view,
}: {
  compare: CompareMode;
  geist: Outline | null;
  goeist: Outline | null;
  metrics: Metrics;
  names: { geist: string; goeist: string };
  view: ViewMode;
}) => {
  const goeistLayer = goeist && { color: GOEIST_COLOR, outline: goeist };
  const geistLayer = geist && { color: GEIST_COLOR, outline: geist };

  if (compare === "side") {
    return (
      <div className="divide-border/60 grid min-h-0 flex-1 grid-cols-2 divide-x">
        <div className="flex min-h-0 flex-col">
          <GlyphCanvas
            label={<Legend color={GOEIST_COLOR} name={names.goeist} />}
            layers={present([goeistLayer])}
            metrics={metrics}
            view={view}
          />
        </div>
        <div className="flex min-h-0 flex-col">
          <GlyphCanvas
            label={<Legend color={GEIST_COLOR} name={names.geist} />}
            layers={present([geistLayer])}
            metrics={metrics}
            view={view}
          />
        </div>
      </div>
    );
  }

  if (compare === "overlay") {
    return (
      <GlyphCanvas
        label={
          <span className="flex gap-4">
            <Legend color={GOEIST_COLOR} name={names.goeist} />
            <Legend color={GEIST_COLOR} name={names.geist} />
          </span>
        }
        layers={present([geistLayer, goeistLayer])}
        metrics={metrics}
        view={view}
      />
    );
  }

  return (
    <GlyphCanvas
      layers={present([
        goeist && { color: "var(--foreground)", outline: goeist },
      ])}
      metrics={metrics}
      view={view}
    />
  );
};

export const GlyphInspector = () => {
  const family = useFontFamily();
  const [weight, setWeight] = useState<StaticWeight>("Regular");
  const [compare, setCompare] = useState<CompareMode>("single");
  const [view, setView] = useState<ViewMode>("solid");
  const [char, setChar] = useState(DEFAULT_CHAR);
  const [fonts, setFonts] = useState<LoadedFonts | null>(null);
  const [failed, setFailed] = useState(false);
  const isSerif = family === "serif";
  const names = FAMILY_NAMES[family];

  useEffect(() => {
    let active = true;
    const sources = glyphSources(family, weight);

    const load = async () => {
      try {
        const [goeist, geist] = await Promise.all([
          loadFont(sources.goeist),
          loadFont(sources.geist),
        ]);

        if (active) {
          setFonts({ geist, goeist });
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    };

    setFailed(false);
    load();

    return () => {
      active = false;
    };
  }, [family, weight]);

  const characters = useMemo(
    () => (fonts ? characterSet(fonts.goeist) : []),
    [fonts]
  );
  const metrics = useMemo(
    () => (fonts ? readMetrics(fonts.goeist) : null),
    [fonts]
  );
  const goeist = useMemo(
    () => (fonts ? toOutline(fonts.goeist, char) : null),
    [fonts, char]
  );
  const geist = useMemo(
    () => (fonts ? toOutline(fonts.geist, char) : null),
    [fonts, char]
  );

  useEffect(() => {
    if (characters.length > 0 && !characters.includes(char)) {
      setChar(DEFAULT_CHAR);
    }
  }, [characters, char]);

  const weightValue = isSerif
    ? 400
    : (STATIC_WEIGHTS.find((item) => item.name === weight)?.value ?? 400);

  const changeWeight = (value: number) => {
    const next = STATIC_WEIGHTS.find((item) => item.value === value);

    if (next) {
      setWeight(next.name);
    }
  };

  let stage: ReactNode = <Skeleton className="m-4 flex-1 rounded-lg" />;

  if (failed) {
    stage = (
      <p className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-center text-sm">
        Couldn&rsquo;t load the glyph outlines. Check your connection and
        reload.
      </p>
    );
  } else if (metrics) {
    stage = (
      <GlyphStage
        compare={compare}
        geist={geist}
        goeist={goeist}
        metrics={metrics}
        names={names}
        view={view}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-0">
      <div className="border-border/60 bg-background flex h-[30rem] flex-col border lg:sticky lg:top-6 lg:h-[min(42rem,calc(100svh-3rem))] lg:self-start lg:border-r-0">
        <PanelTabs
          edge="bottom"
          label="Rendering"
          options={VIEWS}
          value={view}
          onChange={setView}
        />

        <div className="border-border/60 text-muted-foreground flex items-center justify-between gap-3 border-b px-4 py-2 text-xs">
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "text-foreground text-base leading-none",
                FAMILY_FACE[family]
              )}
              style={{ fontWeight: weightValue }}
            >
              {char}
            </span>
            <span className="font-mono">{codepointLabel(char)}</span>
          </span>
          <WeightField
            disabled={isSerif}
            value={weightValue}
            onChange={changeWeight}
          />
        </div>

        <CanvasScrub
          disabled={isSerif}
          value={weightValue}
          onChange={changeWeight}
        >
          {stage}
        </CanvasScrub>

        <PanelTabs
          edge="top"
          label="Comparison"
          options={COMPARISONS}
          value={compare}
          onChange={setCompare}
        />
      </div>

      <div
        className={cn(
          "border-border/60 grid max-h-[28rem] grid-cols-6 overflow-y-auto border-t border-l sm:grid-cols-9 lg:max-h-none lg:overflow-visible",
          FAMILY_FACE[family]
        )}
        style={{ fontWeight: weightValue }}
      >
        {characters.length === 0
          ? Array.from({ length: 63 }, (_, index) => (
              <Skeleton
                key={index}
                className="border-border/60 aspect-square rounded-none border-r border-b"
              />
            ))
          : characters.map((item) => (
              <Toggle
                key={item}
                aria-label={`${item} ${codepointLabel(item)}`}
                pressed={item === char}
                onPressedChange={() => setChar(item)}
                className="border-border/60 aria-pressed:bg-foreground aria-pressed:text-background hover:aria-pressed:bg-foreground aspect-square h-auto min-w-0 rounded-none border-r border-b px-0 text-2xl [font-weight:inherit] sm:text-3xl"
              >
                {item}
              </Toggle>
            ))}
      </div>
    </div>
  );
};
