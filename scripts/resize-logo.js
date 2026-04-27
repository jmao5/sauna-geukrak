const sharp = require('sharp');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', 'public', 'logo-source2.png');
const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');
const FAVICON_DIR = path.resolve(__dirname, '..', 'public');

async function run() {
  const metadata = await sharp(SOURCE).metadata();
  const { width, height } = metadata;

  // 1. 검정 테두리 선 제거
  const borderCrop = 30;
  const cleanWidth = width - borderCrop * 2;
  const cleanHeight = height - borderCrop * 2;

  const cleanBuffer = await sharp(SOURCE)
    .extract({
      left: borderCrop,
      top: borderCrop,
      width: cleanWidth,
      height: cleanHeight
    })
    .toBuffer();

  const cleanImage = sharp(cleanBuffer);

  // 앱 아이콘용 (테두리만 제거된 전체 로고)
  await cleanImage.clone().resize(512, 512).png().toFile(path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('Created icon-512x512.png (Full, Clean)');

  await cleanImage.clone().resize(192, 192).png().toFile(path.join(ICONS_DIR, 'icon-192x192.png'));
  console.log('Created icon-192x192.png (Full, Clean)');

  await cleanImage.clone().resize(180, 180).png().toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png (Full, Clean)');

  // 2. 파비콘용 (중앙 캐릭터 집중 크롭)
  // 테두리 제거된 이미지 기준 상단 70% 추출
  const favSize = Math.floor(cleanHeight * 0.7);
  const favLeft = Math.floor((cleanWidth - favSize) / 2);

  await cleanImage.clone()
    .extract({
      left: favLeft > 0 ? favLeft : 0,
      top: 0,
      width: favSize > cleanWidth ? cleanWidth : favSize,
      height: favSize
    })
    .resize(32, 32)
    .png()
    .toFile(path.join(FAVICON_DIR, 'favicon.ico'));
  console.log('Created favicon.ico (Cropped, Clean)');

  // app/favicon.ico 복사
  await cleanImage.clone()
    .extract({
      left: favLeft > 0 ? favLeft : 0,
      top: 0,
      width: favSize > cleanWidth ? cleanWidth : favSize,
      height: favSize
    })
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'app', 'favicon.ico'));
  console.log('Created app/favicon.ico (Cropped, Clean)');
}

run().then(() => console.log('Branding icons updated!')).catch(console.error);
