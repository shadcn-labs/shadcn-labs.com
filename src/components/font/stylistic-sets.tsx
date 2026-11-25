import { useState } from "react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FontFamily } from "@/data/goeist-font";
import { cn } from "@/lib/utils";

import { FAMILY_FACE } from "./faces";
import { useFontFamily } from "./use-font-family";

interface StylisticSet {
  tag: string;
  label: string;
  sample: string;
}

const SETS: Record<FontFamily, StylisticSet[]> = {
  mono: [
    { label: "No tail a", sample: "P[a]p[a]y[a] j[a]m", tag: "ss01" },
    { label: "Alt a", sample: "B[a]n[a]n[a]", tag: "ss02" },
    { label: "Alt l", sample: "I[l][l]inois", tag: "ss03" },
    { label: "Alt R", sample: "[R]etro [R]ecords", tag: "ss04" },
    { label: "Alt G", sample: "[G]reat [G]atsby", tag: "ss06" },
    { label: "Alt arrows", sample: "Home [→] Docs [←]", tag: "ss07" },
    { label: "Rounded dot", sample: "Yes[!] Wait[.][.][.] i[;]", tag: "ss08" },
    { label: "Non-slashed zero", sample: "PIN [0][0]7, 4[0]4", tag: "ss09" },
    {
      label: "Coding ligatures",
      sample: "a [=>] b [!=] c [<=] d",
      tag: "ss11",
    },
  ],
  sans: [
    { label: "No tail a", sample: "P[a]p[a]y[a] j[a]m", tag: "ss01" },
    { label: "Alt a", sample: "B[a]n[a]n[a] b[a]r", tag: "ss02" },
    { label: "Alt l", sample: "I[l][l]inois", tag: "ss03" },
    { label: "Alt R", sample: "[R]etro [R]ecords", tag: "ss04" },
    { label: "Alt I", sample: "[I]celand", tag: "ss05" },
    { label: "Alt G", sample: "[G]reat [G]atsby", tag: "ss06" },
    { label: "Alt arrows", sample: "Home [→] Docs [↗]", tag: "ss07" },
    { label: "Rounded dot", sample: "Yes[!] Wait[.][.][.] i[;]", tag: "ss08" },
    { label: "Alt numbers", sample: "Gate [1][4], row [6][9]", tag: "ss09" },
  ],
  serif: [
    { label: "Alternate a k R", sample: "B[a]c[k] [R]oom", tag: "ss01" },
    { label: "Square dots", sample: "Fin[i][.] Jolly[!]", tag: "ss02" },
    { label: "Triangle dots", sample: "Fin[i][.] Jolly[!]", tag: "ss03" },
    { label: "Heart dots", sample: "Fin[i][.] Jolly[!]", tag: "ss04" },
    { label: "Round letters", sample: "[a][e][o] [2][0][2][6]", tag: "ss05" },
  ],
};

const renderSample = (sample: string, tag: string, enabled: boolean) => {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of sample.matchAll(/\[(?<text>[^\]]+)\]/gu)) {
    const index = match.index ?? 0;

    if (index > cursor) {
      parts.push(sample.slice(cursor, index));
    }

    parts.push(
      <em
        key={index}
        className={cn(
          "not-italic transition-colors",
          enabled && "text-primary"
        )}
        style={{ fontFeatureSettings: enabled ? `"${tag}" 1` : "normal" }}
      >
        {match.groups?.text}
      </em>
    );
    cursor = index + match[0].length;
  }

  if (cursor < sample.length) {
    parts.push(sample.slice(cursor));
  }

  return parts;
};

export const StylisticSets = () => {
  const family = useFontFamily();
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set());

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SETS[family].map((set) => {
        const key = `${family}-${set.tag}`;
        const enabled = !disabled.has(key);

        return (
          <Card key={key} className="gap-6 px-4">
            <Label className="cursor-pointer gap-3 font-normal">
              <Switch
                checked={enabled}
                onCheckedChange={(checked) =>
                  setDisabled((current) => {
                    const next = new Set(current);

                    if (checked) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }

                    return next;
                  })
                }
              />
              <span className="text-primary font-mono text-xs uppercase">
                {set.tag}
              </span>
              <span className="text-muted-foreground">{set.label}</span>
            </Label>
            <p
              className={cn(
                "text-3xl tracking-[-0.02em] sm:text-4xl",
                FAMILY_FACE[family]
              )}
            >
              {renderSample(set.sample, set.tag, enabled)}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
