# Demir Aslan

A simple Electron desktop application.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/demiraslan.git

# Go into the repository
cd demiraslan

# Install dependencies
npm install
```

## Usage

```bash
# Run the app
npm start

# Run the app in development mode
npm run dev
```

## Building Executables

### Windows (.exe)
```bash
# Build Windows installer
npm run build

# Build portable Windows version (no installation required)
npm run build:portable
```

The build process will create:
- `dist/Demir Aslan-Setup-1.0.0.exe` - Windows installer
- `dist/Demir Aslan-Portable-1.0.0.exe` - Portable application

### macOS (.app)
```bash
# Build for macOS
npm run build:mac
```

### Build for all platforms
```bash
# Build for Windows and macOS
npm run build:all
```

After building, the executable files will be available in the `dist` folder.

## For Windows Users

### Requirements
- Windows 7 or later
- 64-bit operating system

### Installation Options
1. **Standard Installation**: Run the `Demir Aslan-Setup-1.0.0.exe` installer and follow the prompts. This will create shortcuts in the Start Menu and Desktop.
2. **Portable Use**: Run the `Demir Aslan-Portable-1.0.0.exe` file directly without installation.

## Features

- Simple UI with a greeting button
- Random messages displayed when clicking the button
- Windows-compatible installers
- Portable version available

## License

ISC 