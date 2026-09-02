// Real-Time Infrastructure Service for Adam Smart Transportation
// Manages WebSocket connections, Server-Sent Events (SSE), and real-time AI dispatch streaming

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'sse_active';

export interface DriverLocationPayload {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface AiDispatchEvent {
  payload: any;
  aiRecommendation?: string;
  timestamp: string;
}

type EventCallback = (data: any) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private status: RealtimeStatus = 'offline';
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 2000;
  private sseEventSource: EventSource | null = null;
  private isConnected = false;

  constructor() {
    // Auto-initialize connection when in browser
    if (typeof window !== 'undefined') {
      // Lazy connection
    }
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (typeof WebSocket === 'undefined') {
      this.startSseFallback();
      return;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      if (!window.location || !window.location.host || window.location.host === 'null' || window.location.protocol === 'about:' || window.location.protocol === 'blob:') {
        this.startSseFallback();
        return;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/realtime`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.emit('connection_change', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch {
          // Ignore non-json or malformed message
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose and fallback
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.handleReconnectOrFallback();
      };
    } catch {
      this.handleReconnectOrFallback();
    }
  }

  private handleReconnectOrFallback(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setStatus('reconnecting');
      const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1), 15000);
      setTimeout(() => this.connect(), delay);
    } else {
      this.startSseFallback();
    }
  }

  private startSseFallback(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.sseEventSource) return;

    try {
      const sseUrl = '/api/v1/realtime/sse';
      this.sseEventSource = new EventSource(sseUrl);
      
      this.sseEventSource.onopen = () => {
        this.setStatus('sse_active');
        this.emit('connection_change', { status: 'sse_active' });
      };

      this.sseEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch {
          // Ignore malformed SSE payload
        }
      };

      this.sseEventSource.onerror = () => {
        this.setStatus('offline');
        this.emit('connection_change', { status: 'offline' });
      };
    } catch {
      this.setStatus('offline');
    }
  }

  private handleIncomingMessage(data: any): void {
    if (!data || !data.type) return;

    // Route event to specific listeners
    this.emit(data.type, data);

    // Also emit generic message event
    this.emit('*', data);
  }

  public sendDriverLocation(location: DriverLocationPayload): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'DRIVER_LOCATION_UPDATE',
        ...location
      }));
    } else {
      // REST API fallback
      fetch('/api/v1/realtime/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'LIVE_DRIVER_LOCATION',
          payload: location
        })
      }).catch(err => console.error('[Realtime Infrastructure] Location send error:', err));
    }
  }

  public requestAiDispatch(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'AI_DISPATCH_REQUEST',
        payload
      }));
    } else {
      fetch('/api/ai-booking-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTrips: [payload] })
      }).catch(err => console.error('[Realtime Infrastructure] AI Dispatch error:', err));
    }
  }

  public syncAppState(appState: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SYNC_APP_STATE',
        payload: appState
      }));
    }
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[Realtime Infrastructure] Error in event listener '${event}':`, e);
        }
      });
    }
  }

  private setStatus(newStatus: RealtimeStatus): void {
    this.status = newStatus;
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  public isLiveConnected(): boolean {
    return this.status === 'connected' || this.status === 'sse_active';
  }
}

export const realtimeService = new RealtimeService();
