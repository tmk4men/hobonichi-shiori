const KEY = 'hobonichi.icon.v1';

export type IconChoice = 'a' | 'b';

export function loadIconChoice(): IconChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'b' ? 'b' : 'a';
  } catch {
    return 'a';
  }
}

export function saveIconChoice(c: IconChoice): void {
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* noop */
  }
}

export function iconUrl(c: IconChoice): string {
  return `${import.meta.env.BASE_URL}icons/icon-${c}.webp`;
}
