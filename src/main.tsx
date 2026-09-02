import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global iframe sandbox safety overrides & WebKit/Safari polyfill guards
declare global {
  interface Window {
    deferredPwaPrompt?: any;
  }
}

if (typeof window !== 'undefined') {
  // Capture PWA installation prompt (Chrome/Edge/Android & desktop)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPwaPrompt = e;
    console.log('📱 [PWA]: beforeinstallprompt event captured and stored.');
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
  });

  // Global safety trap for uncaught promise rejections on strict private browsers / Safari
  window.addEventListener('unhandledrejection', (event) => {
    // Gracefully catch background fetch / storage errors without freezing React render tree
    if (event.reason && typeof event.reason === 'object') {
      const msg = event.reason.message || String(event.reason);
      if (msg.includes('QuotaExceededError') || msg.includes('SecurityError') || msg.includes('AudioContext')) {
        console.warn('🛡️ [Browser Sandbox Protection]: Handled non-fatal security/quota rejection:', msg);
        event.preventDefault();
      }
    }
  });

  window.alert = function (message) {
    console.info('⚠️ [Captured Sandbox Alert]:', message);
  };
  window.confirm = function (message) {
    console.info('❓ [Captured Sandbox Confirm - Auto Assumed Yes]:', message);
    return true;
  };

  // Register PWA Service Worker (Safely checking protocol to support HTTPS & localhost)
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('🚀 [PWA ServiceWorker]: Registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('⚠️ [PWA ServiceWorker]: Registration skipped or failed:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

