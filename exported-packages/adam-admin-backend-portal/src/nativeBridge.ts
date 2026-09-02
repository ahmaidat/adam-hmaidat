/**
 * Adam Ride Platform - Unified Hybrid/Native Bridge Adapter
 * Provides a clean API interface for iOS, Android (Capacitor/Cordova) and Desktop (Electron) runtimes.
 * Supports automated fallback for traditional browsers.
 */

export interface NativeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  sound?: string;
  badge?: number;
}

class AdamNativeBridge {
  private isCapacitorActive: boolean;
  private isCordovaActive: boolean;
  private isElectronActive: boolean;

  constructor() {
    this.isCapacitorActive = typeof (window as any).Capacitor !== 'undefined';
    this.isCordovaActive = typeof (window as any).cordova !== 'undefined';
    this.isElectronActive = typeof navigator !== 'undefined' && 
      navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
  }

  /**
   * Detect current running platform
   */
  public getPlatform(): 'ios' | 'android' | 'electron' | 'web' {
    if (this.isCapacitorActive) {
      return (window as any).Capacitor.getPlatform() as 'ios' | 'android';
    }
    if (this.isElectronActive) {
      return 'electron';
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    
    return 'web';
  }

  /**
   * Request Native Push Notifications permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    const platform = this.getPlatform();
    
    if (this.isCapacitorActive) {
      try {
        const { PushNotifications } = (window as any).Capacitor.Plugins;
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
      } catch (err) {
        console.warn('Failed to request Capacitor push permissions, falling back:', err);
      }
    }

    if (this.isElectronActive || 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return true;
  }

  /**
   * Trigger Native or Local Push Notification
   */
  public async sendLocalNotification(payload: NativeNotificationPayload): Promise<void> {
    const platform = this.getPlatform();
    console.log(`[NativeBridge] Notification: ${payload.title} - ${payload.body}`);

    // 1. Capacitor Push Notification fallback
    if (this.isCapacitorActive) {
      try {
        const { LocalNotifications } = (window as any).Capacitor.Plugins;
        await LocalNotifications.schedule({
          notifications: [
            {
              title: payload.title,
              body: payload.body,
              id: Math.floor(Math.random() * 100000),
              extra: payload,
              smallIcon: 'ic_stat_icon_config_sample'
            }
          ]
        });
        return;
      } catch (e) {
        console.warn('Capacitor LocalNotifications failed, falling back:', e);
      }
    }

    // 2. Cordova Notification
    if (this.isCordovaActive && (window as any).navigator?.notification) {
      (window as any).navigator.notification.alert(
        payload.body,
        null,
        payload.title,
        'OK'
      );
      return;
    }

    // 3. Web browser standard notifications
    if (('Notification' in window) && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.ico'
      });
      return;
    }
  }

  /**
   * Get highly accurate native GPS location for driver/passenger tracking
   */
  public async getNativeLocation(): Promise<NativeLocation> {
    if (this.isCapacitorActive) {
      try {
        const { Geolocation } = (window as any).Capacitor.Plugins;
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        return {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
          accuracy: coordinates.coords.accuracy,
          timestamp: coordinates.timestamp
        };
      } catch (err) {
        console.warn('Capacitor Geolocation failed, trying standard HTML5:', err);
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by host system.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Native camera snap for verifying driver and rider identity photos
   */
  public async captureIdentityPhoto(): Promise<string> {
    if (this.isCapacitorActive) {
      try {
        const { Camera } = (window as any).Capacitor.Plugins;
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'dataUrl' // returns base64 string directly
        });
        return photo.dataUrl || '';
      } catch (e) {
        console.warn('Capacitor Camera failed, falling back to input upload:', e);
      }
    }
    return ''; // Web fallback returns empty to trigger the traditional input[type=file]
  }

  /**
   * Trigger native device haptic feedback on state changes (e.g., Ride accepted)
   */
  public triggerHapticFeedback(): void {
    if (this.isCapacitorActive) {
      try {
        const { Haptics } = (window as any).Capacitor.Plugins;
        Haptics.vibrate();
      } catch (e) {
        // Silently fail
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }
}

export const nativeBridge = new AdamNativeBridge();
