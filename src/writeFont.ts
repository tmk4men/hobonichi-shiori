import { isPremium } from './premium';

const KEY = 'hobonichi.writefont.v1';

export type WriteFont = 'yusei' | 'kurenaido' | 'klee' | 'yomogi' | 'hachimaru' | 'kaisei';

export interface WriteFontDef {
  key: WriteFont;
  label: string;
  sample: string;
  cssFamily: string;
  locked?: boolean;
}

export const WRITE_FONT_DEF: WriteFontDef[] = [
  // 無料
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
  // 有料解放
  {
    key: 'klee',
    label: 'えんぴつ',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Klee One', 'Yusei Magic', cursive",
    locked: true,
  },
  {
    key: 'yomogi',
    label: 'マーカー',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Yomogi', 'Yusei Magic', cursive",
    locked: true,
  },
  {
    key: 'hachimaru',
    label: 'まる文字',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Hachi Maru Pop', 'Yusei Magic', cursive",
    locked: true,
  },
  {
    key: 'kaisei',
    label: '行書ふう',
    sample: 'あいうえお かきくけこ',
    cssFamily: "'Kaisei Decol', 'Shippori Mincho B1', serif",
    locked: true,
  },
];

export function isFreeFont(key: WriteFont): boolean {
  return !WRITE_FONT_DEF.find((f) => f.key === key)?.locked;
}

export function isFontUsable(key: WriteFont): boolean {
  return isFreeFont(key) || isPremium();
}

export function loadWriteFont(): WriteFont {
  try {
    const v = localStorage.getItem(KEY) as WriteFont | null;
    if (v && WRITE_FONT_DEF.some((f) => f.key === v) && isFontUsable(v)) return v;
    return 'yusei';
  } catch {
    return 'yusei';
  }
}

export function saveWriteFont(f: WriteFont): void {
  if (!isFontUsable(f)) return; // 未解放のものは保存しない
  try {
    localStorage.setItem(KEY, f);
  } catch {
    /* noop */
  }
}

export function applyWriteFont(f: WriteFont = loadWriteFont()): void {
  document.body.dataset.writeFont = f;
}
