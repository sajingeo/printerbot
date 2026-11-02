// Party effects: confetti, little sounds and toasts.

const COLORS = ['#ff3d8b', '#ffd23f', '#2ec4b6', '#7b2ff7', '#ff8c42', '#3a86ff'];
const EMOJI = ['🎉', '🍻', '🎂', '✨', '💖', '🥳'];

let parts = [];
let raf = 0;

export function confetti(n = 140) {
  const c = document.getElementById('confetti');
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < n; i++) {
    const emoji = Math.random() < 0.18;
    parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 14,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      s: emoji ? 22 + Math.random() * 14 : 7 + Math.random() * 7,
      color: COLORS[i % COLORS.length],
      emoji: emoji ? EMOJI[i % EMOJI.length] : null,
      life: 0,
    });
  }
  if (!raf) raf = requestAnimationFrame(function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      if (p.emoji) {
        ctx.font = `${p.s}px sans-serif`;
        ctx.fillText(p.emoji, -p.s / 2, p.s / 2);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      }
      ctx.restore();
    }
    parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 400);
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  });
}

// ------------------------------------------------------------ sounds

let audio = null;
const ac = () => {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch {}
  return audio;
};

function tone(freq, start, dur, type = 'square', gain = 0.06) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

export const sfx = {
  unlock: () => ac(),
  tick: () => tone(700 + Math.random() * 500, 0, 0.05, 'square', 0.03),
  tada: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.09)),
  cheer: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle', 0.08)),
  glug: () => [300, 240, 190].forEach((f, i) => tone(f, i * 0.12, 0.14, 'sine', 0.12)),
};

// ------------------------------------------------------------ toast

let toastTimer = 0;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
