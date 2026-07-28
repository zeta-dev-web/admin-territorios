import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicBrand = path.join(root, 'public', 'brand')
const appDir = path.join(root, 'app')
const markPath = path.join(publicBrand, 'territorios-app-mark.svg')
const darkLogoPath = path.join(publicBrand, 'territorios-app-logo-dark.svg')
const lightLogoPath = path.join(publicBrand, 'territorios-app-logo-light.svg')

await mkdir(publicBrand, { recursive: true })

const markSvg = await readFile(markPath)

async function render(input, output, width, height) {
  await sharp(input)
    .resize({
      width,
      height,
      fit: 'contain',
    })
    .png()
    .toFile(output)
}

await Promise.all([
  render(markSvg, path.join(publicBrand, 'territorios-app-mark-1024.png'), 1024, 1024),
  render(markSvg, path.join(publicBrand, 'territorios-app-mark-512.png'), 512, 512),
  render(markSvg, path.join(publicBrand, 'territorios-app-mark-256.png'), 256, 256),
  render(markSvg, path.join(publicBrand, 'territorios-app-mark-128.png'), 128, 128),
  render(markSvg, path.join(publicBrand, 'icon-192.png'), 192, 192),
  render(markSvg, path.join(publicBrand, 'icon-512.png'), 512, 512),
  render(await readFile(darkLogoPath), path.join(publicBrand, 'territorios-app-logo-dark.png'), 1400, 330),
  render(await readFile(lightLogoPath), path.join(publicBrand, 'territorios-app-logo-light.png'), 1400, 330),
  render(markSvg, path.join(appDir, 'apple-icon.png'), 180, 180),
])

const faviconSizes = [16, 32, 48, 64]
const faviconImages = await Promise.all(
  faviconSizes.map((size) => sharp(markSvg).resize(size, size).png().toBuffer()),
)
const directorySize = 6 + faviconImages.length * 16
const header = Buffer.alloc(directorySize)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(faviconImages.length, 4)

let imageOffset = directorySize
faviconImages.forEach((image, index) => {
  const size = faviconSizes[index]
  const offset = 6 + index * 16
  header.writeUInt8(size, offset)
  header.writeUInt8(size, offset + 1)
  header.writeUInt8(0, offset + 2)
  header.writeUInt8(0, offset + 3)
  header.writeUInt16LE(1, offset + 4)
  header.writeUInt16LE(32, offset + 6)
  header.writeUInt32LE(image.length, offset + 8)
  header.writeUInt32LE(imageOffset, offset + 12)
  imageOffset += image.length
})
await writeFile(path.join(appDir, 'favicon.ico'), Buffer.concat([header, ...faviconImages]))

const encodedMark = markSvg.toString('base64')
const socialSvg = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="social-bg" x1="70" y1="30" x2="1130" y2="600" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10294A"/>
      <stop offset="0.55" stop-color="#081426"/>
      <stop offset="1" stop-color="#06101E"/>
    </linearGradient>
    <radialGradient id="social-glow" cx="0" cy="0" r="1" gradientTransform="translate(860 180) rotate(132) scale(460 420)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#20B8AE" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#20B8AE" stop-opacity="0"/>
    </radialGradient>
    <pattern id="social-grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#5DD9CF" stroke-opacity="0.065"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#social-bg)"/>
  <rect width="1200" height="630" rx="32" fill="url(#social-grid)"/>
  <rect width="1200" height="630" rx="32" fill="url(#social-glow)"/>
  <circle cx="1115" cy="60" r="220" fill="#3385F6" fill-opacity="0.10"/>
  <circle cx="1100" cy="600" r="280" fill="#20B8AE" fill-opacity="0.08"/>
  <image href="data:image/svg+xml;base64,${encodedMark}" x="86" y="82" width="150" height="150"/>
  <rect x="86" y="271" width="155" height="34" rx="17" fill="#20B8AE" fill-opacity="0.14" stroke="#5DD9CF" stroke-opacity="0.28"/>
  <text x="108" y="294" fill="#7CE8DF" font-family="Segoe UI, sans-serif" font-size="15" font-weight="700" letter-spacing="2.1">GESTIÓN SIMPLE</text>
  <text x="84" y="392" fill="#F8FAFC" font-family="Segoe UI, sans-serif" font-size="76" font-weight="760" letter-spacing="-2.5">Territorios</text>
  <text x="458" y="392" fill="#54D8D0" font-family="Segoe UI, sans-serif" font-size="76" font-weight="760" letter-spacing="-2.5">App</text>
  <text x="88" y="455" fill="#A9B8CA" font-family="Segoe UI, sans-serif" font-size="29" font-weight="450">Organiza grupos, asignaciones y avance territorial.</text>
  <g transform="translate(805 145)">
    <path d="M55 0H183V125H0V40C0 17.9 17.9 0 40 0H55Z" fill="#20B8AE" fill-opacity="0.90"/>
    <path d="M212 -18H360C393.1 -18 420 8.9 420 42V125H212V-18Z" fill="#3385F6" fill-opacity="0.94"/>
    <path d="M0 154H183V354H55C24.6 354 0 329.4 0 299V154Z" fill="#5DD9CF" fill-opacity="0.88"/>
    <path d="M212 154H420V294C420 327.1 393.1 354 360 354H212V154Z" fill="#1D5FA8" fill-opacity="0.95"/>
    <path d="M68 290C77 231 135 230 180 190C238 138 229 79 302 46" stroke="white" stroke-width="18" stroke-linecap="round" stroke-dasharray="1 34"/>
    <circle cx="68" cy="290" r="18" fill="white"/>
    <path d="M352 22C352 70 296 130 296 130C296 130 240 70 240 22C240 -9 265 -34 296 -34C327 -34 352 -9 352 22Z" fill="white"/>
    <circle cx="296" cy="22" r="22" fill="#0B1830"/>
  </g>
  <text x="88" y="560" fill="#6F829A" font-family="Segoe UI, sans-serif" font-size="18" font-weight="600" letter-spacing="1.6">TERRITORIOSAPP.DUCKDNS.ORG</text>
</svg>`)

await sharp(socialSvg).png().toFile(path.join(appDir, 'opengraph-image.png'))
await copyFile(path.join(appDir, 'opengraph-image.png'), path.join(appDir, 'twitter-image.png'))
await copyFile(path.join(appDir, 'opengraph-image.png'), path.join(publicBrand, 'territorios-app-social.png'))

console.log('Brand assets generated successfully.')
