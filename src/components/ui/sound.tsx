import type { SoundPatch } from "@web-kits/audio";
import { SoundProvider, usePatch } from "@web-kits/audio/react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkey";

const STORAGE_KEY = "kobra-sound-muted";
const VOLUME_KEY = "kobra-sound-volume";
const DEFAULT_VOLUME = 0.5;

const PATCH = {
  name: "kobra-ui",
  sounds: {
    blocked: {
      envelope: { attack: 0.004, decay: 0.06 },
      filter: { frequency: 700, type: "lowpass" },
      gain: 0.16,
      source: { frequency: 180, type: "sine" },
    },
    chirp: {
      envelope: { attack: 0, decay: 0.03, release: 0.01, sustain: 0 },
      gain: 0.08,
      source: { frequency: { end: 1500, start: 1200 }, type: "sine" },
    },
    close: {
      envelope: { attack: 0.004, decay: 0.11 },
      filter: { frequency: 2200, type: "lowpass" },
      gain: 0.22,
      source: { frequency: { end: 300, start: 560 }, type: "triangle" },
    },
    command: {
      layers: [
        {
          envelope: { attack: 0.001, decay: 0.075 },
          gain: 0.2,
          source: { frequency: { end: 784, start: 1046 }, type: "triangle" },
        },
        {
          delay: 0.018,
          envelope: { attack: 0.001, decay: 0.045 },
          gain: 0.06,
          source: { frequency: 1568, type: "sine" },
        },
      ],
    },
    copy: {
      layers: [
        {
          envelope: { attack: 0, decay: 0.015, release: 0.006, sustain: 0 },
          gain: 0.16,
          source: { frequency: 1200, type: "sine" },
        },
        {
          delay: 0.04,
          envelope: { attack: 0, decay: 0.015, release: 0.006, sustain: 0 },
          gain: 0.14,
          source: { frequency: 1400, type: "sine" },
        },
      ],
    },
    destructive: {
      layers: [
        {
          envelope: { attack: 0.002, decay: 0.12 },
          filter: { frequency: 1400, type: "lowpass" },
          gain: 0.32,
          source: { frequency: { end: 170, start: 300 }, type: "triangle" },
        },
        {
          envelope: { decay: 0.05 },
          filter: { frequency: 700, resonance: 1.1, type: "bandpass" },
          gain: 0.06,
          source: { color: "brown", type: "noise" },
        },
      ],
    },
    error: {
      layers: [
        {
          envelope: { attack: 0.003, decay: 0.13 },
          filter: { frequency: 1200, type: "lowpass" },
          gain: 0.26,
          source: { frequency: 300, type: "triangle" },
        },
        {
          delay: 0.09,
          envelope: { attack: 0.003, decay: 0.2 },
          filter: { frequency: 1000, type: "lowpass" },
          gain: 0.24,
          source: { frequency: 224, type: "triangle" },
        },
      ],
    },
    key: {
      layers: [
        {
          envelope: { attack: 0.001, decay: 0.028 },
          gain: 0.14,
          source: { frequency: { end: 900, start: 1000 }, type: "sine" },
        },
        {
          envelope: { decay: 0.01 },
          filter: { frequency: 3200, resonance: 2, type: "bandpass" },
          gain: 0.035,
          source: { color: "white", type: "noise" },
        },
      ],
    },
    notification: {
      layers: [
        {
          envelope: { attack: 0.008, decay: 0.3, release: 0.12, sustain: 0.03 },
          gain: 0.14,
          source: { frequency: 523, type: "triangle" },
        },
        {
          delay: 0.12,
          envelope: { attack: 0.008, decay: 0.25, release: 0.1, sustain: 0.02 },
          gain: 0.12,
          source: { frequency: 784, type: "triangle" },
        },
      ],
    },
    open: {
      envelope: { attack: 0.006, decay: 0.13 },
      filter: { frequency: 2600, type: "lowpass" },
      gain: 0.24,
      source: { frequency: { end: 620, start: 320 }, type: "triangle" },
    },
    select: {
      envelope: { attack: 0.001, decay: 0.055 },
      gain: 0.26,
      source: { frequency: { end: 780, start: 900 }, type: "triangle" },
    },
    sliderTick: {
      layers: [
        {
          envelope: { attack: 0, decay: 0.02, release: 0.006, sustain: 0 },
          filter: { frequency: 3000, resonance: 4, type: "bandpass" },
          gain: 0.19,
          source: { color: "white", type: "noise" },
        },
        {
          envelope: { attack: 0, decay: 0.012, release: 0.004, sustain: 0 },
          gain: 0.09,
          source: { frequency: 700, type: "sine" },
        },
      ],
    },
    success: {
      layers: [
        {
          envelope: { attack: 0.004, decay: 0.16 },
          gain: 0.22,
          source: { frequency: 784, type: "triangle" },
        },
        {
          delay: 0.075,
          envelope: { attack: 0.004, decay: 0.22 },
          gain: 0.18,
          source: { frequency: 1175, type: "triangle" },
        },
      ],
    },
    swoosh: {
      envelope: { attack: 0.008, decay: 0.12, release: 0.04, sustain: 0 },
      gain: 0.12,
      source: { frequency: { end: 2000, start: 300 }, type: "sine" },
    },
    tap: {
      envelope: { attack: 0, decay: 0.015, release: 0.005, sustain: 0 },
      gain: 0.2,
      source: { fm: { depth: 100, ratio: 0.5 }, frequency: 1300, type: "sine" },
    },
    tick: {
      envelope: { decay: 0.014 },
      filter: { frequency: 3000, type: "lowpass" },
      gain: 0.1,
      source: { frequency: 1400, type: "square" },
    },
    toggleOff: {
      envelope: { attack: 0.002, decay: 0.085 },
      gain: 0.28,
      source: { frequency: { end: 420, start: 780 }, type: "sine" },
    },
    toggleOn: {
      envelope: { attack: 0.002, decay: 0.085 },
      gain: 0.3,
      source: { frequency: { end: 880, start: 520 }, type: "sine" },
    },
    warning: {
      layers: [
        {
          envelope: { attack: 0.003, decay: 0.14 },
          filter: { frequency: 2800, type: "lowpass" },
          gain: 0.2,
          source: { frequency: 622, type: "triangle" },
        },
        {
          delay: 0.085,
          envelope: { attack: 0.003, decay: 0.18 },
          filter: { frequency: 2800, type: "lowpass" },
          gain: 0.17,
          source: { frequency: 622, type: "triangle" },
        },
      ],
    },
  },
} as const satisfies SoundPatch;

