// Draft Order & State Persistence Manager for Adam Transportation System
// Handles local & remote draft saving, auto-syncing, and top-level draft recovery

export interface PassengerDraftRequest {
  id?: string;
  passengerId: string;
  fromGov: string;
  fromDist: string;
  fromVillage: string;
  toGov: string;
  toDist: string;
  toVillage: string;
  companionCount: number;
  travelMode: 'intercity' | 'intracity';
  isAirportRide?: boolean;
  flightNumber?: string;
  luggageCount?: number;
  customNote?: string;
  promoCode?: string;
  estimatedPrice?: number;
  hasStopover?: boolean;
  stopoverGov?: string;
  stopoverDist?: string;
  stopoverVillage?: string;
  stopoverLandmark?: string;
  updatedAt: number;
}

const LOCAL_DRAFT_KEY = 'adam_passenger_draft_order';

export const DraftOrderManager = {
  // 1. Save Draft locally
  saveLocalDraft(draft: PassengerDraftRequest) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('[DraftManager] Failed to save local draft:', e);
    }
  },

  // 2. Read Draft locally
  getLocalDraft(): PassengerDraftRequest | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!raw) return null;
      const parsed: PassengerDraftRequest = JSON.parse(raw);
      // Valid draft must have at least fromGov or toGov
      if (parsed && (parsed.fromGov || parsed.toGov)) {
        return parsed;
      }
    } catch (e) {
      console.warn('[DraftManager] Failed to read local draft:', e);
    }
    return null;
  },

  // 3. Clear Local Draft
  clearLocalDraft() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    } catch {}
  },

  // 4. Save Draft to Server (Draft Order API)
  async saveServerDraft(draft: PassengerDraftRequest): Promise<{ success: boolean; msg?: string }> {
    // Also keep local copy updated
    this.saveLocalDraft(draft);
    try {
      const res = await fetch('/api/v1/draft-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          return JSON.parse(text);
        }
      }
    } catch (e) {
      // Offline or network error - local draft already saved
    }
    return { success: true, msg: 'Saved locally' };
  },

  // 5. Fetch Server Draft for Passenger (Initial Load Fetch)
  async fetchServerDraft(passengerId: string): Promise<PassengerDraftRequest | null> {
    try {
      const res = await fetch(`/api/v1/draft-order/${encodeURIComponent(passengerId)}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data.success && data.draft) {
            this.saveLocalDraft(data.draft);
            return data.draft;
          }
        }
      }
    } catch (e) {
      // Fallback to local draft
    }
    return this.getLocalDraft();
  },

  // 6. Delete Draft on Server & Local
  async clearServerDraft(passengerId: string): Promise<void> {
    this.clearLocalDraft();
    try {
      await fetch(`/api/v1/draft-order/${encodeURIComponent(passengerId)}`, {
        method: 'DELETE'
      });
    } catch {}
  }
};
