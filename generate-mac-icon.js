const jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

// Function to convert PNG to ICNS for macOS
async function generateMacIcon() {
  try {
    // Set up paths
    const assetsDir = path.join(__dirname, 'assets');
    const pngPath = path.join(assetsDir, 'diamond.png');
    const icnsPath = path.join(assetsDir, 'diamond.icns');
    const iconsetDir = path.join(assetsDir, 'diamond.iconset');
    
    console.log('Reading PNG icon from:', pngPath);
    
    // Check if the PNG exists
    if (!fs.existsSync(pngPath)) {
      throw new Error('diamond.png not found in assets directory');
    }
    
    // Create iconset directory if it doesn't exist
    if (!fs.existsSync(iconsetDir)) {
      fs.mkdirSync(iconsetDir);
    }
    
    // Load the PNG file
    const image = await jimp.read(pngPath);
    
    // Generate different icon sizes required for Mac iconset
    const sizes = [16, 32, 64, 128, 256, 512, 1024];
    for (const size of sizes) {
      const resized = image.clone().resize(size, size);
      const outFile = path.join(iconsetDir, `icon_${size}x${size}.png`);
      await resized.writeAsync(outFile);
      console.log(`Generated ${size}x${size} icon`);
      
      // Also generate @2x versions (retina display)
      if (size <= 512) {
        const retinaSize = size * 2;
        const retina = image.clone().resize(retinaSize, retinaSize);
        const retinaFile = path.join(iconsetDir, `icon_${size}x${size}@2x.png`);
        await retina.writeAsync(retinaFile);
        console.log(`Generated ${size}x${size}@2x icon (${retinaSize}x${retinaSize})`);
      }
    }
    
    // Use macOS iconutil to convert iconset to icns
    console.log('Converting iconset to icns...');
    childProcess.execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
    
    console.log('ICNS file created successfully at:', icnsPath);
    
    // Clean up the temporary iconset directory
    for (const size of sizes) {
      fs.unlinkSync(path.join(iconsetDir, `icon_${size}x${size}.png`));
      if (size <= 512) {
        fs.unlinkSync(path.join(iconsetDir, `icon_${size}x${size}@2x.png`));
      }
    }
    fs.rmdirSync(iconsetDir);
    console.log('Cleaned up temporary iconset directory');
    
  } catch (err) {
    console.error('Error generating macOS icon:', err);
  }
}

// Run the function
generateMacIcon(); 