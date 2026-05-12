import type { AppData, Notebook, Page, Stamp, Tag } from './types';
import { STAMP_BY_KEY, TAG_BY_KEY, TAG_DEF } from './types';

const KEY = 'hobonichi.v1';
const CURRENT_VERSION = 3;

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
  viewCount?: number;
  lastViewedAt?: number;
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
      stamp: stamp && ['moon', 'sun', 'rain', 'ramen', 'bubble', 'sakura', 'wave', 'night'].includes(stamp) ? (stamp as Page['stamp']) : undefined,
      photo: p.photo,
      frame: (['plain', 'polaroid', 'masking', 'film', 'notebook'].includes(p.frame ?? '')
        ? (p.frame as Page['frame'])
        : 'plain') as Page['frame'],
      highlight: !!p.highlight,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      viewCount: p.viewCount ?? 1,
      lastViewedAt: p.lastViewedAt ?? p.updatedAt,
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

export type HighlightKind =
  | 'yearAgo'
  | 'recentMood'
  | 'frequented'
  | 'savedAnniversary'
  | 'longUnseen'
  | 'season'
  | 'tagThread';

export interface HighlightCard {
  id: string;
  kind: HighlightKind;
  title: string;
  pages: Page[];
}

const DAY = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function seasonOf(month: number): string {
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

export function buildHighlights(data: AppData, now: number = Date.now()): HighlightCard[] {
  const cards: HighlightCard[] = [];
  const pages = data.pages;
  if (pages.length === 0) return cards;

  const today = new Date(now);
  const mm = pad(today.getMonth() + 1);
  const dd = pad(today.getDate());

  // ① 1年前の今日
  const yearAgoYear = today.getFullYear() - 1;
  const yearAgoPages = pages.filter((p) => p.date === `${yearAgoYear}-${mm}-${dd}`);
  if (yearAgoPages.length) {
    cards.push({
      id: 'yearAgo',
      kind: 'yearAgo',
      title: '1年前の 今日',
      pages: yearAgoPages.slice(0, 3),
    });
  }

  // ② 最近の空気感（直近30日で最多のスタンプ・タグ）
  const cutoff30 = isoOf(new Date(now - 30 * DAY));
  const recent = pages.filter((p) => p.date >= cutoff30);
  if (recent.length >= 5) {
    const stampCount = new Map<Stamp, number>();
    for (const p of recent) {
      if (p.stamp) stampCount.set(p.stamp, (stampCount.get(p.stamp) ?? 0) + 1);
    }
    const topStamp = [...stampCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topStamp && topStamp[1] >= 3) {
      const info = STAMP_BY_KEY[topStamp[0]];
      cards.push({
        id: `recent-stamp-${topStamp[0]}`,
        kind: 'recentMood',
        title: `さいきん ${info.label} が おおいみたい`,
        pages: recent.filter((p) => p.stamp === topStamp[0]).slice(0, 3),
      });
    }
    const tagCount = new Map<Tag, number>();
    for (const p of recent) {
      if (p.tag) tagCount.set(p.tag, (tagCount.get(p.tag) ?? 0) + 1);
    }
    const topTag = [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topTag && topTag[1] >= 3) {
      const info = TAG_BY_KEY[topTag[0]];
      cards.push({
        id: `recent-tag-${topTag[0]}`,
        kind: 'recentMood',
        title: `さいきん ${info.label} のページが つづいている`,
        pages: recent.filter((p) => p.tag === topTag[0]).slice(0, 3),
      });
    }
  }

  // ③ よく見返している
  const frequented = [...pages]
    .filter((p) => p.viewCount >= 5)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 3);
  if (frequented.length) {
    cards.push({
      id: 'frequented',
      kind: 'frequented',
      title: '何度も 見返している ページ',
      pages: frequented,
    });
  }

  // ④ 保存から1年・半年（節目）
  const range = (centerDaysAgo: number, slack: number) => {
    const lo = now - (centerDaysAgo + slack) * DAY;
    const hi = now - (centerDaysAgo - slack) * DAY;
    return pages.filter((p) => p.createdAt >= lo && p.createdAt <= hi).slice(0, 3);
  };
  const oneYear = range(365, 3);
  if (oneYear.length) {
    cards.push({
      id: 'saved-1y',
      kind: 'savedAnniversary',
      title: '1年前に のこした ページ',
      pages: oneYear,
    });
  }
  const halfYear = range(183, 3);
  if (halfYear.length) {
    cards.push({
      id: 'saved-6m',
      kind: 'savedAnniversary',
      title: '半年前に のこした ページ',
      pages: halfYear,
    });
  }

  // ⑤ ひさしぶり（60日以上 開いていない・記入から60日以上経過）
  const sixtyAgo = now - 60 * DAY;
  const sixtyAgoIso = isoOf(new Date(sixtyAgo));
  const longUnseen = [...pages]
    .filter((p) => p.lastViewedAt < sixtyAgo && p.date < sixtyAgoIso)
    .sort((a, b) => a.lastViewedAt - b.lastViewedAt)
    .slice(0, 3);
  if (longUnseen.length) {
    cards.push({
      id: 'long-unseen',
      kind: 'longUnseen',
      title: 'ひさしぶりの ページ',
      pages: longUnseen,
    });
  }

  // ⑥ 季節の再会（同じ月、過去）
  const thisYear = String(today.getFullYear());
  const seasonPages = pages
    .filter((p) => {
      const [y, m] = p.date.split('-');
      return m === mm && y !== thisYear;
    })
    .slice(0, 3);
  if (seasonPages.length) {
    const sname = seasonOf(today.getMonth() + 1);
    cards.push({
      id: 'season',
      kind: 'season',
      title: `${sname}の 空気の ページ`,
      pages: seasonPages,
    });
  }

  // ⑦ タグごとの再会（タグ蓄積5件以上）
  for (const t of TAG_DEF) {
    const tagPages = pages.filter((p) => p.tag === t.key);
    if (tagPages.length >= 5) {
      const sample = [...tagPages]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 3);
      cards.push({
        id: `tag-${t.key}`,
        kind: 'tagThread',
        title: `${t.label} の しおり`,
        pages: sample,
      });
    }
  }

  return cards;
}

// 安定したシードで配列から1つ選ぶ（同じ日は同じカード）
export function pickBookmarkOfTheDay(cards: HighlightCard[]): HighlightCard | undefined {
  if (cards.length === 0) return undefined;
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return cards[seed % cards.length];
}

export function incrementView(data: AppData, pageId: string): AppData {
  return {
    ...data,
    pages: data.pages.map((p) =>
      p.id === pageId
        ? { ...p, viewCount: (p.viewCount ?? 0) + 1, lastViewedAt: Date.now() }
        : p,
    ),
  };
}
