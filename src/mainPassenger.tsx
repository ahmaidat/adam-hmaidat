import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StandalonePassenger } from './StandalonePassenger';
import './index.css';

// WebKit/Safari polyfill guards and service worker registration
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPwaPrompt = e;
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
  });

  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandalonePassenger />
  </StrictMode>
);
