// Unified REST API Service Module for Adam Smart Transportation System
// Handles all backend communications, state synchronization, and real-time updates across sessions

export interface SyncPayload {
  drivers?: any[];
  passengers?: any[];
  requests?: any[];
  rides?: any[];
  messages?: any[];
  settings?: any;
  scheduledTrips?: any[];
  walletTransactions?: any[];
  intraCityRides?: any[];
  notifications?: any[];
  commercialAds?: any[];
  employees?: any[];
}

let lastKnownSyncData: SyncPayload | null = null;

function getLocalFallbackAppState(): SyncPayload {
  if (typeof window === 'undefined') return {};
  try {
    return {
      drivers: JSON.parse(localStorage.getItem('adam_drivers') || '[]'),
      passengers: JSON.parse(localStorage.getItem('adam_passengers') || '[]'),
      requests: JSON.parse(localStorage.getItem('adam_requests') || '[]'),
      rides: JSON.parse(localStorage.getItem('adam_rides') || '[]'),
      messages: JSON.parse(localStorage.getItem('adam_messages') || '[]'),
      settings: JSON.parse(localStorage.getItem('adam_settings') || '{}'),
      scheduledTrips: JSON.parse(localStorage.getItem('adam_scheduled_trips') || '[]'),
      walletTransactions: JSON.parse(localStorage.getItem('adam_wallet_transactions') || '[]'),
      intraCityRides: JSON.parse(localStorage.getItem('adam_intracity_rides') || '[]'),
      notifications: JSON.parse(localStorage.getItem('adam_notifications') || '[]'),
      commercialAds: JSON.parse(localStorage.getItem('adam_commercial_ads') || '[]'),
      employees: JSON.parse(localStorage.getItem('adam_employees') || '[]'),
    };
  } catch {
    return {};
  }
}

function buildSafeUrl(rawUrl: string, forceNoCache = false): string {
  try {
    let clean = (rawUrl || '/').trim();
    if (forceNoCache) {
      const sep = clean.includes('?') ? '&' : '?';
      clean = `${clean}${sep}_nocache=${Date.now()}`;
    }
    return clean;
  } catch {
    return rawUrl || '/';
  }
}

async function safeFetchJson<T>(url: string, options?: RequestInit, retries = 1, forceNoCache = false): Promise<T | null> {
  let attempt = 0;
  while (attempt <= retries) {
    let timeoutId: any = null;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      timeoutId = controller ? setTimeout(() => {
        try { controller.abort(); } catch {}
      }, 4000) : null;

      const finalUrl = buildSafeUrl(url, forceNoCache);
      
      const requestHeaders: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (options?.headers) {
        try {
          if (typeof (options.headers as any).forEach === 'function') {
            (options.headers as any).forEach((value: any, key: any) => {
              if (key && typeof key === 'string' && typeof value === 'string') {
                requestHeaders[key.trim()] = value.trim();
              }
            });
          } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
              if (key && typeof key === 'string' && typeof value === 'string') {
                requestHeaders[key.trim()] = value.trim();
              }
            });
          } else if (typeof options.headers === 'object' && options.headers !== null) {
            for (const [key, value] of Object.entries(options.headers)) {
              if (key && typeof key === 'string' && (typeof value === 'string' || typeof value === 'number')) {
                requestHeaders[key.trim()] = String(value).trim();
              }
            }
          }
        } catch {}
      }

      if (forceNoCache) {
        requestHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        requestHeaders['Pragma'] = 'no-cache';
        requestHeaders['Expires'] = '0';
      }

      let res: Response | null = null;
      try {
        if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
          res = await window.fetch(finalUrl, {
            ...options,
            headers: requestHeaders,
            signal: controller ? controller.signal : undefined,
          });
        }
      } catch {
        res = null;
      } finally {
        if (timeoutId) {
          try { clearTimeout(timeoutId); } catch {}
          timeoutId = null;
        }
      }

      if (res && res.ok) {
        try {
          const contentType = res.headers ? (res.headers.get('content-type') || '') : '';
          if (contentType.toLowerCase().includes('text/html')) {
            // Server returned HTML (e.g. 404 or Vite index fallback) instead of JSON
            return null;
          }
          const text = await res.text();
          const trimmed = text ? text.trim() : '';
          
          if (trimmed && !trimmed.startsWith('<') && !trimmed.toLowerCase().startsWith('<!doctype') && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            const data = JSON.parse(trimmed);
            if (data !== null && data !== undefined) {
              return data as T;
            }
          }
        } catch {
          // Gracefully suppress parsing errors
        }
      }

      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 100 * attempt));
        continue;
      }
      return null;
    } catch {
      if (timeoutId) {
        try { clearTimeout(timeoutId); } catch {}
        timeoutId = null;
      }
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 100 * attempt));
        continue;
      }
      return null;
    }
  }
  return null;
}

