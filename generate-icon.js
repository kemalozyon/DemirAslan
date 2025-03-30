const jimp = require('jimp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

// Function to create a simple icon
async function generateIcon() {
  try {
    // Create a new image with blue background
    const image = await jimp.create(256, 256, 0x3498dbff);
    
    // Add text "DA" to the image
    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    image.print(
      font,
      0,
      0,
      {
        text: 'DA',
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
      },
      256,
      256
    );
    
    // Save as PNG first
    const pngPath = path.join(__dirname, 'build', 'icon.png');
    await image.writeAsync(pngPath);
    console.log('PNG icon created successfully!');
    
    // Convert PNG to ICO
    const pngBuffer = fs.readFileSync(pngPath);
    const icoBuffer = await toIco(pngBuffer);
    
    // Save ICO file
    fs.writeFileSync(path.join(__dirname, 'build', 'icon.ico'), icoBuffer);
    console.log('ICO icon created successfully!');
  } catch (err) {
    console.error('Error generating icon:', err);
  }
}

// Run the function
generateIcon(); 