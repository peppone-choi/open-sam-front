#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { stat } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const images = [
  'bg_fall.jpg',
  'bg_summer.jpg',
  'bg_winter.jpg',
  'bg_spring.jpg'
];

async function getFileSize(path) {
  const stats = await stat(path);
  return (stats.size / 1024).toFixed(2);
}

async function convertToWebP() {
  console.log('Converting background images to WebP...\n');
  
  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  
  for (const image of images) {
    const inputPath = join(publicDir, image);
    const outputPath = join(publicDir, image.replace('.jpg', '.webp'));
    
    try {
      const originalSize = await getFileSize(inputPath);
      totalOriginalSize += parseFloat(originalSize);
      
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);
      
      const webpSize = await getFileSize(outputPath);
      totalWebPSize += parseFloat(webpSize);
      
      const savings = ((1 - parseFloat(webpSize) / parseFloat(originalSize)) * 100).toFixed(1);
      
      console.log(`✓ ${image}`);
      console.log(`  Original: ${originalSize}KB → WebP: ${webpSize}KB (${savings}% smaller)\n`);
    } catch (error) {
      console.error(`✗ Failed to convert ${image}:`, error.message);
    }
  }
  
  const totalSavings = totalOriginalSize - totalWebPSize;
  const percentSavings = ((totalSavings / totalOriginalSize) * 100).toFixed(1);
  
  console.log('─'.repeat(50));
  console.log(`Total original size: ${totalOriginalSize.toFixed(2)}KB`);
  console.log(`Total WebP size: ${totalWebPSize.toFixed(2)}KB`);
  console.log(`Total savings: ${totalSavings.toFixed(2)}KB (${percentSavings}%)`);
}

convertToWebP().catch(console.error);
