// 見た目（テーマ/文字サイズ）の永続化と適用
const THEME_KEY = 'hobonichi.theme';
const SCALE_KEY = 'hobonichi.textScale';

export type Theme = 'light' | 'dark';
export type TextScale = 'small' | 'medium' | 'large';

export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* noop */
  }
}

export function applyTheme(t: Theme = loadTheme()) {
  if (typeof document === 'undefined') return;
  document.body.dataset.theme = t;
}

export function loadTextScale(): TextScale {
  try {
    const v = localStorage.getItem(SCALE_KEY);
    if (v === 'small' || v === 'large') return v;
    return 'medium';
  } catch {
    return 'medium';
  }
}

export function saveTextScale(s: TextScale) {
  try {
    localStorage.setItem(SCALE_KEY, s);
  } catch {
    /* noop */
  }
}

export function applyTextScale(s: TextScale = loadTextScale()) {
  if (typeof document === 'undefined') return;
  document.body.dataset.textScale = s;
}
