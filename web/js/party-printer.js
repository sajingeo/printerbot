// One shared printer connection for every game on the page.
// Navigating away drops a Web Bluetooth connection, so the games live in one page.

import { AhM2Printer, rgbaToGray, grayToDots, dotGainCorrect, packDots, trimBlankLines } from './printer.js';

export const printer = new AhM2Printer();
export const hasBluetooth = typeof navigator !== 'undefined' && !!navigator.bluetooth;

// Values that work on a real AH-M2; see blethermal docs/PROTOCOL.md section 8.
const KEY = 'printerbot.printer';
const DEFAULTS = { density: 4, dotGain: 2.5, leadLines: 24, feedLines: 80, packetDelayMs: 20 };
export const settings = { ...DEFAULTS, ...readSettings() };
printer.packetDelayMs = settings.packetDelayMs;

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSettings(patch) {
  Object.assign(settings, patch);
  printer.packetDelayMs = settings.packetDelayMs;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}

// 'disconnected' | 'connecting' | 'ready' | 'printing'
export const status = { phase: 'disconnected', name: '', battery: null, noPaper: false };
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(status));

export function onPrinterChange(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

printer.addEventListener('state', (e) => {
  const s = e.detail;
  status.phase = s === 'disconnected' ? 'disconnected' : s === 'connected' ? 'connecting' : s === 'idle' ? 'ready' : 'printing';
  notify();
});
printer.addEventListener('status', (e) => {
  status.battery = e.detail.battery;
  status.noPaper = e.detail.noPaper;
  notify();
});
printer.addEventListener('log', (e) => console.debug('[printer]', e.detail));

export async function connectPrinter() {
  status.phase = 'connecting';
  notify();
  try {
    status.name = await printer.connect();
    await printer.setDensity(settings.density).catch(() => {});
  } finally {
    if (printer.state === 'disconnected') {
      status.phase = 'disconnected';
      notify();
    }
  }
}

export const disconnectPrinter = () => printer.disconnect();

/**
 * Canvas → 1-bit dots. Grey pixels (text, rules) are thresholded so they stay crisp.
 * Coloured pixels (emoji) print sticker-style: a solid outline where they meet the
 * paper, and dithered shading inside so they neither vanish nor print as blobs.
 */
export function canvasToDots(canvas) {
  const { width: w, height: h } = canvas;
  const rgba = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const gray = rgbaToGray(rgba, w, h);
  const dots = grayToDots(gray, w, h, { threshold: 160, dither: 'none' });
  const color = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < color.length; i++, p += 4) {
    color[i] = Math.max(rgba[p], rgba[p + 1], rgba[p + 2]) - Math.min(rgba[p], rgba[p + 1], rgba[p + 2]) > 28 ? 1 : 0;
  }
  // Light dot-gain correction only; emoji need contrast more than tonal accuracy.
  const shaded = grayToDots(dotGainCorrect(gray.slice(), Math.min(settings.dotGain, 1.4)), w, h, { dither: 'floyd' });
  const paper = (i) => !color[i] && gray[i] > 200;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!color[i]) continue;
      const edge = (x > 0 && paper(i - 1)) || (x < w - 1 && paper(i + 1)) || (y > 0 && paper(i - w)) || (y < h - 1 && paper(i + w));
      dots[i] = edge ? 1 : shaded[i];
    }
  }
  return dots;
}

/** Dots → a small canvas that shows what the paper will look like. */
export function dotsPreview(dots, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0, p = 0; i < dots.length; i++, p += 4) {
    const v = dots[i] ? 20 : 250;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// The most recent ticket from any game, for the preview in the printer sheet.
let lastTicket = null;
export const rememberTicket = (canvas) => (lastTicket = canvas);
export const getLastTicket = () => lastTicket;

export async function printCanvas(canvas, onProgress) {
  if (status.phase !== 'ready') throw new Error(status.phase === 'printing' ? 'Printer is busy' : 'Printer not connected');
  const bitmap = trimBlankLines(packDots(canvasToDots(canvas), canvas.width, canvas.height));
  if (!bitmap.length) throw new Error('Nothing to print');
  await printer.setDensity(settings.density);
  await printer.print(bitmap, { leadLines: settings.leadLines, feedLines: settings.feedLines, onProgress });
}

export async function feedPaper() {
  if (status.phase !== 'ready') throw new Error('Printer not ready');
  await printer.feed(settings.feedLines);
}
