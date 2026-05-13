// WebAudio で軽量に合成する効果音
// 設定でオフ可能。ライセンスフリー（合成）

const KEY = 'hobonichi.sfx.v1';

let _ctx: AudioContext | null = null;
let _muted: boolean = (() => {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
})();

let lastWriteAt = 0;

function ctx(): AudioContext | null {
  if (_muted) return null;
  if (_ctx) return _ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _ctx = new AC();
    return _ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  return _muted;
}
export function setMuted(m: boolean): void {
  _muted = m;
  try {
    localStorage.setItem(KEY, m ? 'off' : 'on');
  } catch {
    /* noop */
  }
}

function noiseBuffer(c: AudioContext, durationSec: number, decay = 3) {
  const len = Math.floor(c.sampleRate * durationSec);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.exp(-t * decay);
    ch[i] = (Math.random() * 2 - 1) * env;
  }
  return buf;
}

function playNoise(c: AudioContext, dur: number, decay: number, hpf: number, gain: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur, decay);
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hpf;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

// 紙めくり音（録音版・タダノオト）
let _pageFlipBuf: AudioBuffer | null = null;
let _pageFlipLoading = false;

async function loadPageFlipBuffer(c: AudioContext): Promise<AudioBuffer | null> {
  if (_pageFlipBuf) return _pageFlipBuf;
  if (_pageFlipLoading) return null;
  _pageFlipLoading = true;
  try {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
    const res = await fetch(`${base}sfx/page-flip.mp3`);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const arr = await res.arrayBuffer();
    _pageFlipBuf = await c.decodeAudioData(arr.slice(0));
    return _pageFlipBuf;
  } catch {
    return null;
  } finally {
    _pageFlipLoading = false;
  }
}

export function playPageFlip(): void {
  const c = ctx();
  if (!c) return;
  // 録音音源を再生（読み込み中は合成音で代替）
  loadPageFlipBuffer(c).then((buf) => {
    if (!buf) return;
  });
  if (_pageFlipBuf) {
    const src = c.createBufferSource();
    src.buffer = _pageFlipBuf;
    const g = c.createGain();
    g.gain.value = 0.6;
    src.connect(g).connect(c.destination);
    try {
      src.start();
    } catch {
      /* noop */
    }
    return;
  }
  // フォールバック（録音未ロード時の合成音）
  playNoise(c, 0.18, 4, 2400, 0.22);
}

export function playBookOpen(): void {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  // 低めのコトッ（表紙が起き上がる）
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
  const og = c.createGain();
  og.gain.setValueAtTime(0.25, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(og).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.25);
  // 紙ずれノイズを少し遅らせて
  setTimeout(() => {
    const cc = ctx();
    if (cc) playNoise(cc, 0.22, 3, 1800, 0.16);
  }, 180);
}

export function playWrite(): void {
  const c = ctx();
  if (!c) return;
  // 連打すると煩いので、150ms 間隔以下で間引く
  const now = performance.now();
  if (now - lastWriteAt < 60) return;
  lastWriteAt = now;
  // ペン先のカリッ音（ごく短い高音ノイズ）
  playNoise(c, 0.025, 30, 3000, 0.10);
}

export function playStamp(): void {
  const c = ctx();
  if (!c) return;
  // スタンプを押す音：低音 + 短いノイズ
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 120;
  const og = c.createGain();
  og.gain.setValueAtTime(0.4, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(og).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.1);
  playNoise(c, 0.06, 8, 1500, 0.18);
}

export function playUnlock(): void {
  const c = ctx();
  if (!c) return;
  // ロック解除：柔らかなカチッ
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 880;
  const og = c.createGain();
  og.gain.setValueAtTime(0.22, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(og).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

// 起動時にユーザー操作で AudioContext を resume したいので呼べるように
export function unlockAudio(): void {
  const c = _ctx;
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
}
