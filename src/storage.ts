import type { AppData, Notebook, Page, Tag } from './types';

const KEY = 'hobonichi.v1';
const CURRENT_VERSION = 2;

function emptyData(): AppData {
  return { version: CURRENT_VERSION, notebooks: [], pages: [] };
}

interface LegacyPageV1 {
  id: string;
  notebookId: string;
  date: string;
  text: string;
  stamps?: string[];
  stamp?: string;
  tags?: string[];
  tag?: string;
  photo?: string;
  frame?: string;
  highlight: boolean;
  createdAt: number;
  updatedAt: number;
}

const LEGACY_TAG_MAP: Record<string, Tag> = {
  '食': 'meal',
  '食事': 'meal',
  'ごはん': 'meal',
  'おでかけ': 'outing',
  '旅行': 'outing',
  'しあわせ': 'happy',
  '幸せ': 'happy',
  '遊び': 'play',
  'あそび': 'play',
  '日常': 'daily',
  'にちじょう': 'daily',
};

function migrate(raw: { version?: number; notebooks?: unknown[]; pages?: unknown[] }): AppData {
  if (!raw.notebooks || !raw.pages) return emptyData();

  const notebooks: Notebook[] = (raw.notebooks as Partial<Notebook>[]).map((n) => ({
    id: n.id ?? Math.random().toString(36).slice(2),
    title: n.title ?? 'ノート',
    cover: n.cover ?? 'beige',
    calendarMode: n.calendarMode ?? 'seireki',
    createdAt: n.createdAt ?? Date.now(),
  }));

  const pages: Page[] = (raw.pages as LegacyPageV1[]).map((p) => {
    const stamp = (p.stamp ?? (p.stamps && p.stamps[0])) as Page['stamp'];
    const legacyTagSource = p.tag ?? (p.tags && p.tags[0]);
    let tag: Tag | undefined = undefined;
    if (legacyTagSource) {
      if (['meal', 'outing', 'happy', 'play', 'daily'].includes(legacyTagSource)) {
        tag = legacyTagSource as Tag;
      } else {
        tag = LEGACY_TAG_MAP[legacyTagSource];
      }
    }
    return {
      id: p.id,
      notebookId: p.notebookId,
      date: p.date,
      text: p.text ?? '',
      tag,
      stamp: stamp && ['moon', 'sun', 'rain', 'ramen', 'bubble', 'sakura', 'wave', 'night'].includes(stamp) ? stamp : undefined,
      photo: p.photo,
      frame: (['plain', 'polaroid', 'masking', 'film', 'notebook'].includes(p.frame ?? '')
        ? (p.frame as Page['frame'])
        : 'plain') as Page['frame'],
      highlight: !!p.highlight,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return { version: CURRENT_VERSION, notebooks, pages };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
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

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateSeireki(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

export function formatDateWareki(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d).getTime();
  let era: string;
  let eraYear: number;
  if (date >= new Date(2019, 4, 1).getTime()) {
    era = '令和';
    eraYear = y - 2018;
  } else if (date >= new Date(1989, 0, 8).getTime()) {
    era = '平成';
    eraYear = y - 1988;
  } else if (date >= new Date(1926, 11, 25).getTime()) {
    era = '昭和';
    eraYear = y - 1925;
  } else if (date >= new Date(1912, 6, 30).getTime()) {
    era = '大正';
    eraYear = y - 1911;
  } else {
    era = '明治';
    eraYear = y - 1867;
  }
  const ey = eraYear === 1 ? '元' : String(eraYear);
  return `${era}${ey}年${m}月${d}日`;
}

export function formatDate(iso: string, mode: 'wareki' | 'seireki'): string {
  return mode === 'wareki' ? formatDateWareki(iso) : formatDateSeireki(iso);
}

export function weekdayJP(iso: string): string {
  return ['日', '月', '火', '水', '木', '金', '土'][isoToDate(iso).getDay()];
}

export function sortPagesByDate(pages: Page[]): Page[] {
  return [...pages].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.updatedAt - a.updatedAt,
  );
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
