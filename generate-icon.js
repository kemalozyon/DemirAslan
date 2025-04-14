const jimp = require('jimp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

// Function to convert existing PNG icon to ICO
async function convertExistingIconToIco() {
  try {
    const assetsDir = path.join(__dirname, 'assets');
    const pngPath = path.join(assetsDir, 'diamond.png');
    const icoPath = path.join(assetsDir, 'diamond.ico');
    
    console.log('Reading existing PNG icon from:', pngPath);
    
    // Check if the PNG exists
    if (!fs.existsSync(pngPath)) {
      throw new Error('diamond.png not found in assets directory');
    }
    
    // Read the PNG file
    const pngBuffer = fs.readFileSync(pngPath);
    
    // Convert PNG to ICO with multiple sizes
    const icoBuffer = await toIco(pngBuffer, {
      sizes: [16, 24, 32, 48, 64, 128, 256],
      resize: true
    });
    
    // Save ICO file
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('ICO icon created successfully at:', icoPath);
  } catch (err) {
    console.error('Error converting icon:', err);
  }
}

// Run the function to convert the icon
convertExistingIconToIco(); 