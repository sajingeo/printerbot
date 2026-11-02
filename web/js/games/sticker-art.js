// Colour-in sticker art: bubble-outlined text and outlined doodles.
// Everything is drawn as black outlines on white, so guests can colour it in.
// Pass a palette to draw the "coloured in" preview instead.

import { PRINT_WIDTH as W } from '../printer.js';
import { FONT_DISPLAY } from '../ticket.js';

export const THEMES = {
  party: { label: '🎈 Party', doodles: ['balloon', 'star', 'sparkle', 'heart'] },
  spicy: { label: '🌶️ Spicy', doodles: ['chili', 'sparkle', 'star', 'chili'] },
  doggo: { label: '🐾 Doggo', doodles: ['paw', 'bone', 'heart', 'paw'] },
  garden: { label: '🌻 Garden', doodles: ['flower', 'leaf', 'chili', 'flower'] },
  royal: { label: '👑 Royal', doodles: ['crown', 'star', 'heart', 'sparkle'] },
};

export const CRAYONS = ['#ff3d8b', '#ffd23f', '#2ec4b6', '#7b2ff7', '#ff8c42', '#3a86ff', '#7ae582', '#ff5e5b'];

/** Small seeded RNG so the preview and the print match. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------ doodles
// Each shape is a list of groups drawn in order. Filled parts in a group share one
// outline (their union); line parts are drawn on top without fill.

const circle = (x, y, r) => {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
};
const ellipse = (x, y, rx, ry) => {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  return p;
};
const fill = (path) => ({ path, fill: true });
const line = (path) => ({ path, fill: false });

const SHAPES = {
  star(s) {
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.45 : s;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
    return [[fill(p)]];
  },
  sparkle(s) {
    const p = new Path2D();
    const k = s * 0.18;
    p.moveTo(0, -s);
    p.quadraticCurveTo(k, -k, s, 0);
    p.quadraticCurveTo(k, k, 0, s);
    p.quadraticCurveTo(-k, k, -s, 0);
    p.quadraticCurveTo(-k, -k, 0, -s);
    return [[fill(p)]];
  },
  heart(s) {
    const p = new Path2D();
    p.moveTo(0, s * 0.85);
    p.bezierCurveTo(-s * 1.25, 0, -s * 0.75, -s * 1.05, 0, -s * 0.38);
    p.bezierCurveTo(s * 0.75, -s * 1.05, s * 1.25, 0, 0, s * 0.85);
    return [[fill(p)]];
  },
  balloon(s) {
    const body = ellipse(0, -s * 0.2, s * 0.72, s * 0.88);
    const knot = new Path2D();
    knot.moveTo(0, s * 0.66);
    knot.lineTo(-s * 0.14, s * 0.84);
    knot.lineTo(s * 0.14, s * 0.84);
    knot.closePath();
    const string = new Path2D();
    string.moveTo(0, s * 0.84);
    string.bezierCurveTo(s * 0.3, s * 1.05, -s * 0.3, s * 1.2, 0, s * 1.4);
    const shine = new Path2D();
    shine.arc(0, -s * 0.2, s * 0.5, Math.PI * 1.1, Math.PI * 1.4);
    return [[fill(body), fill(knot), line(string), line(shine)]];
  },
  chili(s) {
    // A plump pepper hanging from a stem, curling to a point at the bottom.
    const body = new Path2D();
    body.moveTo(-s * 0.4, -s * 0.5);
    body.bezierCurveTo(s * 0.1, -s * 0.65, s * 0.55, -s * 0.55, s * 0.5, -s * 0.15);
    body.bezierCurveTo(s * 0.45, s * 0.35, s * 0.15, s * 0.8, -s * 0.35, s * 1.0);
    body.bezierCurveTo(-s * 0.12, s * 0.6, -s * 0.28, s * 0.15, -s * 0.52, -s * 0.18);
    body.bezierCurveTo(-s * 0.62, -s * 0.34, -s * 0.56, -s * 0.47, -s * 0.4, -s * 0.5);
    const cap = ellipse(0, -s * 0.56, s * 0.38, s * 0.14);
    const stem = new Path2D();
    stem.moveTo(0, -s * 0.66);
    stem.quadraticCurveTo(s * 0.05, -s * 0.95, s * 0.32, -s * 1.02);
    return [[fill(body)], [fill(cap), line(stem)]];
  },
  paw(s) {
    return [[
      fill(ellipse(0, s * 0.32, s * 0.5, s * 0.42)),
      fill(circle(-s * 0.64, -s * 0.2, s * 0.2)),
      fill(circle(-s * 0.25, -s * 0.62, s * 0.21)),
      fill(circle(s * 0.25, -s * 0.62, s * 0.21)),
      fill(circle(s * 0.64, -s * 0.2, s * 0.2)),
    ]];
  },
  bone(s) {
    const bar = new Path2D();
    bar.rect(-s * 0.72, -s * 0.17, s * 1.44, s * 0.34);
    return [[fill(bar), fill(circle(-s * 0.78, -s * 0.2, s * 0.24)), fill(circle(-s * 0.78, s * 0.2, s * 0.24)),
      fill(circle(s * 0.78, -s * 0.2, s * 0.24)), fill(circle(s * 0.78, s * 0.2, s * 0.24))]];
  },
  flower(s) {
    const petals = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      petals.push(fill(circle(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.4)));
    }
    return [petals, [fill(circle(0, 0, s * 0.32))]];
  },
  leaf(s) {
    const p = new Path2D();
    p.moveTo(0, -s);
    p.quadraticCurveTo(s * 0.85, 0, 0, s);
    p.quadraticCurveTo(-s * 0.85, 0, 0, -s);
    const vein = new Path2D();
    vein.moveTo(0, -s * 0.7);
    vein.lineTo(0, s * 1.15);
    return [[fill(p), line(vein)]];
  },
  crown(s) {
    const p = new Path2D();
    p.moveTo(-s, s * 0.5);
    p.lineTo(-s, -s * 0.4);
    p.lineTo(-s * 0.5, s * 0.05);
    p.lineTo(0, -s * 0.7);
    p.lineTo(s * 0.5, s * 0.05);
    p.lineTo(s, -s * 0.4);
    p.lineTo(s, s * 0.5);
    p.closePath();
    return [[fill(p)], [fill(circle(-s, -s * 0.5, s * 0.13)), fill(circle(0, -s * 0.8, s * 0.13)), fill(circle(s, -s * 0.5, s * 0.13))]];
  },
};

function drawDoodle(ctx, name, x, y, s, rot, color) {
  const lw = Math.max(3, s * 0.12);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const group of SHAPES[name](s)) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = lw * 2;
    for (const p of group) if (p.fill) ctx.stroke(p.path);
    ctx.fillStyle = color;
    for (const p of group) if (p.fill) ctx.fill(p.path);
    ctx.lineWidth = lw;
    for (const p of group) if (!p.fill) ctx.stroke(p.path);
  }
  ctx.restore();
}

// ------------------------------------------------------------ bubble text

const SPACING = 0.03; // extra letter spacing, as a fraction of size
const BUBBLE = 0.26; // die-cut ring width, as a fraction of size

function textWidth(ctx, text, size) {
  ctx.font = `${size}px ${FONT_DISPLAY}`;
  return [...text].reduce((w, ch) => w + ctx.measureText(ch).width + size * SPACING, -size * SPACING);
}

/** Largest size (up to max) at which text plus its bubble ring fits in width. */
function fitSize(ctx, text, width, max) {
  const w100 = textWidth(ctx, text, 100) / 100;
  return Math.min(max, Math.floor(width / (w100 + BUBBLE)));
}