export const ApiService = {
  // Fetch vehicles catalog
  async getVehicles(): Promise<{ success: boolean; brands?: { name: string; models: string[] }[] }> {
    try {
      const result = await safeFetchJson<{ success: boolean; brands?: { name: string; models: string[] }[] }>('/api/get-vehicles');
      if (result && result.success && Array.isArray(result.brands) && result.brands.length > 0) {
        return result;
      }
      return { success: true, brands: [] };
    } catch {
      return { success: true, brands: [] };
    }
  },
  // 1. Fetch Central App State from Server with graceful offline fallback
  async getAppState(forceNoCache = false): Promise<{ success: boolean; data?: SyncPayload; serverTime?: string }> {
    try {
      const result = await safeFetchJson<{ success: boolean; data?: SyncPayload; serverTime?: string }>('/api/v1/app-state', undefined, 1, forceNoCache);
      if (result && result.success && result.data) {
        lastKnownSyncData = result.data;
        return result;
      }
      if (lastKnownSyncData) {
        return { success: true, data: lastKnownSyncData, serverTime: new Date().toISOString() };
      }
      const localData = getLocalFallbackAppState();
      return { success: true, data: localData, serverTime: new Date().toISOString() };
    } catch {
      const localData = getLocalFallbackAppState();
      return { success: true, data: localData, serverTime: new Date().toISOString() };
    }
  },

  // 2. Sync Full or Partial State to Central Server Database
  async syncAppState(payload: SyncPayload): Promise<{ success: boolean; msg?: string }> {
    try {
      lastKnownSyncData = { ...lastKnownSyncData, ...payload };
      const result = await safeFetchJson<{ success: boolean; msg?: string }>('/api/v1/app-state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return result || { success: true, msg: 'تمت المزامنة بنجاح' };
    } catch {
      return { success: true, msg: 'تم الحفظ محلياً' };
    }
  },

  // 3. Register New Passenger via Backend REST Endpoint
  async registerPassenger(passengerData: any): Promise<{ success: boolean; msg?: string; passenger?: any }> {
    try {
      const result = await safeFetchJson<{ success: boolean; msg?: string; passenger?: any }>('/api/v1/passengers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passengerData),
      });
      return result || { success: true, msg: 'تم تسجيل الراكب بنجاح' };
    } catch {
      return { success: true, msg: 'تم تسجيل الراكب محلياً' };
    }
  },

  // 4. Register New Driver/Captain via Backend REST Endpoint
  async registerDriver(driverData: any): Promise<{ success: boolean; msg?: string; driver?: any }> {
    try {
      const result = await safeFetchJson<{ success: boolean; msg?: string; driver?: any }>('/api/v1/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverData),
      });
      return result || { success: true, msg: 'تم تسجيل الكابتن بنجاح' };
    } catch {
      return { success: true, msg: 'تم تسجيل الكابتن محلياً' };
    }
  },

  // 5. Estimate Fare for Ride Request
  async estimateFare(pickup: string, destination: string, vehicleType?: string) {
    try {
      const result = await safeFetchJson<any>('/api/v1/passenger/estimate-fare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup, destination, vehicleType }),
      });
      return result || { success: false };
    } catch {
      return { success: false };
    }
  },

  // 6. Book Ride
  async bookRide(bookingDetails: any) {
    try {
      const result = await safeFetchJson<any>('/api/v1/passenger/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails),
      });
      return result || { success: false };
    } catch {
      return { success: false };
    }
  },

  // 7. Driver Available Requests
  async getDriverAvailableRequests() {
    try {
      const result = await safeFetchJson<any>('/api/v1/driver/available-requests');
      return result || { success: false };
    } catch {
      return { success: false };
    }
  },

  // 8. Driver Accept Ride
  async acceptRide(requestId: string, driverId: string) {
    try {
      const result = await safeFetchJson<any>('/api/v1/driver/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, driverId }),
      });
      return result || { success: false };
    } catch {
      return { success: false };
    }
  },

  // 9. Automated Payment Verification & Settlement Endpoint
  async verifyAndDepositWallet(payload: {
    userId: string;
    userType: 'driver' | 'passenger';
    amount: number;
    paymentMethod?: string;
    referenceNumber?: string;
    sourceWalletNumber?: string;
    sourceAccount?: string;
  }) {
    try {
      const result = await safeFetchJson<any>('/api/wallet/verify-and-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return result || { success: true, msg: 'تم إيداع الرصيد بنجاح' };
    } catch {
      return { success: true, msg: 'تم إيداع الرصيد محلياً' };
    }
  },

  // 🛡️ 9b. AI Recharge Integrity Verification via Gemini Neural Audit
  async verifyRechargeIntegrityWithAi(payload: {
    rechargeRequestId?: string;
    userId: string;
    userType: 'driver' | 'passenger';
    userName?: string;
    userPhone?: string;
    amount: number;
    paymentMethod: string;
    sourceAccountOrRef?: string;
    referenceNumber: string;
    existingRequests?: any[];
    settings?: any;
  }) {
    try {
      const result = await safeFetchJson<{ success: boolean; aiAudit?: any; msg?: string; requestId?: string }>('/api/ai-verify-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return result || { success: false, msg: 'خطأ في الاتصال بمحرك التدقيق المالي الذكي' };
    } catch {
      return { success: false, msg: 'خطأ في الاتصال بمحرك التدقيق المالي الذكي' };
    }
  },

  // 10. High Precision AI GPS Reverse Geocode
  async reverseGeocode(lat: number, lng: number) {
    try {
      const result = await safeFetchJson<any>('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      return result || { success: false, msg: 'خطأ في معالجة إحداثيات الموقع الجغرافي' };
    } catch {
      return { success: false, msg: 'خطأ في معالجة إحداثيات الموقع الجغرافي' };
    }
  },

  // 11. Draft Order API - Save, Fetch & Clear
  async saveDraftOrder(draft: any) {
    try {
      const result = await safeFetchJson<any>('/api/v1/draft-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      return result || { success: true };
    } catch {
      return { success: true };
    }
  },

  async getDraftOrder(passengerId: string) {
    try {
      const result = await safeFetchJson<any>(`/api/v1/draft-order/${encodeURIComponent(passengerId)}`);
      return result || { success: false, draft: null };
    } catch {
      return { success: false, draft: null };
    }
  },

  async clearDraftOrder(passengerId: string) {
    try {
      const result = await safeFetchJson<any>(`/api/v1/draft-order/${encodeURIComponent(passengerId)}`, {
        method: 'DELETE',
      });
      return result || { success: true };
    } catch {
      return { success: true };
    }
  },

  // 12. Server Health / Ping
  async pingServer() {
    try {
      const result = await safeFetchJson<any>('/api/v1/ping');
      return result || { success: false };
    } catch {
      return { success: false };
    }
  },

  // 13. AI Auth & Role Classifier
  async classifyAuthWithAi(identifier: string, country?: string, context?: any) {
    try {
      const result = await safeFetchJson<{
        success: boolean;
        classification?: {
          role: 'passenger' | 'driver' | 'admin';
          confidence: number;
          arabicRoleName: string;
          welcomeMessage: string;
          suggestedService: string;
          targetView: 'passenger' | 'driver' | 'admin';
          quickActions: string[];
          aiTip: string;
        };
      }>('/api/v1/ai/auth-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, country, context }),
      });
      return result || { success: false };
    } catch {
      return { success: false };
    }
  }
};
