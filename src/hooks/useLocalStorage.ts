import { useState, useEffect, useRef } from 'react';

const SAVE_DEBOUNCE_MS = 800;
const MAX_STORAGE_SIZE = 4 * 1024 * 1024;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function save<T>(key: string, value: T, trim?: (data: T) => T) {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_STORAGE_SIZE && trim) {
      console.warn('[useLocalStorage] Data too large, trimming...');
      localStorage.setItem(key, JSON.stringify(trim(value)));
      return;
    }
    localStorage.setItem(key, serialized);
  } catch {
    console.error('[useLocalStorage] Failed to save');
  }
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
  options?: { debounceMs?: number; trim?: (data: T) => T }
) {
  const [state, setState] = useState<T>(() => load(key, fallback));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceMs = options?.debounceMs ?? SAVE_DEBOUNCE_MS;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save(key, state, options?.trim);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, key, debounceMs, options]);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem(key);
    setState(fallback);
  };

  return [state, setState, clear] as const;
}
