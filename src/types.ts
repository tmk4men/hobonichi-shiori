export type CoverTheme = 'beige' | 'navy' | 'rose' | 'sage' | 'mocha' | 'ink';

export type Stamp =
  | 'love' | 'happy' | 'sad' | 'tired' | 'sparkle'
  | 'rain' | 'sun' | 'coffee' | 'flower' | 'star'
  | 'cake' | 'camera' | 'book' | 'moon' | 'note';

export interface Page {
  id: string;
  notebookId: string;
  date: string; // YYYY-MM-DD
  text: string;
  stamps: Stamp[];
  photo?: string; // dataURL
  tags: string[];
  highlight: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  cover: CoverTheme;
  createdAt: number;
}

export interface AppData {
  version: number;
  notebooks: Notebook[];
  pages: Page[];
}

export const STAMP_LIST: { key: Stamp; label: string }[] = [
  { key: 'love', label: '💖' },
  { key: 'happy', label: '😊' },
  { key: 'sad', label: '🥲' },
  { key: 'tired', label: '😴' },
  { key: 'sparkle', label: '✨' },
  { key: 'rain', label: '🌧' },
  { key: 'sun', label: '🌞' },
  { key: 'coffee', label: '☕' },
  { key: 'flower', label: '🌸' },
  { key: 'star', label: '⭐' },
  { key: 'cake', label: '🍰' },
  { key: 'camera', label: '📷' },
  { key: 'book', label: '📖' },
  { key: 'moon', label: '🌙' },
  { key: 'note', label: '🎵' },
];

export const COVER_THEMES: { key: CoverTheme; label: string; bg: string; ink: string }[] = [
  { key: 'beige', label: 'きなり', bg: '#e8dfca', ink: '#5a4a32' },
  { key: 'navy', label: 'こん', bg: '#283449', ink: '#e9e3d1' },
  { key: 'rose', label: 'さくら', bg: '#e7c4c0', ink: '#5e2f33' },
  { key: 'sage', label: 'よもぎ', bg: '#aebca0', ink: '#2f3a2a' },
  { key: 'mocha', label: 'もか', bg: '#a98b6f', ink: '#fff6e7' },
  { key: 'ink', label: 'すみ', bg: '#1d1d1d', ink: '#e7e0c8' },
];
