import { useMemo, useState } from 'react';
import type { AppData, CalendarMode, Page, Tag } from '../types';
import { COVER_THEMES, STAMP_BY_KEY, TAG_BY_KEY, TAG_DEF } from '../types';
import {
  findNotebook,
  formatDate,
  newId,
  pagesOf,
  sortPagesByDate,
  todayStr,
  weekdayJP,
} from '../storage';
import Emoji from './Emoji';
import ConfirmDialog from './ConfirmDialog';

const MAX_PAGES_PER_NOTEBOOK = 45;

interface Props {
  data: AppData;
  notebookId: string;
  onBack: () => void;
  onOpenPage: (pageId: string) => void;
  onChange: (next: AppData) => void;
}

export default function NotebookView({ data, notebookId, onBack, onOpenPage, onChange }: Props) {
  const nb = findNotebook(data, notebookId);
  const pages = sortPagesByDate(pagesOf(data, notebookId));
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(nb?.title ?? '');
  const [showSettings, setShowSettings] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<Tag | 'all'>('all');

  const tagsUsed = useMemo(() => {
    const set = new Set<Tag>();
    pages.forEach((p) => { if (p.tag) set.add(p.tag); });
    return TAG_DEF.filter((t) => set.has(t.key));
  }, [pages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((p) => {
      if (tagFilter !== 'all' && p.tag !== tagFilter) return false;
      if (!q) return true;
      const hay = [
        p.text,
        p.textRight ?? '',
        p.photoCaption ?? '',
        p.photoCaptionRight ?? '',
        p.date,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [pages, query, tagFilter]);

  if (!nb) {
    return (
      <div className="page-screen">
        <p>このノートは見つかりませんでした。</p>
        <button onClick={onBack}>もどる</button>
      </div>
    );
  }

  const theme = COVER_THEMES.find((t) => t.key === nb.cover)!;

  const atPageLimit = pages.length >= MAX_PAGES_PER_NOTEBOOK;

  const addPage = () => {
    const today = todayStr();
    const existing = pages.find((p) => p.date === today);
    if (existing) {
      onOpenPage(existing.id);
      return;
    }
    if (atPageLimit) return;
    const page: Page = {
      id: newId(),
      notebookId,
      date: today,
      text: '',
      frame: 'plain',
      highlight: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewCount: 1,
      lastViewedAt: Date.now(),
    };
    onChange({ ...data, pages: [...data.pages, page] });
    onOpenPage(page.id);
  };

  const saveTitle = () => {
    const t = titleDraft.trim() || nb.title;
    onChange({
      ...data,
      notebooks: data.notebooks.map((x) => (x.id === nb.id ? { ...x, title: t } : x)),
    });
    setEditingTitle(false);
  };

  const setCalendarMode = (mode: CalendarMode) => {
    onChange({
      ...data,
      notebooks: data.notebooks.map((x) => (x.id === nb.id ? { ...x, calendarMode: mode } : x)),
    });
  };

  const removeNotebook = () => {
    onChange({
      ...data,
      notebooks: data.notebooks.filter((x) => x.id !== nb.id),
      pages: data.pages.filter((p) => p.notebookId !== nb.id),
    });
    onBack();
  };

  return (
    <div className="notebook-screen" style={{ background: theme.bg, color: theme.ink }}>
      <header className="appbar">
        <button className="link" onClick={onBack}>
          ← 本棚
        </button>
        {editingTitle ? (
          <input
            autoFocus
            className="title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            maxLength={40}
          />
        ) : (
          <h1 onClick={() => { setTitleDraft(nb.title); setEditingTitle(true); }}>{nb.title}</h1>
        )}
        <button className="link" onClick={() => setShowSettings(true)}>
          ⋯
        </button>
      </header>

      {atPageLimit ? (
        <p className="quiet-limit">
          このノートは {MAX_PAGES_PER_NOTEBOOK}ページで いっぱい。
          <br />
          <small>つづきは、もう一冊 ひらいて。</small>
        </p>
      ) : (
        <button className="add-today" onClick={addPage}>
          ＋ きょうの ページ をひらく
        </button>
      )}

      {pages.length === 0 ? (
        <div className="empty-state">
          <img src={`${import.meta.env.BASE_URL}illust/empty-notebook.svg`} alt="" />
          <p className="empty">
            まだ なにも書かれていない。
            <br />
            <small>きょうの ページから はじめてみる。</small>
          </p>
        </div>
      ) : view === 'calendar' ? (
        <CalendarView
          pages={pages}
          calendarMode={nb.calendarMode}
          onOpenPage={onOpenPage}
          onBackToList={() => setView('list')}
        />
      ) : (
        <>
          <div className="nb-toolbar">
            <div className="nb-view-tabs">
              <button
                className={`nb-view-tab${view === 'list' ? ' on' : ''}`}
                onClick={() => setView('list')}
              >
                もくじ
              </button>
              <button
                className="nb-view-tab"
                onClick={() => setView('calendar')}
              >
                カレンダー
              </button>
            </div>
            <input
              className="nb-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ひとことで さがす…"
            />
            {tagsUsed.length > 0 && (
              <div className="nb-tag-chips" role="tablist">
                <button
                  className={`nb-tag-chip${tagFilter === 'all' ? ' on' : ''}`}
                  onClick={() => setTagFilter('all')}
                >
                  ぜんぶ
                </button>
                {tagsUsed.map((t) => (
                  <button
                    key={t.key}
                    className={`nb-tag-chip${tagFilter === t.key ? ' on' : ''}`}
                    style={tagFilter === t.key ? { background: t.bg, color: t.ink } : undefined}
                    onClick={() => setTagFilter(t.key)}
                  >
                    <Emoji char={t.emoji} size={14} /> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="quiet-limit">
              みつかりません。
              <br />
              <small>言葉を かえて さがしてみる。</small>
            </p>
          ) : (
        <ul className="page-list">
          {filtered.map((p) => {
            const t = p.tag ? TAG_BY_KEY[p.tag] : undefined;
            const s = p.stamp ? STAMP_BY_KEY[p.stamp] : undefined;
            return (
              <li key={p.id}>
                <button className={`page-row${p.highlight ? ' highlighted' : ''}`} onClick={() => onOpenPage(p.id)}>
                  <span className="row-left">
                    {t && (
                      <span className="row-tag" style={{ background: t.bg, color: t.ink }}>
                        <Emoji char={t.emoji} size={18} />
                      </span>
                    )}
                  </span>
                  <span className="row-center">
                    <span className={`date ${nb.calendarMode}`}>
                      {formatDate(p.date, nb.calendarMode)}
                      <small>（{weekdayJP(p.date)}）</small>
                    </span>
                    <span className="preview">
                      {p.highlight && <span className="star">★</span>}
                      <span className="text">{p.text.slice(0, 50) || '（白紙）'}</span>
                    </span>
                  </span>
                  <span className="row-right">
                    {s && (
                      <span className="row-stamp">
                        <Emoji char={s.label} size={24} />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
          )}
        </>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="このノートを 削除しますか？"
          message={`「${nb.title}」と、なかに ある\nすべての ページが 消えます。`}
          confirmLabel="削除する"
          cancelLabel="やめる"
          danger
          onConfirm={() => {
            setConfirmRemove(false);
            removeNotebook();
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}

      {showSettings && (
        <div className="sheet-bg" onClick={() => setShowSettings(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>ノートの 設定</h3>
            <div className="field">
              <span>日付の 書きかた</span>
              <div className="seg">
                <button
                  className={`seg-btn${nb.calendarMode === 'seireki' ? ' on' : ''}`}
                  onClick={() => setCalendarMode('seireki')}
                >
                  西暦 (2025.05.12)
                </button>
                <button
                  className={`seg-btn${nb.calendarMode === 'wareki' ? ' on' : ''}`}
                  onClick={() => setCalendarMode('wareki')}
                >
                  和暦 (令和7年5月12日)
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="link danger"
                onClick={() => {
                  setShowSettings(false);
                  setConfirmRemove(true);
                }}
              >
                このノートを削除
              </button>
              <button className="ghost" onClick={() => setShowSettings(false)}>
                とじる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CalendarViewProps {
  pages: Page[];
  calendarMode: CalendarMode;
  onOpenPage: (pageId: string) => void;
  onBackToList: () => void;
}

function CalendarView({ pages, calendarMode: _cm, onOpenPage, onBackToList }: CalendarViewProps) {
  void _cm;
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0..11

  const pageByDate = useMemo(() => {
    const m = new Map<string, Page>();
    pages.forEach((p) => m.set(p.date, p));
    return m;
  }, [pages]);

  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 日曜=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: ds, day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  };

  const todayStrLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const mm = String(month + 1).padStart(2, '0');

  return (
    <div className="nb-toolbar nb-calendar-wrap">
      <div className="nb-view-tabs">
        <button className="nb-view-tab" onClick={onBackToList}>
          もくじ
        </button>
        <button className="nb-view-tab on">カレンダー</button>
      </div>
      <div className="cal-nav">
        <button className="cal-arrow" onClick={prev} aria-label="前の月">‹</button>
        <span className="cal-title">
          <img
            className="cal-month-cut"
            src={`${import.meta.env.BASE_URL}illust/month/${mm}.svg`}
            alt=""
          />
          <span>{year}年 {month + 1}月</span>
        </span>
        <button className="cal-arrow" onClick={next} aria-label="次の月">›</button>
      </div>
      <div className="cal-grid">
        {['日', '月', '火', '水', '木', '金', '土'].map((w) => (
          <span key={w} className="cal-wlabel">{w}</span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={i} className="cal-cell empty" />;
          const p = pageByDate.get(c.date);
          const isToday = c.date === todayStrLocal;
          return (
            <button
              key={i}
              className={`cal-cell${p ? ' written' : ''}${isToday ? ' today' : ''}${p?.highlight ? ' star' : ''}`}
              onClick={() => p && onOpenPage(p.id)}
              disabled={!p}
            >
              <span className="cal-day">{c.day}</span>
              {p && <span className="cal-dot" style={{ background: p.tag ? TAG_BY_KEY[p.tag].bg : 'var(--ink)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
