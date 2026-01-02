// Script to generate PWA icons from company logo
import supabase from './src/lib/supabaseClient';
import getCompanyData from './src/lib/getCompanyData';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { createCanvas, loadImage } from 'canvas';

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function generateIcon(imageBuffer, size, outputPath) {
  const img = await loadImage(imageBuffer);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw image centered and scaled
  const scale = Math.min(size / img.width, size / img.height) * 0.8;
  const x = (size - img.width * scale) / 2;
  const y = (size - img.height * scale) / 2;
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath}`);
}

async function main() {
  try {
    console.log('Fetching company data...');
    const company = await getCompanyData();
    
    if (!company || !company.logoUrl) {
      console.error('No company logo found. Using default icons.');
      return;
    }

    console.log('Downloading logo from:', company.logoUrl);
    const imageBuffer = await downloadImage(company.logoUrl);

    console.log('Generating PWA icons...');
    await generateIcon(imageBuffer, 192, './public/icon-192.png');
    await generateIcon(imageBuffer, 512, './public/icon-512.png');

    console.log('PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
