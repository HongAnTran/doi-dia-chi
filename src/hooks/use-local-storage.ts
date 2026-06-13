"use client";

import { useEffect, useRef, useState } from "react";

function readLocalStorage<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);

    if (!item) {
      return initialValue;
    }

    return JSON.parse(item) as T;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() =>
    readLocalStorage(key, initialValue),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors, e.g. private mode.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/**
 * Like useState, but persisted to localStorage. Hydration-safe: the first
 * render always uses `initialValue` (matching the server-rendered HTML), then
 * the stored value is restored after mount. Use this — not useLocalStorage —
 * inside statically prerendered pages to avoid hydration mismatches.
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  // Restore once, after mount, so SSR/CSR first render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // Deferred client-only read: starting from `initialValue` keeps SSR/CSR
      // in sync, so restoring here (not in the initializer) is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Ignore parse/read errors.
    }
  }, [key]);

  // Persist on change, but skip the initial mount render so we don't clobber
  // the stored value with the default before it has been restored.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors, e.g. private mode.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
