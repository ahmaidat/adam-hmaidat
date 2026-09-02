// Hot Refresh & Programmatic Cache-Busting Manager for Adam Platform
// Provides utilities for force re-rendering, resetting state filters, bypassing HTTP caches, and purging storage without full page reloads

import { useState, useCallback, useEffect } from 'react';

/**
 * 1. Purge Browser & Service Worker Caches
 */
export async function purgeAppCache(keysToPreserve: string[] = ['adam_active_session', 'adam_auth_token']): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // A. Purge LocalStorage (except preserved session items if specified)
    const preservedValues: Record<string, string> = {};
    for (const key of keysToPreserve) {
      const val = localStorage.getItem(key);
      if (val !== null) preservedValues[key] = val;
    }

    localStorage.clear();

    for (const [key, val] of Object.entries(preservedValues)) {
      localStorage.setItem(key, val);
    }

    // B. Purge SessionStorage
    sessionStorage.clear();

    // C. Purge Service Worker Caches (PWA)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch (err) {
    console.warn('[HotRefreshManager] Error purging cache:', err);
  }
}

/**
 * 2. Bypass HTTP Cache & Fetch Fresh Data (Cache-Busting Query)
 */
export async function fetchFreshData<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${separator}_t=${timestamp}`;

    const headers = new Headers(options.headers || {});
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    const response = await fetch(cacheBustedUrl, {
      ...options,
      headers
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 3. React Hook for Programmatic Force Render (State Reset via Key)
 */
export function useForceUpdate(): {
  renderKey: number;
  forceUpdate: () => void;
} {
  const [renderKey, setRenderKey] = useState<number>(0);
  const forceUpdate = useCallback(() => {
    setRenderKey(prev => prev + 1);
  }, []);

  return { renderKey, forceUpdate };
}

/**
 * 4. Clear Query Parameters from URL without reloading
 */
export function clearUrlQueryParams(paramsToClear?: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!paramsToClear || paramsToClear.length === 0) {
      window.history.pushState({}, '', url.pathname + url.hash);
    } else {
      paramsToClear.forEach(p => url.searchParams.delete(p));
      const query = url.searchParams.toString();
      const newUrl = query ? `${url.pathname}?${query}${url.hash}` : `${url.pathname}${url.hash}`;
      window.history.pushState({}, '', newUrl);
    }
  } catch (err) {
    console.warn('[HotRefreshManager] Error clearing URL params:', err);
  }
}

/**
 * 5. Global Event Bus for Hot Service & Component Re-rendering
 */
const HOT_REFRESH_EVENT = 'adam_hot_data_refresh';

export function triggerGlobalDataRefresh(category: string = 'ALL') {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(HOT_REFRESH_EVENT, { detail: { category, timestamp: Date.now() } });
  window.dispatchEvent(event);
}

export function useGlobalHotRefreshListener(onRefresh: (category: string) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ category: string; timestamp: number }>;
      onRefresh(customEvent.detail?.category || 'ALL');
    };
    window.addEventListener(HOT_REFRESH_EVENT, handler);
    return () => {
      window.removeEventListener(HOT_REFRESH_EVENT, handler);
    };
  }, [onRefresh]);
}
