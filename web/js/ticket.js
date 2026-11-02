// Lays out printable tickets on a 384-dot canvas from a list of blocks:
//   { kind: 'text', text, size, weight, display, align, invert, box }
//   { kind: 'row', left, center, right, size, display }
//   { kind: 'rule', style: 'dash' | 'zigzag' }
//   { kind: 'gap', h }

import { PRINT_WIDTH as W } from './printer.js';

export const FONT_DISPLAY = '"Lilita One", "Arial Black", Impact, sans-serif';
export const FONT_BODY = '"Fredoka", "Trebuchet MS", system-ui, sans-serif';

const PAD = 12;

/** Canvas only uses web fonts that have already loaded. */
export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`40px "Lilita One"`),
      document.fonts.load(`700 30px "Fredoka"`),
      document.fonts.load(`600 30px "Fredoka"`),
    ]);
  } catch {}
}

function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (const word of para.split(/(\s+)/)) {
      const next = cur + word;
      if (ctx.measureText(next).width > maxW && cur.trim()) {
        lines.push(cur.trimEnd());
        cur = word.trimStart();
      } else cur = next;
    }
    lines.push(cur);
  }
  return lines;
}

function font(b) {
  return `${b.weight ?? (b.display ? 400 : 600)} ${b.size ?? 26}px ${b.display ? FONT_DISPLAY : FONT_BODY}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function layout(ctx, blocks, draw) {
  let y = 0;
  ctx.textBaseline = 'middle';
  for (const b of blocks) {
    if (b.kind === 'gap') {
      y += b.h ?? 12;
    } else if (b.kind === 'rule') {
      if (draw) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (b.style === 'zigzag') {
          for (let x = PAD, up = true; x <= W - PAD; x += 12, up = !up) ctx.lineTo(x, y + (up ? 4 : 14));
        } else {
          ctx.setLineDash([12, 8]);
          ctx.moveTo(PAD, y + 9);
          ctx.lineTo(W - PAD, y + 9);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      y += 18;
    } else if (b.kind === 'row') {
      ctx.font = font(b);
      const lh = Math.round((b.size ?? 26) * 1.3);
      if (draw) {
        ctx.fillStyle = '#000';
        const mid = y + lh / 2;
        ctx.textAlign = 'left';
        if (b.left) ctx.fillText(b.left, PAD, mid);
        ctx.textAlign = 'center';
        if (b.center) ctx.fillText(b.center, W / 2, mid);
        ctx.textAlign = 'right';
        if (b.right) ctx.fillText(b.right, W - PAD, mid);
      }
      y += lh;
    } else if (b.kind === 'text') {
      const size = b.size ?? 26;
      ctx.font = font(b);
      const framed = b.invert || b.box;
      const inset = PAD + (framed ? 14 : 0);
      const lines = wrap(ctx, b.text, W - inset * 2);
      const lh = Math.round(size * (b.lineHeight ?? 1.2));
      const padY = framed ? 14 : 0;
      const h = lines.length * lh + padY * 2;
      if (draw) {
        if (b.invert) {
          ctx.fillStyle = '#000';
          roundRect(ctx, PAD, y, W - PAD * 2, h, 14);
          ctx.fill();
        } else if (b.box) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          roundRect(ctx, PAD + 2, y + 2, W - PAD * 2 - 4, h - 4, 16);
          ctx.stroke();
        }
        const align = b.align ?? 'center';
        ctx.textAlign = align;
        ctx.fillStyle = b.invert ? '#fff' : '#000';
        const x = align === 'left' ? inset : align === 'right' ? W - inset : W / 2;
        lines.forEach((l, i) => ctx.fillText(l, x, y + padY + i * lh + lh / 2));
      }
      y += h;
    }
  }
  return Math.ceil(y);
}

export function renderTicket(blocks) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = 10;
  c.height = layout(c.getContext('2d'), blocks, false);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  layout(ctx, blocks, true);
  return c;
}

/** The header every party ticket shares. */
export function partyHeader(gameTitle) {
  return [
    { kind: 'text', text: '🎂 🎈 🥳 🎈 🎂', size: 44 },
    { kind: 'gap', h: 4 },
    { kind: 'text', text: "ANDY'S BIRTHDAY", display: true, size: 44 },
    { kind: 'gap', h: 8 },
    { kind: 'text', text: `★ ${gameTitle} ★`, display: true, size: 34, invert: true },
    { kind: 'gap', h: 10 },
  ];
}

export function partyFooter(note) {
  const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return [
    { kind: 'gap', h: 6 },
    { kind: 'rule', style: 'dash' },
    { kind: 'gap', h: 4 },
    { kind: 'text', text: note, size: 20, weight: 600 },
    { kind: 'text', text: `${t} · Andy's Bash 🎉`, size: 18, weight: 400 },
  ];
}
