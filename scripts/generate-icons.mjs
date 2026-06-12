/* Generates the PWA / home-screen icons with zero dependencies.
   Mark: dark tile + three rounded bars (accent middle) — matches the
   prototype's own thumbnail. Run via `npm run icons` (also part of build). */
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

const BG     = [12, 13, 16];     // #0c0d10
const BAR    = [43, 48, 56];     // #2b3038
const ACCENT = [216, 162, 74];   // #d8a24a

// minimal PNG encoder (truecolor + alpha, filter 0)
function encodePNG(w, h, rgba){
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++){
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// draw the mark into an RGBA buffer. `inset` = fraction of margin around the
// bar block (larger for maskable icons so the art stays inside the safe zone).
function drawIcon(size, inset = 0.30){
  const buf = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) put(x, y, BG);

  const barW = Math.round(size * (1 - inset * 2));
  const x0 = Math.round((size - barW) / 2);
  const barH = Math.round(size * 0.085);
  const gap = Math.round(size * 0.045);
  const radius = Math.round(barH * 0.35);
  const blockH = barH * 3 + gap * 2;
  const y0 = Math.round((size - blockH) / 2);
  const colors = [BAR, ACCENT, BAR];

  const roundedRect = (rx, ry, rw, rh, rad, color) => {
    for (let y = ry; y < ry + rh; y++){
      for (let x = rx; x < rx + rw; x++){
        const dx = Math.min(x - rx, rx + rw - 1 - x);
        const dy = Math.min(y - ry, ry + rh - 1 - y);
        if (dx < rad && dy < rad){
          const cx = rad - dx, cy = rad - dy;
          if (cx * cx + cy * cy > rad * rad) continue;
        }
        put(x, y, color);
      }
    }
  };
  for (let b = 0; b < 3; b++)
    roundedRect(x0, y0 + b * (barH + gap), barW, barH, radius, colors[b]);

  return buf;
}

const targets = [
  { name: 'icon-192.png', size: 192, inset: 0.30 },
  { name: 'icon-512.png', size: 512, inset: 0.30 },
  { name: 'icon-maskable-512.png', size: 512, inset: 0.38 },
  { name: 'apple-touch-icon.png', size: 180, inset: 0.30 },
];
for (const t of targets){
  writeFileSync(join(OUT, t.name), encodePNG(t.size, t.size, drawIcon(t.size, t.inset)));
  console.log('wrote', t.name);
}
