import { hasBluetooth, onPrinterChange, connectPrinter, disconnectPrinter, feedPaper, printCanvas, canvasToDots, dotsPreview, settings, saveSettings, status, getLastTicket } from './party-printer.js';
import { renderTicket, ensureFonts, partyHeader, partyFooter } from './ticket.js';
import { initDoOrDrink } from './games/do-or-drink.js';
import { initAndyType } from './games/andy-type.js';
import { initNameSticker } from './games/name-sticker.js';
import { toast, sfx, confetti } from './fx.js';

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------ routing

const VIEWS = { '': 'view-hub', '#do-or-drink': 'view-dod', '#andy-type': 'view-andy', '#i-was-here': 'view-sticker' };

function route() {
  const id = VIEWS[location.hash] ?? 'view-hub';
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== id));
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

// ------------------------------------------------------------ printer pill

function pillText(s) {
  if (!hasBluetooth) return '🚫 No Bluetooth';
  if (s.phase === 'connecting') return '⏳ Connecting…';
  if (s.phase === 'disconnected') return '🖨️ Connect printer';
  if (s.noPaper) return '🧻 Out of paper!';
  const bat = s.battery != null ? ` · 🔋${s.battery}%` : '';
  return s.phase === 'printing' ? `🖨️ Printing…${bat}` : `🟢 Printer ready${bat}`;
}

onPrinterChange((s) => {
  const pill = $('printerPill');
  pill.textContent = pillText(s);
  pill.dataset.phase = hasBluetooth ? (s.noPaper ? 'warn' : s.phase) : 'warn';
  $('sheetState').textContent = s.phase === 'disconnected' ? 'Not connected' : `${s.name || 'AH-M2'} · ${s.phase}${s.battery != null ? ` · battery ${s.battery}%` : ''}`;
  $('sheetConnect').classList.toggle('hidden', s.phase !== 'disconnected');
  $('sheetDisconnect').classList.toggle('hidden', s.phase === 'disconnected');
});

async function connect() {
  sfx.unlock();
  try {
    await connectPrinter();
    toast('Printer connected! Let the chaos begin 🎉');
    confetti(60);
  } catch (e) {
    if (e.name !== 'NotFoundError') toast(`Couldn't connect: ${e.message}`);
  }
}

$('printerPill').onclick = () => {
  if (!hasBluetooth) {
    $('btWarn').classList.remove('hidden');
    return;
  }
  if (status.phase === 'disconnected') connect();
  else openSheet();
};
$('settingsBtn').onclick = openSheet;

// ------------------------------------------------------------ printer sheet

function openSheet() {
  $('density').value = settings.density;
  $('densityOut').textContent = settings.density;
  const last = getLastTicket();
  const box = $('lastTicket');
  box.replaceChildren();
  if (last) {
    box.append(dotsPreview(canvasToDots(last), last.width, last.height));
  } else {
    box.textContent = 'Play a game to see its ticket here.';
  }
  $('printerSheet').showModal();
}

$('density').oninput = () => ($('densityOut').textContent = $('density').value);
$('density').onchange = () => saveSettings({ density: +$('density').value });
$('sheetConnect').onclick = connect;
$('sheetDisconnect').onclick = disconnectPrinter;
$('feedBtn').onclick = () => feedPaper().catch((e) => toast(e.message));
$('testBtn').onclick = async () => {
  try {
    await ensureFonts();
    await printCanvas(renderTicket([
      ...partyHeader('PRINTER CHECK'),
      { kind: 'text', text: '🖨️ ✅ 🍾', size: 64 },
      { kind: 'text', text: 'Ready to party!', display: true, size: 40 },
      ...partyFooter(`Density ${settings.density}`),
    ]));
  } catch (e) {
    toast(e.message);
  }
};
document.querySelectorAll('dialog [data-close]').forEach((b) => (b.onclick = () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => e.target === d && d.close()));

// ------------------------------------------------------------ tablet niceties

if (!hasBluetooth) $('btWarn').classList.remove('hidden');
$('btWarnClose').onclick = () => $('btWarn').classList.add('hidden');

$('fsBtn').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
};

// Keep the tablet screen on during the party.
let wakeLock = null;
async function keepAwake() {
  try {
    if (!wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    }
  } catch {}
}
document.addEventListener('pointerdown', keepAwake, { once: true });
document.addEventListener('visibilitychange', keepAwake);

initDoOrDrink();
initAndyType();
initNameSticker();
route();
