"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/** Grows a textarea with its content up to `maxHeight` px, then scrolls. */
export function useAutoResize(value: string, maxHeight = 200) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight]);

  useLayoutEffect(resize, [value, resize]);

  return ref;
}
