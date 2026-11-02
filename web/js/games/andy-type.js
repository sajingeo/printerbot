// Which Andy Are You? kiosk: tap, a fake "scan", then your Andy type prints.

import { ANDY_TYPES, SCAN_LINES, pickAndy } from './andy-types.js';
import { renderTicket, ensureFonts, partyHeader, partyFooter } from '../ticket.js';
import { printCanvas, rememberTicket, status as printerStatus } from '../party-printer.js';
import { confetti, sfx } from '../fx.js';

const KEY = 'printerbot.andyType';
const RESET_AFTER_MS = 25000;
const SCAN_MS = 2800;
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let kiosk = load();
let current = null;
let scanning = false;
let resetTimer = 0;

function load() {
  const base = { resultNo: 0, recent: [] };
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

const resultNo = (n) => `#${String(n).padStart(3, '0')}`;
const peppers = (n) => '🌶️'.repeat(n);

// ------------------------------------------------------------ screen

function setState(state) {
  $('andyCard').dataset.state = state;
}

function idle() {
  setState('idle');
  $('andyEmoji').textContent = '👑';
  $('andyKicker').textContent = 'Every one of us has a little Andy inside.';
  $('andyName').textContent = 'Which one are YOU?';
  $('andyLine').textContent = '';
  $('andyStats').classList.add('hidden');
  $('andyScan').classList.add('hidden');
}

async function scan() {
  setState('scanning');
  $('andyScan').classList.remove('hidden');
  $('andyStats').classList.add('hidden');
  $('andyKicker').textContent = 'Scanning your vibe…';
  $('andyName').textContent = '';
  $('andyLine').textContent = '';
  const bar = $('andyBar');
  const lines = [...SCAN_LINES].sort(() => Math.random() - 0.5);
  const t0 = performance.now();
  let i = 0;
  while (performance.now() - t0 < SCAN_MS) {
    const p = Math.min(1, (performance.now() - t0) / SCAN_MS);
    bar.style.width = `${Math.round(p * 100)}%`;
    if (i % 7 === 0) $('andyLine').textContent = lines[(i / 7) % lines.length];
    $('andyEmoji').textContent = pick(ANDY_TYPES).emoji;
    sfx.tick();
    i++;
    await sleep(70);
  }
  bar.style.width = '100%';
}

function reveal(r) {
  setState('revealed');
  $('andyScan').classList.add('hidden');
  $('andyEmoji').textContent = r.type.emoji;
  $('andyKicker').textContent = `Result ${resultNo(r.no)} · YOU ARE…`;
  $('andyName').textContent = r.type.name;
  $('andyLine').textContent = r.type.line;
  $('andyPower').textContent = r.type.power;
  $('andyWeak').textContent = r.type.weakness;
  $('andyMission').textContent = r.type.mission;
  $('andyMeta').textContent = `🐾 Sidekick: ${r.sidekick}   ·   Andy-ness: ${r.andyness}%   ·   Heat: ${peppers(r.heat)}`;
  $('andyStats').classList.remove('hidden');
}

function ticketFor(r) {
  const label = (title, text) => [
    { kind: 'text', text: title, display: true, size: 22, align: 'left' },
    { kind: 'text', text, size: 22, weight: 600, align: 'left' },
    { kind: 'gap', h: 6 },
  ];
  return renderTicket([
    ...partyHeader('ANDY TYPE TEST'),
    { kind: 'row', left: `RESULT ${resultNo(r.no)}`, right: '🐾 CERTIFIED', size: 22, weight: 700 },
    { kind: 'rule', style: 'zigzag' },
    { kind: 'gap', h: 8 },
    { kind: 'text', text: 'YOU ARE…', size: 24, weight: 700 },
    { kind: 'text', text: r.type.emoji, size: 96 },
    { kind: 'text', text: r.type.name, display: true, size: 44 },
    { kind: 'gap', h: 8 },
    { kind: 'text', text: r.type.line, size: 26, weight: 700, box: true },
    { kind: 'gap', h: 12 },
    ...label('⚡ SUPERPOWER', r.type.power),
    ...label('💔 WEAKNESS', r.type.weakness),
    { kind: 'text', text: "TONIGHT'S MISSION", display: true, size: 26, invert: true },
    { kind: 'gap', h: 6 },
    { kind: 'text', text: r.type.mission, size: 24, weight: 700 },
    { kind: 'gap', h: 10 },
    { kind: 'rule', style: 'dash' },
    { kind: 'row', left: 'ANDY-NESS', right: `${r.andyness}%`, display: true, size: 24 },
    { kind: 'row', left: 'HEAT', right: peppers(r.heat), display: true, size: 24 },
    { kind: 'row', left: 'SIDEKICK', right: r.sidekick, display: true, size: 24 },
    ...partyFooter('Certified by Charlie & Farley 🐾'),
  ]);
}

function setPrintStatus(msg) {
  $('andyPrintStatus').textContent = msg;
}

async function printCurrent() {
  if (!current) return;
  await ensureFonts();
  const ticket = rememberTicket(ticketFor(current));
  if (printerStatus.phase !== 'ready') {
    setPrintStatus(printerStatus.phase === 'printing' ? '⏳ Printer is busy, hang on…' : '📵 Printer offline. Screenshot it!');
    return;
  }
  setPrintStatus('🖨️ Printing your certificate…');
  try {
    await printCanvas(ticket, (sent, total) => setPrintStatus(`🖨️ Printing… ${Math.round((100 * sent) / total)}%`));
    setPrintStatus('✅ Grab your certificate! 👑');
  } catch (e) {
    setPrintStatus(`⚠️ Print failed: ${e.message}`);
  }
}

// ------------------------------------------------------------ flow

function showActions() {
  $('andyBtn').classList.toggle('hidden', !!current);
  $('andyBtn').disabled = scanning;
  $('andyDoneBtn').classList.toggle('hidden', !current);
  $('andyReprintBtn').classList.toggle('hidden', !current);
}

async function findMyAndy() {
  if (scanning || current) return;
  scanning = true;
  sfx.unlock();
  showActions();
  setPrintStatus('');
  const r = pickAndy(kiosk.recent);
  kiosk.recent = r.recent;
  r.no = ++kiosk.resultNo;
  save();

  await scan();
  current = r;
  scanning = false;
  reveal(r);
  showActions();
  $('andyDoneBtn').scrollIntoView({ behavior: 'smooth', block: 'end' });
  confetti();
  sfx.tada();
  printCurrent();
  clearTimeout(resetTimer);
  resetTimer = setTimeout(nextPerson, RESET_AFTER_MS);
}

function nextPerson() {
  clearTimeout(resetTimer);
  if (!current) return;
  current = null;
  setPrintStatus('');
  idle();
  showActions();
}

export function initAndyType() {
  $('andyBtn').onclick = findMyAndy;
  $('andyDoneBtn').onclick = () => {
    sfx.cheer();
    nextPerson();
  };
  $('andyReprintBtn').onclick = printCurrent;
  idle();
  showActions();
}
