export type CoverTheme = 'beige' | 'navy' | 'rose' | 'sage' | 'mocha' | 'ink';
export type CalendarMode = 'wareki' | 'seireki';
export type Tag = 'meal' | 'outing' | 'happy' | 'play' | 'daily';
export type Stamp = 'sun' | 'moon' | 'rain' | 'happy' | 'sleep' | 'tea';
export type PhotoFrame = 'plain' | 'polaroid' | 'masking' | 'film' | 'notebook';

export interface Page {
  id: string;
  notebookId: string;
  date: string; // YYYY-MM-DD
  // 左ページ
  text: string;
  photo?: string;
  photoCaption?: string;
  frame: PhotoFrame;
  // 右ページ（任意）
  textRight?: string;
  photoRight?: string;
  photoCaptionRight?: string;
  frameRight?: PhotoFrame;
  // 共通
  tag?: Tag;
  stamp?: Stamp;
  highlight: boolean;
  createdAt: number;
  updatedAt: number;
  viewCount: number;
  lastViewedAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  cover: CoverTheme;
  calendarMode: CalendarMode;
  createdAt: number;
}

export interface AppData {
  version: number;
  notebooks: Notebook[];
  pages: Page[];
}

export const TAG_DEF: { key: Tag; emoji: string; label: string; bg: string; ink: string }[] = [
  { key: 'meal', emoji: '🍚', label: 'ごはん', bg: '#efe1bd', ink: '#6e5832' },
  { key: 'outing', emoji: '🚶', label: 'おでかけ', bg: '#c7dbe5', ink: '#345564' },
  { key: 'happy', emoji: '✨', label: 'しあわせ', bg: '#f3eab8', ink: '#7a6428' },
  { key: 'play', emoji: '🎮', label: 'あそび', bg: '#e9c1cb', ink: '#6e2f3f' },
  { key: 'daily', emoji: '☁️', label: 'にちじょう', bg: '#d2cfc6', ink: '#4f4f4c' },
];

export const STAMP_DEF: { key: Stamp; label: string; meaning: string }[] = [
  { key: 'sun', label: '☀️', meaning: 'はれ' },
  { key: 'moon', label: '🌙', meaning: 'よる' },
  { key: 'rain', label: '🌧️', meaning: 'あめ' },
  { key: 'happy', label: '😊', meaning: 'にこ' },
  { key: 'sleep', label: '😴', meaning: 'ねむ' },
  { key: 'tea', label: '🍵', meaning: 'ほっと' },
];

export const FRAME_DEF: { key: PhotoFrame; label: string }[] = [
  { key: 'plain', label: 'そのまま' },
  { key: 'polaroid', label: 'ポラ' },
  { key: 'masking', label: 'マステ' },
  { key: 'film', label: 'フィルム' },
  { key: 'notebook', label: '手帳' },
];

export const COVER_THEMES: { key: CoverTheme; label: string; bg: string; ink: string }[] = [
  { key: 'beige', label: 'きなり', bg: '#e8dfca', ink: '#5a4a32' },
  { key: 'navy', label: 'こん', bg: '#283449', ink: '#e9e3d1' },
  { key: 'rose', label: 'さくら', bg: '#e7c4c0', ink: '#5e2f33' },
  { key: 'sage', label: 'よもぎ', bg: '#aebca0', ink: '#2f3a2a' },
  { key: 'mocha', label: 'もか', bg: '#a98b6f', ink: '#fff6e7' },
  { key: 'ink', label: 'すみ', bg: '#1d1d1d', ink: '#e7e0c8' },
];

export const TAG_BY_KEY: Record<Tag, typeof TAG_DEF[number]> = Object.fromEntries(
  TAG_DEF.map((t) => [t.key, t]),
) as Record<Tag, typeof TAG_DEF[number]>;

export const STAMP_BY_KEY: Record<Stamp, typeof STAMP_DEF[number]> = Object.fromEntries(
  STAMP_DEF.map((s) => [s.key, s]),
) as Record<Stamp, typeof STAMP_DEF[number]>;