/**
 * Draw text centred at (cx, cy) as colour-in letters: each letter outlined, with a
 * second "sticker" ring around the whole word. colors: null for white letters.
 */
function bubbleText(ctx, text, cx, cy, size, colors) {
  const chars = [...text];
  ctx.font = `${size}px ${FONT_DISPLAY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  const total = textWidth(ctx, text, size);
  const xs = [];
  let x = cx - total / 2;
  for (const ch of chars) {
    xs.push(x);
    x += ctx.measureText(ch).width + size * SPACING;
  }
  const each = (fn) => chars.forEach((ch, i) => ch.trim() && fn(ch, xs[i], i));
  const ring = Math.max(3, size * 0.035);
  const letter = Math.max(2.5, size * 0.035);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = size * BUBBLE;
  each((ch, x) => ctx.strokeText(ch, x, cy));
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = size * BUBBLE - ring * 2;
  each((ch, x) => ctx.strokeText(ch, x, cy));
  ctx.strokeStyle = '#000';
  ctx.lineWidth = letter * 2;
  each((ch, x) => ctx.strokeText(ch, x, cy));
  each((ch, x, i) => {
    ctx.fillStyle = colors ? colors[i % colors.length] : '#fff';
    ctx.fillText(ch, x, cy);
  });
}

function solidText(ctx, text, cx, cy, size) {
  ctx.font = `${size}px ${FONT_DISPLAY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(text, cx, cy);
}

// ------------------------------------------------------------ layouts

const FOOTER = "★ ANDY'S BIRTHDAY BASH ★";

function splitName(name) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [name];
  let best = [name];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

// 3.5 cm at ~8 dots per mm. Keeps each sticker short to save paper.
export const STICKER_HEIGHT = 280;

/** Sticker across the paper: 384 dots wide, a fixed 3.5 cm tall. */
function sticker(name, tagline, theme, seed, palette) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const r = rng(seed);
  const H = STICKER_HEIGHT;
  const side = 58; // doodle column on each side
  const textW = W - side * 2;
  c.width = W;
  c.height = H;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Bottom up: footer, tagline, then the name fills what is left.
  const footerY = H - 11;
  const tagSize = fitSize(ctx, tagline, textW + 30, 42);
  const tagY = footerY - 16 - tagSize * 0.62;
  const nameH = tagY - tagSize * 0.65 - 8;
  let lines = [name];
  let size = Math.min(fitSize(ctx, name, textW, 130), Math.floor(nameH * 0.92));
  if (size < 64 && name.includes(' ')) {
    const split = splitName(name);
    const size2 = Math.min(...split.map((l) => fitSize(ctx, l, textW, 130)), Math.floor((nameH / 2) * 0.95));
    if (size2 > size) {
      lines = split;
      size = size2;
    }
  }
  const step = nameH / lines.length;
  lines.forEach((l, i) => bubbleText(ctx, l, W / 2, 4 + step * (i + 0.5), size, palette && rotate(palette, i * 3)));
  bubbleText(ctx, tagline, W / 2, tagY, tagSize, palette && rotate(palette, 5));
  solidText(ctx, FOOTER, W / 2, footerY, 15);

  [side / 2 + 2, W - side / 2 - 2].forEach((x, col) => {
    [H * 0.24, H * 0.62].forEach((y, row) => {
      const kind = theme.doodles[Math.floor(r() * theme.doodles.length)];
      const color = palette ? palette[(col * 2 + row) * 3 % palette.length] : '#fff';
      drawDoodle(ctx, kind, x + (r() - 0.5) * 6, y + (r() - 0.5) * 10, 19 + r() * 4, (r() - 0.5) * 0.7, color);
    });
  });
  return c;
}

const rotate = (arr, n) => arr.map((_, i) => arr[(i + n) % arr.length]);

export function renderSticker({ name, tagline, theme = 'party', seed = 1, colored = false }) {
  const palette = colored ? rotate(CRAYONS, seed % CRAYONS.length) : null;
  return sticker(name, tagline, THEMES[theme] ?? THEMES.party, seed, palette);
}
