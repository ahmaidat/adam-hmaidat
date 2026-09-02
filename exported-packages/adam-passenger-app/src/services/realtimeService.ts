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
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/realtime`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('⚡ [Realtime Infrastructure] Connected to WebSocket Server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.emit('connection_change', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.error('[Realtime Infrastructure] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[Realtime Infrastructure] WebSocket error, attempting fallback:', error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('[Realtime Infrastructure] Connection closed.');
        this.handleReconnectOrFallback();
      };
    } catch (err) {
      console.error('[Realtime Infrastructure] Error creating WebSocket:', err);
      this.handleReconnectOrFallback();
    }
  }

  private handleReconnectOrFallback(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setStatus('reconnecting');
      const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1), 15000);
      console.log(`[Realtime Infrastructure] Reconnecting in ${Math.round(delay / 1000)}s (Attempt ${this.reconnectAttempts})...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.warn('[Realtime Infrastructure] Max WS reconnects reached. Activating SSE Real-Time Fallback...');
      this.startSseFallback();
    }
  }

  private startSseFallback(): void {
    if (typeof window === 'undefined') return;
    if (this.sseEventSource) return;

    try {
      this.sseEventSource = new EventSource('/api/v1/realtime/sse');
      
      this.sseEventSource.onopen = () => {
        this.setStatus('sse_active');
        this.emit('connection_change', { status: 'sse_active' });
        console.log('📡 [Realtime Infrastructure] SSE Real-Time Stream Active');
      };

      this.sseEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.error('[Realtime Infrastructure] SSE parse error:', e);
        }
      };

      this.sseEventSource.onerror = () => {
        this.setStatus('offline');
        this.emit('connection_change', { status: 'offline' });
      };
    } catch (e) {
      console.error('[Realtime Infrastructure] SSE failed to start:', e);
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
