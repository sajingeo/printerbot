// I Was Here! kiosk: type your name, print a colour-in sticker, stick it on the Bar.

import { THEMES, STICKER_HEIGHT, renderSticker } from './sticker-art.js';
import { ensureFonts } from '../ticket.js';
import { printCanvas, rememberTicket, status as printerStatus } from '../party-printer.js';
import { confetti, sfx, toast } from '../fx.js';

const KEY = 'printerbot.nameSticker';
const $ = (id) => document.getElementById(id);

export const TAGLINES = [
  { label: '👋 was here!', text: 'was here!' },
  { label: '🎉 partied here', text: 'partied here' },
  { label: '💖 loves Andy', text: 'loves Andy' },
  { label: '🎂 ate the cake', text: 'ate the cake' },
  { label: '💃 owned the dance floor', text: 'owned the floor' },
  { label: '😏 is single', text: 'is single ;)' },
  { label: '🌶️ is too hot', text: 'is too hot' },
  { label: '🐶 pet Charlie', text: 'pet Charlie' },
];

let opts = load();
let printing = false;
let drawTimer = 0;

function load() {
  const base = { tagline: 0, theme: 'party', seed: 1 + Math.floor(Math.random() * 1e6) };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...base, ...saved, seed: base.seed };
  } catch {
    return base;
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ tagline: opts.tagline, theme: opts.theme }));
  } catch {}
}

const nameValue = () => $('stickerName').value.trim().replace(/\s+/g, ' ');

function current(colored = false) {
  return renderSticker({
    name: nameValue() || 'Your Name',
    tagline: TAGLINES[opts.tagline].text,
    theme: opts.theme,
    seed: opts.seed,
    colored,
  });
}

// ------------------------------------------------------------ choices

function chips(boxId, items, selected, onPick) {
  const box = $(boxId);
  box.replaceChildren();
  items.forEach(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(value === selected));
    b.textContent = label;
    b.onclick = () => {
      onPick(value);
      save();
      renderChoices();
      sfx.tick();
      redraw();
    };
    box.append(b);
  });
}

function renderChoices() {
  chips('stickerTaglines', TAGLINES.map((t, i) => [i, t.label]), opts.tagline, (v) => (opts.tagline = v));
  chips('stickerThemes', Object.entries(THEMES).map(([k, t]) => [k, t.label]), opts.theme, (v) => (opts.theme = v));
}

// ------------------------------------------------------------ preview

async function redraw() {
  await ensureFonts();
  const plain = current(false);
  const colored = current(true);
  $('stickerPlain').replaceChildren(plain);
  $('stickerColor').replaceChildren(colored);
}

function scheduleRedraw() {
  clearTimeout(drawTimer);
  drawTimer = setTimeout(redraw, 120);
}

// ------------------------------------------------------------ print

function setPrintStatus(msg) {
  $('stickerStatus').textContent = msg;
}

async function printSticker(e) {
  e?.preventDefault();
  if (printing) return;
  const name = nameValue();
  if (!name) {
    const input = $('stickerName');
    input.classList.remove('wiggle');
    void input.offsetWidth;
    input.classList.add('wiggle');
    input.focus();
    toast('Type your name first! ✍️');
    return;
  }
  sfx.unlock();
  $('stickerName').blur();
  await ensureFonts();
  const art = current(false);
  rememberTicket(art);
  confetti(90);
  sfx.tada();
  if (printerStatus.phase !== 'ready') {
    setPrintStatus(printerStatus.phase === 'printing' ? '⏳ Printer is busy, hang on…' : '📵 Printer offline. Ask the host to connect it!');
    return;
  }
  printing = true;
  $('stickerBtn').disabled = true;
  setPrintStatus(`🖨️ Printing ${name}'s sticker…`);
  try {
    await printCanvas(art, (sent, total) => setPrintStatus(`🖨️ Printing… ${Math.round((100 * sent) / total)}%`));
    setPrintStatus('✅ Now grab a marker, colour it in and stick it on the Bar! 🖍️');
    toast(`Looking good, ${name}! 🖍️`);
    $('stickerName').value = '';
    opts.seed = 1 + Math.floor(Math.random() * 1e6);
    redraw();
  } catch (err) {
    setPrintStatus(`⚠️ Print failed: ${err.message}`);
  } finally {
    printing = false;
    $('stickerBtn').disabled = false;
  }
}

export function initNameSticker() {
  $('stickerLen').textContent = `${(STICKER_HEIGHT / 80).toFixed(1)} cm sticker`; // ~8 dots per mm
  $('stickerForm').addEventListener('submit', printSticker);
  $('stickerName').addEventListener('input', () => {
    setPrintStatus('');
    scheduleRedraw();
  });
  $('stickerShuffle').onclick = () => {
    opts.seed = 1 + Math.floor(Math.random() * 1e6);
    sfx.tick();
    redraw();
  };
  $('stickerSurprise').onclick = () => {
    opts.tagline = Math.floor(Math.random() * TAGLINES.length);
    const themes = Object.keys(THEMES);
    opts.theme = themes[Math.floor(Math.random() * themes.length)];
    opts.seed = 1 + Math.floor(Math.random() * 1e6);
    save();
    renderChoices();
    sfx.tick();
    redraw();
  };
  renderChoices();
  redraw();
}
