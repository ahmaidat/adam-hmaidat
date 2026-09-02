/**
 * High-Security Universal Storage Adapter (Safe Storage)
 * Ensures 100% resilient storage across all browsers including:
 * - Safari Private Browsing (where localStorage throws QUOTA_EXCEEDED_ERR or SecurityError)
 * - iOS WebKit & in-app webviews (Instagram, Facebook, TikTok, Line)
 * - Chrome Incognito & Firefox Strict Enhanced Tracking Protection
 * - Fallbacks dynamically to in-memory store if localStorage is blocked or unavailable
 */

class SafeStorageAdapter {
  private memoryStore: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean = false;
  private isSessionStorageAvailable: boolean = false;

  constructor() {
    this.checkAvailability();
  }

  private checkAvailability() {
    if (typeof window === 'undefined') return;

    // Test localStorage with actual write/read/remove cycle
    try {
      const testKey = '__adam_storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch {
      this.isLocalStorageAvailable = false;
    }

    // Test sessionStorage
    try {
      const testKey = '__adam_session_test__';
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      this.isSessionStorageAvailable = true;
    } catch {
      this.isSessionStorageAvailable = false;
    }
  }

  getItem(key: string): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      } catch {
        // Fallback to memory
      }
    }
    return this.memoryStore.get(key) || null;
  }

  setItem(key: string, value: string): void {
    // Always keep in memory store as immediate backup
    this.memoryStore.set(key, value);

    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        // On Safari private quota exceed, suppress error and rely on memory
        console.warn(`[SafeStorage] localStorage quota/security fallback for "${key}":`, e);
      }
    }
  }

  removeItem(key: string): void {
    this.memoryStore.delete(key);
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }

  clear(): void {
    this.memoryStore.clear();
    if (this.isLocalStorageAvailable) {
      try {
        window.localStorage.clear();
      } catch {}
    }
  }

  get length(): number {
    if (this.isLocalStorageAvailable) {
      try {
        return window.localStorage.length;
      } catch {}
    }
    return this.memoryStore.size;
  }

  key(index: number): string | null {
    if (this.isLocalStorageAvailable) {
      try {
        return window.localStorage.key(index);
      } catch {}
    }
    const keys = Array.from(this.memoryStore.keys());
    return keys[index] || null;
  }
}

export const safeStorage = new SafeStorageAdapter();