export type SoundName = keyof (typeof PATCH)["sounds"];

interface Cue {
  sound: SoundName;
  detune?: number;
  velocity?: number;
}

const JITTER: Record<SoundName, number> = {
  blocked: 30,
  chirp: 24,
  close: 10,
  command: 8,
  copy: 6,
  destructive: 12,
  error: 5,
  key: 20,
  notification: 3,
  open: 10,
  select: 22,
  sliderTick: 10,
  success: 5,
  swoosh: 14,
  tap: 26,
  tick: 18,
  toggleOff: 14,
  toggleOn: 14,
  warning: 5,
};

const jitter = (cents: number) => (Math.random() * 2 - 1) * cents;

interface Patch {
  play: (name: string, opts?: object) => unknown;
}

let audioWarm = false;

const play = (patch: Patch, cue: Cue) => {
  const sound = () =>
    patch.play(cue.sound, {
      detune: (cue.detune ?? 0) + jitter(JITTER[cue.sound]),

      velocity: (cue.velocity ?? 1) * (0.9 + Math.random() * 0.1),
    });
  if (audioWarm) {
    sound();
    return;
  }
  audioWarm = true;

  requestAnimationFrame(() => {
    window.setTimeout(sound, 0);
  });
};

const warm = (patch: Patch) => {
  if (audioWarm || !navigator.userActivation?.hasBeenActive) {
    return;
  }
  audioWarm = true;
  patch.play("tap", { volume: 0.0001 });
};

