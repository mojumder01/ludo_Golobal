// Small synthesized sound-effect kit built on the Web Audio API.
// No external audio assets — every sound is generated at call time.

let ctx = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(context, { freq, start, duration, type = 'sine', gain = 0.2, freqEnd }) {
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + duration);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp).connect(context.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBurst(context, { start, duration, gain = 0.25, freq = 1200 }) {
  const bufferSize = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const amp = context.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);

  noise.connect(filter).connect(amp).connect(context.destination);
  noise.start(start);
  noise.stop(start + duration + 0.02);
}

// A single dice "tick" — used for every step of the counting animation.
export function playDiceTick(step = 0) {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  noiseBurst(context, { start: now, duration: 0.05, gain: 0.18, freq: 1400 + step * 60 });
}

// Landing on a normal value (1-5).
export function playRollNormal() {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  noiseBurst(context, { start: now, duration: 0.08, gain: 0.22, freq: 900 });
  tone(context, { start: now, duration: 0.1, freq: 300, type: 'triangle', gain: 0.12 });
}

// Landing on a 6 — a brighter little fanfare.
export function playRollSix() {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  noiseBurst(context, { start: now, duration: 0.07, gain: 0.2, freq: 1600 });
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    tone(context, { start: now + i * 0.07, duration: 0.18, freq, type: 'triangle', gain: 0.16 });
  });
}

// A token gets captured / "cut".
export function playCapture() {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  tone(context, { start: now, duration: 0.28, freq: 420, freqEnd: 80, type: 'sawtooth', gain: 0.22 });
  noiseBurst(context, { start: now, duration: 0.12, gain: 0.25, freq: 500 });
}

// A token reaches home.
export function playHome() {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
    tone(context, { start: now + i * 0.09, duration: 0.35, freq, type: 'sine', gain: 0.16 });
  });
}

// A player wins the game.
export function playWin() {
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(context, { start: now + i * 0.12, duration: 0.4, freq, type: 'triangle', gain: 0.18 });
  });
}
