export type CoverTheme = 'beige' | 'navy' | 'rose' | 'sage' | 'mocha' | 'ink';
export type CalendarMode = 'wareki' | 'seireki';
export type Tag = 'meal' | 'outing' | 'happy' | 'play' | 'daily';
export type Stamp = 'moon' | 'sun' | 'rain' | 'ramen' | 'bubble' | 'sakura' | 'wave' | 'night';
export type PhotoFrame = 'plain' | 'polaroid' | 'masking' | 'film' | 'notebook';

export interface Page {
  id: string;
  notebookId: string;
  date: string; // YYYY-MM-DD
  text: string; // 一言（短め）
  tag?: Tag;
  stamp?: Stamp;
  photo?: string;
  frame: PhotoFrame;
  highlight: boolean;
  createdAt: number;
  updatedAt: number;
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
  { key: 'meal', emoji: '🍚', label: 'ごはん', bg: '#f5e9c5', ink: '#6a5530' },
  { key: 'outing', emoji: '🚶', label: 'おでかけ', bg: '#cfe3ee', ink: '#2f5060' },
  { key: 'happy', emoji: '✨', label: 'しあわせ', bg: '#fff4c2', ink: '#7d6420' },
  { key: 'play', emoji: '🎮', label: 'あそび', bg: '#f3c7d3', ink: '#6a2a3c' },
  { key: 'daily', emoji: '☁️', label: 'にちじょう', bg: '#d8d5cd', ink: '#4a4a48' },
];

export const STAMP_DEF: { key: Stamp; label: string }[] = [
  { key: 'moon', label: '🌙' },
  { key: 'sun', label: '☀️' },
  { key: 'rain', label: '🌧️' },
  { key: 'ramen', label: '🍜' },
  { key: 'bubble', label: '🫧' },
  { key: 'sakura', label: '🌸' },
  { key: 'wave', label: '🌊' },
  { key: 'night', label: '🌃' },
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
