const KEY = 'hobonichi.writefont.v1';

export type WriteFont = 'yusei' | 'kurenaido';

export const WRITE_FONT_DEF: { key: WriteFont; label: string; sample: string; cssFamily: string }[] = [
  {
    key: 'yusei',
    label: 'ペン書き',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Yusei Magic', 'Klee One', cursive",
  },
  {
    key: 'kurenaido',
    label: '万年筆',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Zen Kurenaido', 'Yusei Magic', cursive",
  },
];

export function loadWriteFont(): WriteFont {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'kurenaido' ? 'kurenaido' : 'yusei';
  } catch {
    return 'yusei';
  }
}

export function saveWriteFont(f: WriteFont): void {
  try {
    localStorage.setItem(KEY, f);
  } catch {
    /* noop */
  }
}

export function applyWriteFont(f: WriteFont = loadWriteFont()): void {
  document.body.dataset.writeFont = f;
}
