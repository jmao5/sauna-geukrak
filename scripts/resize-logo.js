const sharp = require('sharp');
const path = require('path');

const SOURCE = 'C:\\Users\\jsh\\.gemini\\antigravity\\brain\\58d4f784-8f92-4849-91fc-5026cd52291e\\sauna_geukrak_logo_1777275165471.png';
const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');
const FAVICON_DIR = path.resolve(__dirname, '..', 'public');

async function run() {
  // 512x512
  await sharp(SOURCE).resize(512, 512).png().toFile(path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('Created icon-512x512.png');

  // 192x192
  await sharp(SOURCE).resize(192, 192).png().toFile(path.join(ICONS_DIR, 'icon-192x192.png'));
  console.log('Created icon-192x192.png');

  // apple-touch-icon 180x180
  await sharp(SOURCE).resize(180, 180).png().toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // favicon.ico (32x32 png as ico)
  await sharp(SOURCE).resize(32, 32).png().toFile(path.join(FAVICON_DIR, 'favicon.ico'));
  console.log('Created favicon.ico');

  // app/favicon.ico
  await sharp(SOURCE).resize(32, 32).png().toFile(path.join(__dirname, '..', 'app', 'favicon.ico'));
  console.log('Created app/favicon.ico');
}

run().then(() => console.log('All done!')).catch(console.error);
