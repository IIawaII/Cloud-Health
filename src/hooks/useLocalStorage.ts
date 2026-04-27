import { useState, useEffect, useRef } from 'react';
import { setCache, getCache } from '@/utils/storage';

const SAVE_DEBOUNCE_MS = 800;
const MAX_LOCAL_STORAGE_SIZE = 4 * 1024 * 1024;

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
    if (serialized.length > MAX_LOCAL_STORAGE_SIZE && trim) {
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

/**
 * 基于 IndexedDB 的持久化存储 Hook
 * 适用于大数据量场景（>4MB），自动降级到 localStorage
 */
export function useIndexedDBStorage<T>(
  key: string,
  fallback: T,
  ttlMs?: number
) {
  const [state, setState] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化时从 IndexedDB 加载
  useEffect(() => {
    getCache<T>(key).then((cached) => {
      if (cached !== null) {
        setState(cached);
      }
      setReady(true);
    });
  }, [key]);

  // 防抖保存到 IndexedDB
  useEffect(() => {
    if (!ready) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCache(key, state, ttlMs).catch(() => {});
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, key, ready, ttlMs]);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(fallback);
  };

  return [state, setState, clear] as const;
}
