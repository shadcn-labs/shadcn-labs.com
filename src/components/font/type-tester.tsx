import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ItalicIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";

import { ElasticSlider } from "@/components/elastic-slider";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

import { ChoiceGroup, SEGMENT_ITEM } from "./choice-group";
import { FAMILY_FACE } from "./faces";
import { useFontFamily } from "./use-font-family";

type Preset = "headline" | "pangram" | "numbers" | "body";
type Align = "left" | "center" | "right";

interface Settings {
  lineHeight: number;
  size: number;
  spacing: number;
  weight: number;
}

const PRESETS: Record<
  Preset,
  Settings & { features?: string; label: string; text: string }
> = {
  body: {
    label: "Body",
    lineHeight: 1.5,
    size: 20,
    spacing: 0,
    text: "Goeist keeps Geist's proportions, spacing and OpenType features, and softens every exposed corner and stroke ending. It reads calmly at small sizes and turns friendly when set large — a typeface for interfaces, documentation and long reads that should feel a little warmer.",
    weight: 400,
  },
  headline: {
    label: "Headline",
    lineHeight: 1,
    size: 96,
    spacing: -4,
    text: "Soft corners, sharper ideas.",
    weight: 600,
  },
  numbers: {
    features: '"tnum" 1, "frac" 1',
    label: "Numbers",
    lineHeight: 1.1,
    size: 72,
    spacing: -2,
    text: "0123456789 1/2 3/4 $1,248.31 −12.5% 21:04",
    weight: 500,
  },
  pangram: {
    label: "Pangram",
    lineHeight: 1.1,
    size: 64,
    spacing: -2,
    text: "The quick brown fox jumps over the lazy dog.",
    weight: 400,
  },
};

const SHAPES = [
  { label: "Round", value: "0" },
  { label: "Square", value: "25" },
  { label: "Triangle", value: "50" },
  { label: "Heart", value: "100" },
] as const;

const ASCENDER = 1.005;
const CONTENT_HEIGHT = 1.3;

const baselineStyle = (size: number, lineHeight: number): CSSProperties => {
  const baseline = (lineHeight - CONTENT_HEIGHT) / 2 + ASCENDER;

  return {
    backgroundClip: "content-box",
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 calc(${lineHeight}em - 1px), color-mix(in oklab, var(--foreground) 22%, transparent) calc(${lineHeight}em - 1px) ${lineHeight}em)`,
    backgroundOrigin: "content-box",
    backgroundPositionY: `${baseline - lineHeight}em`,
    fontSize: `${size}px`,
    maskImage:
      "repeating-linear-gradient(to right, black 0 6px, transparent 6px 10px)",
  };
};

export const TypeTester = () => {
  const family = useFontFamily();
  const [preset, setPreset] = useState<Preset>("headline");
  const [settings, setSettings] = useState<Settings>(PRESETS.headline);
  const [align, setAlign] = useState<Align>("left");
  const [italic, setItalic] = useState(false);
  const [shape, setShape] = useState<(typeof SHAPES)[number]["value"]>("0");
  const [revision, setRevision] = useState(0);
  const isSerif = family === "serif";
  const current = PRESETS[preset];

  const update = (patch: Partial<Settings>) =>
    setSettings((previous) => ({ ...previous, ...patch }));

  const applyPreset = (next: Preset) => {
    const { lineHeight, size, spacing, weight } = PRESETS[next];

    setPreset(next);
    setSettings({ lineHeight, size, spacing, weight });
    setRevision((value) => value + 1);
  };

  const style: CSSProperties = {
    fontFeatureSettings: current.features ?? "normal",
    fontSize: `${settings.size}px`,
    fontStyle: italic && !isSerif ? "italic" : "normal",
    fontVariationSettings: isSerif ? `"ELSH" ${shape}` : "normal",
    fontWeight: isSerif ? 400 : settings.weight,
    letterSpacing: `${settings.spacing / 100}em`,
    lineHeight: settings.lineHeight,
    textAlign: align,
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          isSerif ? "lg:grid-cols-3" : "lg:grid-cols-4"
        )}
      >
        {!isSerif && (
          <ElasticSlider
            label="Weight"
            max={900}
            min={100}
            step={10}
            value={settings.weight}
            formatValue={String}
            onValueChange={(weight) => update({ weight })}
          />
        )}
        <ElasticSlider
          label="Size"
          max={160}
          min={12}
          step={1}
          value={settings.size}
          formatValue={(value) => `${value}px`}
          onValueChange={(size) => update({ size })}
        />
        <ElasticSlider
          label="Line height"
          max={2}
          min={0.8}
          step={0.05}
          value={settings.lineHeight}
          formatValue={(value) => value.toFixed(2)}
          onValueChange={(lineHeight) => update({ lineHeight })}
        />
        <ElasticSlider
          label="Spacing"
          max={20}
          min={-10}
          step={0.5}
          value={settings.spacing}
          formatValue={(value) => `${value}%`}
          onValueChange={(spacing) => update({ spacing })}
        />
      </div>

      <div className="border-border/60 bg-muted/30 relative overflow-hidden rounded-xl border dark:bg-[#212017]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 p-6 sm:p-10"
          style={baselineStyle(settings.size, settings.lineHeight)}
        />
        <div
          key={`${preset}-${revision}`}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Type tester specimen text"
          aria-multiline="true"
          spellCheck={false}
          className={cn(
            "relative min-h-80 w-full cursor-text p-6 [overflow-wrap:anywhere] outline-none sm:p-10",
            FAMILY_FACE[family]
          )}
          style={style}
        >
          {current.text}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <ChoiceGroup
          label="Sample text"
          value={preset}
          onChange={applyPreset}
          options={(Object.keys(PRESETS) as Preset[]).map((key) => ({
            label: PRESETS[key].label,
            value: key,
          }))}
        />

        {isSerif && (
          <ChoiceGroup
            label="Dot shape"
            value={shape}
            onChange={setShape}
            options={SHAPES}
          />
        )}

        {!isSerif && (
          <div className="bg-muted/60 flex items-center rounded-xl p-1 shadow-inner">
            <Toggle
              aria-label="Italic"
              pressed={italic}
              onPressedChange={setItalic}
              className={cn(SEGMENT_ITEM, "size-8 px-0")}
            >
              <ItalicIcon />
            </Toggle>
          </div>
        )}

        <ChoiceGroup
          label="Alignment"
          value={align}
          onChange={setAlign}
          options={[
            {
              label: <AlignLeftIcon aria-label="Align left" />,
              value: "left",
            },
            {
              label: <AlignCenterIcon aria-label="Align center" />,
              value: "center",
            },
            {
              label: <AlignRightIcon aria-label="Align right" />,
              value: "right",
            },
          ]}
        />

        <Button
          variant="outline"
          className="h-10 rounded-xl px-4"
          onClick={() => {
            applyPreset(preset);
            setAlign("left");
            setItalic(false);
            setShape("0");
          }}
        >
          <RotateCcwIcon />
          Reset
        </Button>
      </div>
    </div>
  );
};
