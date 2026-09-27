/**
 * Generates the PWA icon set with zero image dependencies.
 *
 * Draws a rounded dark tile with a gold ingot mark, then encodes it as PNG
 * using node's zlib. Run with `npm run icons` after changing the mark.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BG = [10, 12, 16];
const GOLD = [224, 178, 70];
const GOLD_DARK = [176, 134, 44];

/** @param {number} size @param {number} inset fraction of the canvas kept clear (maskable safe zone) */
function drawIcon(size, inset) {
  const pixels = new Uint8Array(size * size * 4);
  const radius = size * 0.22;
  const pad = size * inset;
  const artSize = size - pad * 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const inTile = inset > 0.08 ? true : insideRoundedRect(x, y, 0, 0, size, size, radius);

      let colour = inTile ? BG : [0, 0, 0];
      let alpha = inTile ? 255 : 0;

      // Ingot: a trapezoid with a highlight band, drawn in the safe area.
      const ingot = ingotColour(x, y, pad, artSize);
      if (ingot) {
        colour = ingot;
        alpha = 255;
      }

      pixels[offset] = colour[0];
      pixels[offset + 1] = colour[1];
      pixels[offset + 2] = colour[2];
      pixels[offset + 3] = alpha;
    }
  }

  return pixels;
}

function insideRoundedRect(px, py, x, y, w, h, r) {
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r || (px >= x + r && px <= x + w - r) || (py >= y + r && py <= y + h - r);
}

function ingotColour(x, y, pad, artSize) {
  const localX = (x - pad) / artSize;
  const localY = (y - pad) / artSize;
  if (localX < 0 || localX > 1 || localY < 0 || localY > 1) return null;

  // Trapezoid body between 28% and 78% height.
  const top = 0.3;
  const bottom = 0.76;
  if (localY < top || localY > bottom) return null;

  const progress = (localY - top) / (bottom - top);
  const halfWidth = 0.2 + progress * 0.2;
  const distance = Math.abs(localX - 0.5);
  if (distance > halfWidth) return null;

  // Top face highlight.
  if (progress < 0.22) return GOLD;
  // Shading on the right third gives the bar some volume.
  return localX > 0.56 ? GOLD_DARK : GOLD;
}

function encodePng(size, pixels) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.slice(y * size * 4, (y + 1) * size * 4).forEach((value, index) => {
      raw[y * (size * 4 + 1) + 1 + index] = value;
    });
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData) >>> 0, 0);
  return Buffer.concat([length, typeAndData, crc]);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, inset: 0.16 },
  { file: 'icon-512.png', size: 512, inset: 0.16 },
  { file: 'maskable-512.png', size: 512, inset: 0.26 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.16 },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const png = encodePng(target.size, drawIcon(target.size, target.inset));
  writeFileSync(resolve(OUT_DIR, target.file), png);
  console.log(`wrote icons/${target.file} (${target.size}x${target.size})`);
}
