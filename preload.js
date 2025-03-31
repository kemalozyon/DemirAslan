// Preload script for the Electron application
// This file runs before the renderer process is loaded

// All of the Node.js APIs are available in the preload process
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});

// Remove the old event listener
window.removeEventListener('DOMContentLoaded', () => {
  const appVersion = process.env.npm_package_version || '1.0.0';
  document.getElementById('app-version')?.setAttribute('data-version', appVersion);
}); 