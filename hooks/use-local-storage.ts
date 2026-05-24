"use client";

import { useEffect, useState } from "react";
import { isMockMode } from "@/lib/supabase";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isMockMode) {
      setHydrated(true);
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) setValue(JSON.parse(item) as T);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated || !isMockMode) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return [value, setValue, hydrated] as const;
}
