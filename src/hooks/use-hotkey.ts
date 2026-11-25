"use client";

import { useEffect } from "react";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export interface UseHotkeyOptions {
  enabled?: boolean;
  skipWhenTyping?: boolean;
}

export const useHotkey = (
  key: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, skipWhenTyping = true }: UseHotkeyOptions = {}
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      const { activeElement } = document;
      if (skipWhenTyping && EDITABLE_TAGS.has(activeElement?.tagName ?? "")) {
        return;
      }

      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, handler, enabled, skipWhenTyping]);
};
