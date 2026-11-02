// Do or Drink kiosk: anyone at the bar taps, the printer spits out a dare ticket,
// they do it or drink. The screen then resets for the next guest.

import { DARES, WILDS, SPICE, WILD_CHANCE, pickDare } from './dares.js';
import { renderTicket, ensureFonts, partyHeader, partyFooter } from '../ticket.js';
import { printCanvas, rememberTicket, status as printerStatus } from '../party-printer.js';
import { confetti, sfx } from '../fx.js';

const KEY = 'printerbot.doOrDrink';
const RESET_AFTER_MS = 25000;
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const IDLE_LINES = [
  'Tap the button… if you dare 😈',
  'Feeling brave? 👀',
  'The printer knows your secrets 🖨️',
  "It's Andy's birthday. No excuses 🎂",
  'Single? Perfect 😏',
];

// Only the ticket counter, spice choice and recent dares persist.
let kiosk = load();
let current = null;
let spinning = false;
let resetTimer = 0;
let idleTimer = 0;

function load() {
  const base = { ticketNo: 0, spice: 'mix', used: [] };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return base;
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(kiosk));
  } catch {}
}

const ticketNo = (n) => `#${String(n).padStart(3, '0')}`;
const spiceTag = (lvl) => `${SPICE[lvl].emoji} ${SPICE[lvl].label.toUpperCase()}`;

// ------------------------------------------------------------ the card

function setCard({ no = '', spice = '', text, sips = '', state = 'idle' }) {
  const card = $('dareCard');
  card.dataset.state = state;
  $('dcNo').textContent = no;
  $('dcSpice').textContent = spice;
  $('dcText').textContent = text;
  $('dcSips').textContent = sips;
}

// Rotate a teaser line while nobody is playing.
function idleCard() {
  let i = 0;
  const show = () => setCard({ text: IDLE_LINES[i++ % IDLE_LINES.length] });
  show();
  clearInterval(idleTimer);
  idleTimer = setInterval(show, 4000);
}

function renderSpice() {
  document.querySelectorAll('#spice [data-spice]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.spice === String(kiosk.spice)));
  });
}

async function spin(no) {
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const d = pick(DARES);
    setCard({ no: ticketNo(no), spice: spiceTag(d.lvl), text: d.text, state: 'spinning' });
    sfx.tick();
    await sleep(45 + i * i * 0.9);
  }
}

function showCard(card) {
  const no = ticketNo(card.no);
  if (card.kind === 'wild') {
    setCard({ no, spice: '🃏 WILD CARD', text: `${card.emoji} ${card.title}\n${card.text}`, state: 'wild' });
  } else {
    setCard({ no, spice: spiceTag(card.lvl), text: card.text, sips: `💪 Do it… or 🍻 drink ${card.sips} sip${card.sips > 1 ? 's' : ''}`, state: `lvl${card.lvl}` });
  }
}

function ticketFor(card) {
  const head = [
    ...partyHeader('DO OR DRINK'),
    { kind: 'row', left: `TICKET ${ticketNo(card.no)}`, right: card.kind === 'wild' ? '🃏 WILD' : spiceTag(card.lvl), size: 22, weight: 700 },
    { kind: 'rule', style: 'zigzag' },
    { kind: 'gap', h: 8 },
  ];
  if (card.kind === 'wild') {
    return renderTicket([
      ...head,
      { kind: 'text', text: 'YOU PULLED A…', size: 22, weight: 700 },
      { kind: 'text', text: card.emoji, size: 96 },
      { kind: 'text', text: card.title, display: true, size: 46 },
      { kind: 'gap', h: 8 },
      { kind: 'text', text: card.text, size: 28, weight: 600, box: true },
      ...partyFooter('Wild cards rule. No arguing. 🃏'),
    ]);
  }
  return renderTicket([
    ...head,
    { kind: 'text', text: 'YOUR DARE:', size: 24, weight: 700 },
    { kind: 'gap', h: 8 },
    { kind: 'text', text: card.text, size: card.text.length > 70 ? 30 : 34, weight: 700, box: true },
    { kind: 'gap', h: 14 },
    { kind: 'row', left: '💪 DO IT', center: 'or', right: `🍻 ${card.sips} SIP${card.sips > 1 ? 'S' : ''}`, display: true, size: 30 },
    ...partyFooter('Chicken out = drink up 🐔'),
  ]);
}

function setPrintStatus(msg) {
  $('printStatus').textContent = msg;
}

async function printCurrent() {
  if (!current) return;
  await ensureFonts();
  const ticket = rememberTicket(ticketFor(current));
  if (printerStatus.phase !== 'ready') {
    setPrintStatus(printerStatus.phase === 'printing' ? '⏳ Printer is busy, hang on…' : '📵 Printer offline. Read it off the screen!');
    return;
  }
  setPrintStatus('🖨️ Printing your ticket…');
  try {
    await printCanvas(ticket, (sent, total) => setPrintStatus(`🖨️ Printing… ${Math.round((100 * sent) / total)}%`));
    setPrintStatus('✅ Grab your ticket! 🎟️');
  } catch (e) {
    setPrintStatus(`⚠️ Print failed: ${e.message}`);
  }
}

// ------------------------------------------------------------ flow

function showActions() {
  $('dareBtn').classList.toggle('hidden', !!current);
  $('dareBtn').disabled = spinning;
  $('doneBtn').classList.toggle('hidden', !current);
  $('reprintBtn').classList.toggle('hidden', !current);
}

async function dareMe() {
  if (spinning || current) return;
  spinning = true;
  clearInterval(idleTimer);
  sfx.unlock();
  showActions();
  setPrintStatus('');
  let card;
  if (Math.random() < WILD_CHANCE) {
    card = { kind: 'wild', ...pick(WILDS) };
  } else {
    const { dare, used } = pickDare(DARES, kiosk.spice, kiosk.used);
    kiosk.used = used;
    card = { kind: 'dare', ...dare };
  }
  card.no = ++kiosk.ticketNo;
  save();

  await spin(card.no);
  current = card;
  spinning = false;
  showCard(card);
  showActions();
  confetti();
  sfx.tada();
  printCurrent();
  clearTimeout(resetTimer);
  resetTimer = setTimeout(nextGuest, RESET_AFTER_MS);
}

function nextGuest() {
  clearTimeout(resetTimer);
  if (!current) return;
  current = null;
  setPrintStatus('');
  idleCard();
  showActions();
}

export function initDoOrDrink() {
  $('dareBtn').onclick = dareMe;
  $('doneBtn').onclick = () => {
    sfx.cheer();
    nextGuest();
  };
  $('reprintBtn').onclick = printCurrent;
  document.querySelectorAll('#spice [data-spice]').forEach((b) => {
    b.onclick = () => {
      kiosk.spice = b.dataset.spice === 'mix' ? 'mix' : Number(b.dataset.spice);
      save();
      renderSpice();
      sfx.tick();
    };
  });
  idleCard();
  renderSpice();
  showActions();
}
