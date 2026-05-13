import { useState } from 'react';
import type { AppData, CalendarMode, Page } from '../types';
import { COVER_THEMES, STAMP_BY_KEY, TAG_BY_KEY } from '../types';
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
      ) : (
        <ul className="page-list">
          {pages.map((p) => {
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
