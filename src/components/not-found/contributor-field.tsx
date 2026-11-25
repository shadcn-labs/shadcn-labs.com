import { useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";

import { cn } from "@/lib/utils";

import {
  MAX_RIPPLES,
  MAX_SPLATS,
  OFFSET,
  PARAMS_FLOATS,
  createFieldGpu,
} from "./contributor-field-gpu";
import type { FieldGpu } from "./contributor-field-gpu";
import { findNameBox, layoutField } from "./contributor-field-layout";
import type { FieldLayout } from "./contributor-field-layout";

export type FieldMode = "gpu" | "static";

export interface ContributorFieldHandle {
  /** Highlight one drawn copy of `login`, or clear with `null`. */
  highlight: (login: string | null) => void;
  /** Start a reveal ripple at a point in CSS px relative to the field. */
  ripple: (x: number, y: number) => void;
  /** Add a cursor trail sample at a point in CSS px relative to the field. */
  trail: (x: number, y: number) => void;
}

interface ContributorFieldProps {
  className?: string;
  logins: readonly string[];
  onModeChange?: (mode: FieldMode) => void;
  ref?: Ref<ContributorFieldHandle>;
}

/** Start time for unused trail and ripple slots: far enough back to be dead. */
const NEVER = -1e4;
const MAX_DPR = 2;
const TRAIL_SPACING = 10;

const readInk = (): [number, number, number] => {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return [0, 0, 0];
  }

  // Resolves any CSS colour syntax (hex, oklch, …) to sRGB bytes.
  ctx.fillStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim() || "#111";
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

  return [r / 255, g / 255, b / 255];
};

const restingOpacity = () =>
  document.documentElement.classList.contains("dark") ? 0.12 : 0.1;

/**
 * A field of contributor logins drawn behind the 404 page. WebGPU (TypeGPU)
 * renders the cursor trail, click ripples and search highlight; without
 * WebGPU the names are drawn once, statically, with Canvas 2D.
 */
export const ContributorField = ({
  className,
  logins,
  onModeChange,
  ref,
}: ContributorFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ContributorFieldHandle | null>(null);
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;

  useImperativeHandle(
    ref,
    () => ({
      highlight: (login) => controllerRef.current?.highlight(login),
      ripple: (x, y) => controllerRef.current?.ripple(x, y),
      trail: (x, y) => controllerRef.current?.trail(x, y),
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || logins.length === 0) {
      return;
    }

    const params = new Float32Array(PARAMS_FLOATS);
    for (let i = 0; i < MAX_SPLATS; i += 1) {
      params[OFFSET.splats + i * 4 + 2] = NEVER;
    }
    for (let i = 0; i < MAX_RIPPLES; i += 1) {
      params[OFFSET.ripples + i * 4 + 2] = NEVER;
    }

    const start = performance.now();
    const now = () => (performance.now() - start) / 1000;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let disposed = false;
    let gpu: FieldGpu | null = null;
    let mode: FieldMode | null = null;
    let layout: FieldLayout | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let highlighted: string | null = null;
    let highlightStart = NEVER;
    let splatIndex = 0;
    let rippleIndex = 0;
    let lastTrailX = Number.NaN;
    let lastTrailY = Number.NaN;
    let visible = true;
    let frame = 0;

    const applyInk = () => {
      const [r, g, b] = readInk();
      params.set([r, g, b, restingOpacity()], OFFSET.ink);
    };

    const applyHighlight = () => {
      const box =
        highlighted && layout
          ? findNameBox(layout.boxes, highlighted, width, height)
          : null;
      // Pad the box so glyph edges are not clipped by the full-ink test.
      params.set(
        box ? [box.x - 1, box.y, box.width + 2, box.height] : [0, 0, 0, 0],
        OFFSET.highlight
      );
    };

    const drawStatic = () => {
      const ctx = canvas.getContext("2d");

      if (!ctx || !layout) {
        return;
      }

      const [r, g, b] = readInk();
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(layout.atlas, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = `rgb(${r * 255} ${g * 255} ${b * 255} / ${restingOpacity() * 1.6})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    };

    const render = () => {
      frame = 0;

      if (disposed || !gpu || !visible) {
        return;
      }

      params.set(
        [now(), dpr, highlightStart, reducedMotion.matches ? 0 : 1],
        OFFSET.timing
      );
      gpu.render(params);
      frame = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!frame && gpu && visible) {
        frame = requestAnimationFrame(render);
      }
    };

    const relayout = () => {
      const rect = canvas.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      ({ width, height } = rect);
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      layout = layoutField(
        logins,
        width,
        height,
        dpr,
        getComputedStyle(canvas).fontFamily
      );
      canvas.width = layout.atlas.width;
      canvas.height = layout.atlas.height;
      applyHighlight();

      if (gpu) {
        gpu.setAtlas(layout.atlas);
      } else if (mode === "static") {
        drawStatic();
      }
    };

    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(relayout);
    });

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      startLoop();
    });

    const themeObserver = new MutationObserver(() => {
      applyInk();
      if (mode === "static") {
        drawStatic();
      }
    });

    controllerRef.current = {
      highlight: (login) => {
        highlighted = login;
        highlightStart = now();
        applyHighlight();
      },
      ripple: (x, y) => {
        params.set([x, y, now(), 0], OFFSET.ripples + rippleIndex * 4);
        rippleIndex = (rippleIndex + 1) % MAX_RIPPLES;
      },
      trail: (x, y) => {
        if (Math.hypot(x - lastTrailX, y - lastTrailY) < TRAIL_SPACING) {
          return;
        }
        lastTrailX = x;
        lastTrailY = y;
        params.set([x, y, now(), 1], OFFSET.splats + splatIndex * 4);
        splatIndex = (splatIndex + 1) % MAX_SPLATS;
      },
    };

    const init = async () => {
      // Names are measured with the page font, so wait until it has loaded.
      await document.fonts.ready;

      try {
        const created = await createFieldGpu(canvas);

        if (disposed) {
          created.destroy();
          return;
        }

        gpu = created;
        mode = "gpu";
      } catch (error) {
        console.warn(
          "[404] WebGPU unavailable, drawing the contributor field statically.",
          error
        );
        mode = "static";
      }

      if (disposed) {
        return;
      }

      applyInk();
      relayout();
      resizeObserver.observe(canvas);
      intersectionObserver.observe(canvas);
      themeObserver.observe(document.documentElement, {
        attributeFilter: ["class"],
        attributes: true,
      });
      onModeChangeRef.current?.(mode);
      startLoop();
    };

    init();

    return () => {
      disposed = true;
      controllerRef.current = null;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      gpu?.destroy();
    };
  }, [logins]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("pointer-events-none size-full", className)}
      ref={canvasRef}
    />
  );
};