const TOGGLE_SLOTS = new Set([
  "switch",
  "checkbox",
  "toggle",
  "toggle-group-item",
  "radio-group-item",
  "context-menu-checkbox-item",
  "context-menu-radio-item",
  "dropdown-menu-checkbox-item",
  "dropdown-menu-radio-item",
  "menubar-checkbox-item",
  "menubar-radio-item",
]);

const INTERACTIVE =
  '[data-slot], button, a[href], [role="button"], [role="option"], [role="menuitem"], input[type="checkbox"], input[type="radio"]';

const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable]';

const isOn = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement) {
    return el.checked;
  }
  return (
    el.getAttribute("aria-checked") === "true" ||
    el.getAttribute("aria-pressed") === "true" ||
    Object.hasOwn(el.dataset, "checked")
  );
};

const rowPitch = (el: HTMLElement) => {
  const siblings = el.parentElement?.children;
  if (!siblings) {
    return 0;
  }
  return Math.min([...siblings].indexOf(el), 7) * 55;
};
const triggerCue = (el: HTMLElement): Cue => {
  const expanded = el.getAttribute("aria-expanded");
  if (expanded === null) {
    return { sound: "select" };
  }
  return { sound: expanded === "true" ? "close" : "open" };
};

const SELECTABLE_SLOT = /-(?:item|link|option)$/u;

const classify = (el: HTMLElement): Cue | null => {
  const slot = el.dataset.slot ?? "";

  const named = el.dataset.sound;
  if (named && named in PATCH.sounds) {
    return { sound: named as SoundName };
  }

  if (
    TOGGLE_SLOTS.has(slot) ||
    el.matches(
      'input[type="checkbox"], input[type="radio"], [aria-pressed], [role="menuitemcheckbox"], [role="menuitemradio"]'
    )
  ) {
    return { sound: isOn(el) ? "toggleOff" : "toggleOn" };
  }

  if (el.dataset.variant === "destructive") {
    return { sound: "destructive" };
  }
  if (slot.endsWith("-close")) {
    return { sound: "close" };
  }

  if (slot.endsWith("-clear") || slot.endsWith("-remove")) {
    return { sound: "chirp" };
  }
  if (slot.endsWith("-trigger")) {
    return triggerCue(el);
  }
  if (SELECTABLE_SLOT.test(slot)) {
    return { detune: rowPitch(el), sound: "select" };
  }
  if (slot === "slider-thumb" || slot === "slider-track") {
    return { sound: "tick" };
  }
  if (slot === "button" || el.matches('button, a[href], [role="button"]')) {
    const soft =
      el.dataset.variant === "ghost" || el.dataset.variant === "link";
    return { sound: "tap", velocity: soft ? 0.78 : 1 };
  }
  return null;
};

const soundFor = (target: Element, keyed = false): Cue | null => {
  if (target.closest(".command-overlay")) {
    const pointed = keyed ? target.getAttribute("aria-activedescendant") : null;
    const row = pointed
      ? document.querySelector(`#${pointed}`)
      : target.closest(".command-option");
    if (!row) {
      return null;
    }
    return {
      sound: row.querySelector(".command-option-more") ? "chirp" : "command",
    };
  }

  const labeled = target.closest("label")?.control ?? target;

  if (labeled.closest(TEXT_ENTRY)) {
    return null;
  }

  let el = labeled.closest<HTMLElement>(INTERACTIVE);
  while (el) {
    if (el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) {
      return { sound: "blocked" };
    }
    const cue = classify(el);
    if (cue) {
      return cue;
    }
    el = el.parentElement?.closest<HTMLElement>(INTERACTIVE) ?? null;
  }
  return null;
};

const span = (min: number, max: number, value: number) =>
  max === min ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)));

