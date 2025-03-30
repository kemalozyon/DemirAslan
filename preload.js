// Preload script for the Electron application
// This file runs before the renderer process is loaded

// All of the Node.js APIs are available in the preload process
window.addEventListener('DOMContentLoaded', () => {
  // You can expose custom APIs to the renderer process here
  // For example, inject version information
  const appVersion = process.env.npm_package_version || '1.0.0';
  document.getElementById('app-version')?.setAttribute('data-version', appVersion);
  
  console.log('Preload script has loaded successfully');
}); 