const fs = require('fs');
const path = require('path');
const { toSfnt } = require('woff-tools');
const wawoff2 = require('wawoff2');

async function run() {
  const inputPath = path.join(__dirname, '../app/fonts/Juache.woff');
  const outputPath = path.join(__dirname, '../app/fonts/Juache.woff2');

  console.log('Reading WOFF font...', inputPath);
  if (!fs.existsSync(inputPath)) {
    console.error('Error: input path does not exist:', inputPath);
    return;
  }
  const woffBuffer = fs.readFileSync(inputPath);

  console.log('Converting WOFF to TTF...');
  const ttfBuffer = toSfnt(woffBuffer);

  console.log('Compressing TTF to WOFF2...');
  const woff2Buffer = await wawoff2.compress(ttfBuffer);

  fs.writeFileSync(outputPath, woff2Buffer);
  console.log('Successfully saved WOFF2 font to:', outputPath);
  console.log('WOFF Size:', woffBuffer.length, 'bytes');
  console.log('WOFF2 Size:', woff2Buffer.length, 'bytes');
}

run().catch(console.error);
