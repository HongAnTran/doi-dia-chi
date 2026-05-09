"use client";

import { useEffect, useState } from "react";

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
