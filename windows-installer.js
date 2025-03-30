// Windows installer events handling
// This is used during Windows installation to set up shortcuts and handle events
const { app } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

module.exports = {
  handleSquirrelEvent: function() {
    if (process.platform !== 'win32') {
      return false;
    }

    const ChildProcess = require('child_process');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    const spawn = function(command, args) {
      let spawnedProcess;

      try {
        spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
      } catch (error) {
        console.warn('Error spawning process:', error);
      }
      
      return spawnedProcess;
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Create desktop and start menu shortcuts
        spawn(updateDotExe, [
          '--createShortcut',
          exeName
        ]);
        setTimeout(app.quit, 1000);
        return true;

      case '--squirrel-uninstall':
        // Remove desktop and start menu shortcuts
        spawn(updateDotExe, [
          '--removeShortcut',
          exeName
        ]);
        setTimeout(app.quit, 1000);
        return true;

      case '--squirrel-obsolete':
        // This is called when old version is replaced with a new one
        app.quit();
        return true;
    }
    
    return false;
  }
}; 