const sliderRange = (el: HTMLElement) => {
  if (el instanceof HTMLInputElement) {
    return {
      max: Number(el.max || 100),
      min: Number(el.min || 0),
      step: Math.abs(Number(el.step)) || 1,
    };
  }
  const read = (name: string, fallback: number) => {
    const value = Number(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    max: read("aria-valuemax", 100),
    min: read("aria-valuemin", 0),
    step: 1,
  };
};

const listeners = new Set<() => void>();

const subscribeMuted = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

const notify = () => {
  for (const onChange of listeners) {
    onChange();
  }
};

export const setSoundMuted = (muted: boolean) => {
  localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  notify();
};

export const useSoundMuted = () =>
  useSyncExternalStore(
    subscribeMuted,
    () => localStorage.getItem(STORAGE_KEY) === "1",
    () => false
  );

export const setSoundVolume = (volume: number) => {
  localStorage.setItem(VOLUME_KEY, String(volume));
  notify();
};

export const useSoundVolume = () =>
  useSyncExternalStore(
    subscribeMuted,
    () => {
      const stored = Number(localStorage.getItem(VOLUME_KEY));

      return Number.isFinite(stored) && stored > 0 && stored <= 1
        ? stored
        : DEFAULT_VOLUME;
    },
    () => DEFAULT_VOLUME
  );
const SoundEffectListener = () => {
  const patch = usePatch(PATCH);
  const muted = useSoundMuted();

  const wasMuted = useRef(muted);
  useEffect(() => {
    const cameBack = wasMuted.current && !muted;
    wasMuted.current = muted;
    if (cameBack) {
      play(patch, { sound: "swoosh" });
    }
  }, [muted, patch]);

  useEffect(() => {
    if (!patch.ready) {
      return;
    }

    const TICK_GAP_MS = 28;
    const TICK_LAG_MS = 60;
    const DRAG_SLOP_PX = 3;

    let grab: { x: number; y: number; dragged: boolean } | null = null;
    let nextTickAt = 0;
    const queued = new Set<ReturnType<typeof setTimeout>>();

    const stopTicking = () => {
      for (const timer of queued) {
        clearTimeout(timer);
      }
      queued.clear();
      nextTickAt = 0;
    };

    const tick = (detune: number, now: number) => {
      if (nextTickAt - now > TICK_LAG_MS) {
        return false;
      }
      const wait = nextTickAt - now;
      nextTickAt += TICK_GAP_MS;
      const cue = { detune, sound: "sliderTick" } as const;
      if (wait <= 0) {
        play(patch, cue);
        return true;
      }
      const timer = setTimeout(() => {
        queued.delete(timer);
        play(patch, cue);
      }, wait);
      queued.add(timer);
      return true;
    };

    const ratchet = (el: HTMLElement, from: number, to: number) => {
      const { min, max, step } = sliderRange(el);
      const crossed = Math.round(Math.abs(to - from) / step);
      if (!Number.isFinite(crossed) || crossed < 1) {
        return;
      }

      const now = performance.now();
      nextTickAt = Math.max(nextTickAt, now);
      const direction = Math.sign(to - from);

      for (let i = 1; i <= crossed; i += 1) {
        const value = from + direction * step * i;
        if (!tick(span(min, max, value) * 900, now)) {
          break;
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element)) {
        return;
      }
      const cue = soundFor(event.target);
      if (!cue) {
        return;
      }
      if (cue.sound === "tick") {
        grab = { dragged: false, x: event.clientX, y: event.clientY };
      }
      play(patch, cue);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      if (event.repeat || !(event.target instanceof Element)) {
        return;
      }
      const typing = event.target.matches(TEXT_ENTRY);

      const driving =
        event.key === "Enter" && event.target.closest(".command-overlay");
      if (typing && !driving) {
        return;
      }
      const cue = soundFor(event.target, true);
      if (cue) {
        play(patch, cue);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!grab || grab.dragged) {
        return;
      }
      if (
        Math.hypot(event.clientX - grab.x, event.clientY - grab.y) >
        DRAG_SLOP_PX
      ) {
        grab.dragged = true;
      }
    };

    const onPointerUp = () => {
      if (grab) {
        stopTicking();
      }
      grab = null;
    };

    const onContextMenu = () => play(patch, { sound: "open" });

    const onInput = (event: Event) => {
      if (!event.isTrusted) {
        return;
      }
      const el = event.target;
      if (!(el instanceof HTMLElement) || !el.matches(TEXT_ENTRY)) {
        return;
      }
      const deleting =
        (event as InputEvent).inputType?.startsWith("delete") ?? false;
      play(patch, {
        detune: deleting ? -260 : 0,
        sound: "key",
      });
    };

    const observer = new MutationObserver((records) => {
      let slid = false;

      for (const record of records) {
        const el = record.target;
        if (!(el instanceof HTMLElement)) {
          continue;
        }
        const value = el.getAttribute(record.attributeName ?? "");

        const entered =
          value !== null && value !== "false" && value !== record.oldValue;

        switch (record.attributeName) {
          case "aria-valuenow": {
            if (slid || !el.matches('input[type="range"], [role="slider"]')) {
              break;
            }

            if (value === null || record.oldValue === null) {
              break;
            }

            if (grab && !grab.dragged) {
              break;
            }
            slid = true;
            if (grab) {
              ratchet(el, Number(record.oldValue), Number(value));
              break;
            }
            const { min, max } = sliderRange(el);
            const now = performance.now();
            nextTickAt = Math.max(nextTickAt, now);
            tick(span(min, max, Number(value)) * 900, now);
            break;
          }
          case "data-success": {
            if (entered) {
              play(patch, { sound: "success" });
            }
            break;
          }
          case "aria-invalid":
          case "data-error": {
            if (entered) {
              play(patch, { sound: "error" });
            }
            break;
          }
          default: {
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      attributeFilter: [
        "aria-valuenow",
        "aria-invalid",
        "data-success",
        "data-error",
      ],
      attributeOldValue: true,
      attributes: true,
      subtree: true,
    });

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("input", onInput, true);
    return () => {
      observer.disconnect();
      stopTicking();
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("input", onInput, true);
    };
  }, [patch]);

  useEffect(() => {
    if (!patch.ready || muted) {
      return;
    }
    const handle = window.setTimeout(() => {
      warm(patch);
    }, 400);
    return () => {
      window.clearTimeout(handle);
    };
  }, [patch, muted]);

  return null;
};

const SPEAKER =
  "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z";
const WAVE_INNER = "M16 9a5 5 0 0 1 0 6";
const WAVE_OUTER = "M19.364 18.364a9 9 0 0 0 0-12.728";
const SLASH = "M2 2 22 22";

export const SoundToggle = ({
  className,
  onClick,
  ...props
}: React.ComponentProps<"button">) => {
  const muted = useSoundMuted();
  const maskId = useId();
  const volume = useSoundVolume();

  useHotkey("m", (event) => {
    if (
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable)
    ) {
      return;
    }
    setSoundMuted(!muted);
  });

  return (
    <SoundProvider enabled={!muted} volume={volume}>
      <SoundEffectListener />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-keyshortcuts="M"
              type="button"
              aria-label={
                muted ? "Unmute interface sounds" : "Mute interface sounds"
              }
              aria-pressed={muted}
              onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                  setSoundMuted(!muted);
                }
              }}

              data-sound="swoosh"
              {...props}
              variant="ghost"
              size="icon-sm"
              className={
                className
                  ? `text-muted-foreground ${className}`
                  : "text-muted-foreground"
              }
            />
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <mask id={maskId}>
              <rect width="24" height="24" fill="white" />
              <path
                className="sound-slash"
                d={SLASH}
                pathLength={1}
                stroke="black"
                strokeWidth={4}
              />
            </mask>
            <g mask={`url(#${maskId})`}>
              <path className="sound-speaker" d={SPEAKER} />
              <path className="sound-wave sound-wave-inner" d={WAVE_INNER} />
              <path className="sound-wave sound-wave-outer" d={WAVE_OUTER} />
            </g>
            <path className="sound-slash" d={SLASH} pathLength={1} />
          </svg>
        </TooltipTrigger>
        <TooltipContent>
          {muted ? "Unmute sounds" : "Mute sounds"}
          <Kbd>M</Kbd>
        </TooltipContent>
      </Tooltip>
    </SoundProvider>
  );
};
