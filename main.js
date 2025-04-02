const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

// Set up a file path for storing the color schemes
const schemesFilePath = path.join(app.getPath('userData'), 'color-schemes.json');
// Set up a file path for storing the default scheme name
const defaultSchemeFilePath = path.join(app.getPath('userData'), 'default-scheme.json');

// Load saved schemes from file
function loadSavedSchemes() {
  try {
    if (fs.existsSync(schemesFilePath)) {
      const data = fs.readFileSync(schemesFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load schemes:', err);
  }
  return {};
}

// Save schemes to file
function saveSchemes(schemes) {
  try {
    fs.writeFileSync(schemesFilePath, JSON.stringify(schemes, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save schemes:', err);
  }
}

// Load default scheme name
function loadDefaultSchemeName() {
  try {
    if (fs.existsSync(defaultSchemeFilePath)) {
      const data = fs.readFileSync(defaultSchemeFilePath, 'utf8');
      return JSON.parse(data).defaultScheme;
    }
  } catch (err) {
    console.error('Failed to load default scheme:', err);
  }
  return null;
}

// Save default scheme name
function saveDefaultSchemeName(schemeName) {
  try {
    fs.writeFileSync(defaultSchemeFilePath, JSON.stringify({ defaultScheme: schemeName }, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save default scheme:', err);
  }
}

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
let currentTheme = 'light';
// Store custom colors for the display
let displayColors = {
  bgColor: '#ffffff',
  titleColor: '#b71c1c',
  textColor: '#000000',
  shadowColor: '#b71c1c',
  boxColor: '#f5f5f5',
  showTitle: true
};

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1200,
    minWidth: 800,
    minHeight: 1000,
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
  
  // Send initial settings when main window is loaded
  mainWindow.webContents.on('did-finish-load', () => {
    // Send current colors
    mainWindow.webContents.send('current-display-colors', displayColors);
    
    // Send default scheme name if exists
    const defaultSchemeName = loadDefaultSchemeName();
    if (defaultSchemeName) {
      mainWindow.webContents.send('default-scheme-name', defaultSchemeName);
    }
    
    console.log('Main window loaded, initial settings sent');
  });
  
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
    console.log('Display window loaded, sending colors:', displayColors);
    displayWindow.webContents.send('current-display-colors', displayColors);
    
    // Also send default scheme name for UI updates
    const defaultSchemeName = loadDefaultSchemeName();
    if (defaultSchemeName) {
      mainWindow.webContents.send('default-scheme-loaded', defaultSchemeName);
    }
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
  // First load default scheme if exists
  const defaultSchemeName = loadDefaultSchemeName();
  if (defaultSchemeName) {
    const savedSchemes = loadSavedSchemes();
    const defaultScheme = savedSchemes[defaultSchemeName];
    if (defaultScheme) {
      // Apply default colors
      displayColors = { ...displayColors, ...defaultScheme };
      console.log('Applied default scheme:', defaultSchemeName);
    }
  }
  
  // Then create windows with the default colors already set
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
      // When showing the display, make sure it has the current colors
      displayWindow.show();
      displayWindow.setFullScreen(true);
      
      // Re-send the current colors to ensure they're applied
      console.log('Sending current colors to display on show:', displayColors);
      displayWindow.webContents.send('update-display-colors', displayColors);
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
  console.log('Updating display colors:', colors);
  
  // Update stored colors
  displayColors = { ...displayColors, ...colors };
  
  // Send colors to display window
  if (displayWindow) {
    displayWindow.webContents.send('update-display-colors', displayColors);
    console.log('Colors sent to display window');
  } else {
    console.log('Display window not available');
  }
  
  // Send confirmation back to main window
  if (mainWindow) {
    mainWindow.webContents.send('colors-updated-confirmation', true);
  }
});

// Save color scheme
ipcMain.on('save-color-scheme', (event, { name, scheme }) => {
  // Store the scheme
  const savedSchemes = loadSavedSchemes();
  savedSchemes[name] = scheme;
  saveSchemes(savedSchemes);
  
  // Send updated schemes list back
  if (mainWindow) {
    mainWindow.webContents.send('saved-schemes', Object.keys(savedSchemes));
  }
});

// Load color scheme
ipcMain.on('load-color-scheme', (event, schemeName) => {
  const savedSchemes = loadSavedSchemes();
  const scheme = savedSchemes[schemeName];
  
  if (scheme) {
    // Update the current display colors
    displayColors = { ...displayColors, ...scheme };
    
    // Send to main window
    if (mainWindow) {
      mainWindow.webContents.send('color-scheme-loaded', scheme);
    }
    
    // Send to display window
    if (displayWindow) {
      displayWindow.webContents.send('update-display-colors', displayColors);
    }
  }
});

// Delete color scheme
ipcMain.on('delete-color-scheme', (event, schemeName) => {
  const savedSchemes = loadSavedSchemes();
  
  if (savedSchemes[schemeName]) {
    delete savedSchemes[schemeName];
    saveSchemes(savedSchemes);
    
    // Send updated schemes list back
    if (mainWindow) {
      mainWindow.webContents.send('saved-schemes', Object.keys(savedSchemes));
    }
  }
});

// Get all saved schemes
ipcMain.on('get-saved-schemes', (event) => {
  const savedSchemes = loadSavedSchemes();
  
  if (mainWindow) {
    mainWindow.webContents.send('saved-schemes', Object.keys(savedSchemes));
  }
});

// Set default color scheme
ipcMain.on('set-default-scheme', (event, schemeName) => {
  console.log('Setting default scheme:', schemeName);
  saveDefaultSchemeName(schemeName);
  
  // Also apply the scheme immediately
  const savedSchemes = loadSavedSchemes();
  const scheme = savedSchemes[schemeName];
  
  if (scheme) {
    // Update the current display colors
    displayColors = { ...displayColors, ...scheme };
    
    // Send to display window if it exists
    if (displayWindow) {
      displayWindow.webContents.send('update-display-colors', displayColors);
    }
  }
  
  // Send confirmation to main window
  if (mainWindow) {
    mainWindow.webContents.send('default-scheme-set', schemeName);
  }
});

// Get default scheme name
ipcMain.on('get-default-scheme', (event) => {
  const defaultSchemeName = loadDefaultSchemeName();
  
  if (mainWindow && defaultSchemeName) {
    mainWindow.webContents.send('default-scheme-name', defaultSchemeName);
  }
}); 