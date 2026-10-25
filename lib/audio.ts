export type SfxKind =
  | "hit"
  | "miss"
  | "win"
  | "lose"
  | "tap"
  | "warn"
  | "slash"
  | "punch"
  | "kick"
  | "gun"
  | "boom"
  | "hurt"
  | "jump"
  | "pickup"
  | "heal"
  | "horn"
  | "ko"
  | "summon";

export type MusicTheme = "war" | "gun" | "brawl" | "calm";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function out(): AudioNode | null {
  return getCtx() ? master : null;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0,
  slideTo?: number,
) {
  const c = getCtx();
  const dest = out();
  if (!c || !dest) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const start = c.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration: number, volume: number, delay = 0, lowpass = 6000, highpass = 0) {
  const c = getCtx();
  const dest = out();
  if (!c || !dest) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = lowpass;
  const gain = c.createGain();
  const start = c.currentTime + delay;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  let node: AudioNode = src;
  if (highpass > 0) {
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    src.connect(hp);
    node = hp;
  }
  node.connect(lp).connect(gain).connect(dest);
  src.start(start);
  src.stop(start + duration + 0.02);
}

export function playSfx(kind: SfxKind, enabled: boolean) {
  if (!enabled) return;
  switch (kind) {
    case "hit":
      tone(520, 0.12, "square", 0.08);
      tone(780, 0.1, "square", 0.06, 0.05);
      break;
    case "slash":
      noise(0.14, 0.16, 0, 9000, 1800);
      tone(900, 0.12, "sawtooth", 0.04, 0, 300);
      break;
    case "punch":
      noise(0.08, 0.2, 0, 1800);
      tone(140, 0.12, "sine", 0.2, 0, 60);
      break;
    case "kick":
      noise(0.12, 0.22, 0, 1400);
      tone(100, 0.18, "sine", 0.26, 0, 40);
      break;
    case "gun":
      noise(0.16, 0.22, 0, 5000, 600);
      tone(220, 0.1, "square", 0.08, 0, 70);
      break;
    case "boom":
      noise(0.7, 0.4, 0, 900);
      tone(90, 0.6, "sine", 0.35, 0, 30);
      break;
    case "hurt":
      tone(240, 0.22, "sawtooth", 0.12, 0, 90);
      noise(0.1, 0.12, 0, 2500);
      break;
    case "jump":
      tone(260, 0.16, "triangle", 0.07, 0, 520);
      break;
    case "pickup":
      [659, 880].forEach((f, i) => tone(f, 0.1, "triangle", 0.08, i * 0.06));
      break;
    case "heal":
      [392, 494, 587, 784].forEach((f, i) => tone(f, 0.2, "sine", 0.09, i * 0.07));
      break;
    case "summon":
      tone(196, 0.5, "sawtooth", 0.08, 0, 392);
      tone(294, 0.5, "triangle", 0.08, 0.1, 588);
      break;
    case "horn":
      tone(147, 0.9, "sawtooth", 0.1, 0, 156);
      tone(220, 0.9, "sawtooth", 0.06, 0.02, 233);
      break;
    case "ko":
      tone(300, 0.4, "square", 0.1, 0, 60);
      noise(0.3, 0.18, 0, 1200);
      break;
    case "miss":
      tone(160, 0.2, "sawtooth", 0.07);
      break;
    case "win":
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.1, i * 0.1));
      break;
    case "lose":
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, "sawtooth", 0.07, i * 0.14));
      break;
    case "warn":
      tone(880, 0.1, "square", 0.07);
      break;
    default:
      tone(440, 0.05, "triangle", 0.05);
  }
}

interface ThemeDef {
  bpm: number;
  scale: number[];
  melody: number[];
  bassWave: OscillatorType;
  leadWave: OscillatorType;
  drums: (step: number) => void;
}

const THEMES: Record<MusicTheme, ThemeDef> = {
  // Pentatonic plucks over war drums, in the manner of an ancient Chinese march.
  war: {
    bpm: 92,
    scale: [146.8, 164.8, 196, 220, 246.9, 293.7, 329.6, 392],
    melody: [0, 2, 3, 2, 4, 3, 2, 0, 5, 4, 3, 2, 3, 2, 1, 0],
    bassWave: "triangle",
    leadWave: "triangle",
    drums: (s) => {
      if (s % 4 === 0) {
        tone(70, 0.35, "sine", 0.28, 0, 40);
        noise(0.2, 0.1, 0, 500);
      }
      if (s % 8 === 6) tone(90, 0.25, "sine", 0.2, 0, 50);
    },
  },
  // Tense minor drone with snare hits for a modern battlefield.
  gun: {
    bpm: 112,
    scale: [110, 123.5, 130.8, 164.8, 185, 196, 220, 246.9],
    melody: [0, 0, 3, 0, 2, 0, 4, 3, 0, 0, 5, 4, 3, 2, 1, 0],
    bassWave: "sawtooth",
    leadWave: "square",
    drums: (s) => {
      if (s % 4 === 0) tone(60, 0.2, "sine", 0.3, 0, 35);
      if (s % 4 === 2) noise(0.12, 0.14, 0, 7000, 1500);
      if (s % 2 === 1) noise(0.04, 0.05, 0, 9000, 5000);
    },
  },
  // Phrygian brass fanfare for the Roman arena.
  brawl: {
    bpm: 104,
    scale: [130.8, 138.6, 164.8, 174.6, 196, 207.7, 261.6, 277.2],
    melody: [0, 1, 0, 2, 3, 2, 1, 0, 4, 3, 2, 3, 5, 4, 3, 2],
    bassWave: "sawtooth",
    leadWave: "sawtooth",
    drums: (s) => {
      if (s % 2 === 0) tone(80, 0.25, "sine", 0.3, 0, 45);
      if (s % 4 === 3) noise(0.1, 0.12, 0, 4000, 800);
    },
  },
  calm: {
    bpm: 70,
    scale: [196, 220, 261.6, 293.7, 329.6, 392],
    melody: [0, 2, 4, 2, 1, 3, 5, 3],
    bassWave: "sine",
    leadWave: "sine",
    drums: () => {},
  },
};

export function startMusic(enabled: boolean, theme: MusicTheme = "calm") {
  stopMusic();
  if (!enabled) return;
  const t = THEMES[theme];
  let step = 0;
  const interval = 60000 / t.bpm / 2;
  musicTimer = setInterval(() => {
    const note = t.scale[t.melody[step % t.melody.length] % t.scale.length];
    t.drums(step);
    if (step % 2 === 0) tone(note / 2, interval / 500, t.bassWave, 0.05);
    if (step % 4 !== 3) tone(note, (interval / 1000) * 1.6, t.leadWave, theme === "calm" ? 0.025 : 0.035);
    if (step % 16 === 0) tone(note / 4, (interval / 1000) * 8, "sine", 0.05);
    step += 1;
  }, interval);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
