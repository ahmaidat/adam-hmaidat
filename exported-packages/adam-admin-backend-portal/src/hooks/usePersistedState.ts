import { useState, useEffect, useCallback, useRef } from 'react';
import { safeStorage } from '../utils/safeStorage';

/**
 * Custom hook for two-way reactive state persistence:
 * 1. Synchronizes state with safeStorage (resilient on Safari private mode).
 * 2. Synchronizes state with URL Query Parameters (bidirectional).
 * 3. Restores initial state instantly on reload (Ctrl+F5) or URL share.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: {
    storageType?: 'local' | 'session';
    syncUrlParam?: string; // Query param key name in URL
    serialize?: (val: T) => string;
    deserialize?: (raw: string) => T;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const storageType = options?.storageType || 'local';
  const urlParam = options?.syncUrlParam;
  
  // Custom serialization
  const serialize = options?.serialize || ((v: T) => (typeof v === 'string' ? v : JSON.stringify(v)));
  const deserialize = options?.deserialize || ((raw: string) => {
    if (typeof defaultValue === 'string') return raw as unknown as T;
    if (typeof defaultValue === 'number') {
      const num = Number(raw);
      return (isNaN(num) ? defaultValue : num) as unknown as T;
    }
    if (typeof defaultValue === 'boolean') {
      return (raw === 'true' || raw === '1') as unknown as T;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  });

  // 1. Compute Initial State from URL params -> Safe Storage -> Default Value
  const getInitialValue = (): T => {
    if (typeof window === 'undefined') return defaultValue;

    // Check URL query parameters first (Highest priority for link sharing & Ctrl+F5)
    if (urlParam) {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const valFromUrl = searchParams.get(urlParam);
        if (valFromUrl !== null && valFromUrl !== '') {
          return deserialize(valFromUrl);
        }
      } catch {
        // fallback
      }
    }

    // Check safe storage second (Protected against Safari quota errors)
    try {
      const stored = safeStorage.getItem(key);
      if (stored !== null && stored !== '') {
        return deserialize(stored);
      }
    } catch (err) {
      console.warn(`[usePersistedState] Storage read error for key "${key}":`, err);
    }

    return defaultValue;
  };

  const [state, setState] = useState<T>(getInitialValue);
  const isFirstMount = useRef(true);

  // 2. Sync to Storage and URL on state change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Also ensure URL is initialized if default was used and urlParam exists
      if (urlParam && typeof window !== 'undefined') {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          if (!searchParams.has(urlParam) && state !== defaultValue && state !== '' && state !== undefined && state !== null) {
            searchParams.set(urlParam, typeof state === 'string' ? state : serialize(state));
            const newUrl = `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`;
            window.history.replaceState(null, '', newUrl);
          }
        } catch {}
      }
      return;
    }

    // Persist to safeStorage
    try {
      if (state === undefined || state === null || (typeof state === 'string' && state === '')) {
        safeStorage.removeItem(key);
      } else {
        safeStorage.setItem(key, typeof state === 'string' ? state : serialize(state));
      }
    } catch (err) {
      console.warn(`[usePersistedState] Storage write error for key "${key}":`, err);
    }

    // Persist to URL Query Param without triggering reload
    if (urlParam && typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        if (state === undefined || state === null || (typeof state === 'string' && state === '') || state === defaultValue) {
          searchParams.delete(urlParam);
        } else {
          searchParams.set(urlParam, typeof state === 'string' ? state : serialize(state));
        }
        const queryStr = searchParams.toString();
        const newUrl = queryStr ? `${window.location.pathname}?${queryStr}${window.location.hash}` : `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, '', newUrl);
      } catch (e) {
        console.warn(`[usePersistedState] URL sync error for param "${urlParam}":`, e);
      }
    }
  }, [key, state, urlParam, defaultValue, serialize]);

  // 3. Listen to external changes (Storage events across tabs or popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(deserialize(e.newValue));
        } catch {}
      }
    };

    const handlePopState = () => {
      if (urlParam) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const valFromUrl = searchParams.get(urlParam);
          if (valFromUrl !== null) {
            setState(deserialize(valFromUrl));
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [key, urlParam, deserialize]);

  // Reset to default helper
  const reset = useCallback(() => {
    setState(defaultValue);
    try {
      safeStorage.removeItem(key);
    } catch {}
    if (urlParam && typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete(urlParam);
        const queryStr = searchParams.toString();
        const newUrl = queryStr ? `${window.location.pathname}?${queryStr}${window.location.hash}` : `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, '', newUrl);
      } catch {}
    }
  }, [defaultValue, key, urlParam]);

  return [state, setState, reset];
}

/**
 * Persisted GPS Coordinates Helper
 * Retains the last acquired location immediately on startup to eliminate GPS wait times.
 */
export interface PersistedGeoLocation {
  lat: number;
  lng: number;
  x: number;
  y: number;
  name: string;
  accuracy?: number;
  timestamp: number;
}

const GEO_STORAGE_KEY = 'adam_last_known_geo';

export function getPersistedGeoLocation(): PersistedGeoLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = safeStorage.getItem(GEO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only accept if coordinates are valid numbers
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed;
    }
  } catch {}
  return null;
}

export function savePersistedGeoLocation(loc: Omit<PersistedGeoLocation, 'timestamp'> & { timestamp?: number }) {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedGeoLocation = {
      ...loc,
      timestamp: loc.timestamp || Date.now()
    };
    safeStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
