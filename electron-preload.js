/**
 * Electron Preload script for safe context isolation.
 * Bridges local node processes with the browser window environment securely.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC communication from renderer to main process
  triggerNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },
  
  // Custom listeners for dashboard remote triggers
  onClearSimulatedRides: (callback) => {
    ipcRenderer.on('clear-simulated-rides', () => callback());
  },
  
  onApproveAllPending: (callback) => {
    ipcRenderer.on('approve-all-pending', () => callback());
  }
});
