import type { AppData, Notebook, Page } from './types';

const KEY = 'hobonichi.v1';
const CURRENT_VERSION = 1;

function emptyData(): AppData {
  return { version: CURRENT_VERSION, notebooks: [], pages: [] };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.notebooks || !parsed.pages) return emptyData();
    return parsed;
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error('saveData failed', e);
  }
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateJP(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

export function weekdayJP(iso: string): string {
  const wd = ['日', '月', '火', '水', '木', '金', '土'];
  return wd[new Date(iso).getDay()];
}

export function sortPagesByDate(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt - a.updatedAt));
}

export function pagesOf(data: AppData, notebookId: string): Page[] {
  return data.pages.filter((p) => p.notebookId === notebookId);
}

export function findNotebook(data: AppData, id: string): Notebook | undefined {
  return data.notebooks.find((n) => n.id === id);
}

export function findPage(data: AppData, id: string): Page | undefined {
  return data.pages.find((p) => p.id === id);
}
