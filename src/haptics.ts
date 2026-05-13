// 軽量バイブレーション。navigator.vibrate に対応する環境（主にAndroid）で発火。
// 非対応環境（iOS Safari / 一部PWA）では黙ってno-op。
// 設定で off にできる。

const STORE_KEY = 'haptics.enabled';

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (!nav.vibrate) return;
  try {
    nav.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function isHapticsEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean) {
  try {
    localStorage.setItem(STORE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}

// タップ（軽い）
export function hapticTap() {
  if (!isHapticsEnabled()) return;
  vibrate(10);
}

// インパクト（少し強め）
export function hapticImpact() {
  if (!isHapticsEnabled()) return;
  vibrate(20);
}

// 成功（短2連）
export function hapticSuccess() {
  if (!isHapticsEnabled()) return;
  vibrate([10, 40, 10]);
}

// エラー（強1連）
export function hapticError() {
  if (!isHapticsEnabled()) return;
  vibrate(60);
}
