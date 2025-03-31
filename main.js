const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// Handle Windows-specific installation events
if (process.platform === 'win32') {
  const windowsInstaller = require('./windows-installer');
  if (windowsInstaller.handleSquirrelEvent()) {
    // If this is a Squirrel.Windows event, we're done
    return;
  }
}

// Handle regular app startup with electron-squirrel-startup
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep global references of the window objects to prevent garbage collection
let mainWindow;
let displayWindow;
let currentTheme = 'dark';
// Store custom colors for the display
let displayColors = {
  bgColor: '#000000',
  titleColor: '#ffd700',
  textColor: '#ffffff',
  shadowColor: '#ffd700',
  boxColor: '#333333',
  showTitle: true
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createDisplayWindow() {
  displayWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,
    fullscreen: true,
    backgroundColor: '#000000'
  });

  displayWindow.loadFile('display.html');

  // Hide the display window initially
  displayWindow.hide();

  // Send current display colors after the display window is fully loaded
  displayWindow.webContents.on('did-finish-load', () => {
    displayWindow.webContents.send('current-display-colors', displayColors);
  });

  // Handle ESC key to exit fullscreen
  displayWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      if (displayWindow.isFullScreen()) {
        displayWindow.setFullScreen(false);
      }
      event.preventDefault();
      return true;
    }
  });

  // Handle F key to toggle fullscreen
  displayWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'f' || input.key === 'F') {
      displayWindow.setFullScreen(!displayWindow.isFullScreen());
      event.preventDefault();
      return true;
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createMainWindow();
  createDisplayWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createDisplayWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle price updates from the main window
ipcMain.on('update-prices', (event, prices) => {
  console.log('Received prices in main:', prices);
  if (displayWindow) {
    displayWindow.webContents.send('display-updated', prices);
  }
});

// Handle theme changes
ipcMain.on('theme-change', (event, theme) => {
  currentTheme = theme;
  if (displayWindow) {
    displayWindow.webContents.send('theme-changed', theme);
  }
});

// Handle display theme changes
ipcMain.on('display-theme-change', (event, theme) => {
  if (displayWindow) {
    displayWindow.webContents.send('theme-changed', theme);
  }
});

// Handle display visibility toggle
ipcMain.on('toggle-display', (event, isVisible) => {
  if (displayWindow) {
    if (isVisible) {
      displayWindow.show();
      displayWindow.setFullScreen(true);
    } else {
      displayWindow.hide();
    }
  }
});

// Error handling for the display window
ipcMain.on('display-error', (event, error) => {
  console.error('Display error:', error);
  // You can add additional error handling here if needed
});

// Get display colors
ipcMain.on('get-display-colors', (event) => {
  if (mainWindow) {
    mainWindow.webContents.send('current-display-colors', displayColors);
  }
});

// Update display colors
ipcMain.on('update-display-colors', (event, colors) => {
  // Update stored colors
  displayColors = { ...displayColors, ...colors };
  
  // Send colors to display window
  if (displayWindow) {
    displayWindow.webContents.send('update-display-colors', displayColors);
  }
}); 