/**
 * Simple script to generate PNG icons from SVG
 * Uses a canvas approach with no external dependencies
 */

const fs = require('fs');
const path = require('path');

// Simple 1x1 PNG pixel data for emerald green (#059669)
// This creates a minimal valid PNG with the specified color
function createMinimalPNG(width, height, colorHex) {
  // Parse hex color
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);

  // Create a simple PNG signature and IHDR chunk
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // For simplicity, we'll create a solid color PNG
  // This is a minimal PNG structure - in production you'd want proper image generation
  
  // Create IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // Create IDAT chunk with compressed image data
  // For a solid color, we create a simple scanline
  const rowSize = width * 3 + 1; // +1 for filter byte
  const imageData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    imageData[y * rowSize] = 0; // filter byte (no filter)
    for (let x = 0; x < width; x++) {
      const offset = y * rowSize + 1 + x * 3;
      imageData[offset] = r;
      imageData[offset + 1] = g;
      imageData[offset + 2] = b;
    }
  }
  
  // Simple DEFLATE compression (raw data for now - browsers are lenient)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageData);
  const idatChunk = createChunk('IDAT', compressed);
  
  // Create IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  // Combine all chunks
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4);
  data.copy(chunk, 8);
  
  // Calculate CRC
  const crc = require('zlib').crc32(chunk.slice(4, 8 + data.length));
  chunk.writeUInt32BE(crc, 8 + data.length);
  
  return chunk;
}

// Generate icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create emerald green placeholder PNGs
// In production, you'd convert the SVG properly
const sizes = [192, 512];
const emeraldColor = '#059669';

sizes.forEach(size => {
  const pngBuffer = createMinimalPNG(size, size, emeraldColor);
  const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`Created ${outputPath}`);
});

console.log('Icon generation complete!');
