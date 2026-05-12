import { useState } from 'react';
import type { AppData, Page } from '../types';
import { COVER_THEMES, STAMP_LIST } from '../types';
import { findNotebook, formatDateJP, newId, pagesOf, sortPagesByDate, todayStr, weekdayJP } from '../storage';

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

  if (!nb) {
    return (
      <div className="page-screen">
        <p>このノートは見つかりませんでした。</p>
        <button onClick={onBack}>もどる</button>
      </div>
    );
  }

  const theme = COVER_THEMES.find((t) => t.key === nb.cover)!;

  const addPage = () => {
    const today = todayStr();
    const existing = pages.find((p) => p.date === today);
    if (existing) {
      onOpenPage(existing.id);
      return;
    }
    const page: Page = {
      id: newId(),
      notebookId,
      date: today,
      text: '',
      stamps: [],
      tags: [],
      highlight: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  const removeNotebook = () => {
    if (!confirm('このノートと中のページを すべて 削除します。よろしいですか？')) return;
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
        <button className="link danger" onClick={removeNotebook}>
          削除
        </button>
      </header>

      <button className="add-today" onClick={addPage}>
        ＋ きょうの ページ をひらく
      </button>

      {pages.length === 0 ? (
        <p className="empty">まだ なにも書かれていない。</p>
      ) : (
        <ul className="page-list">
          {pages.map((p) => (
            <li key={p.id}>
              <button className="page-row" onClick={() => onOpenPage(p.id)}>
                <span className="date">
                  {formatDateJP(p.date)}<small>（{weekdayJP(p.date)}）</small>
                </span>
                <span className="preview">
                  {p.highlight && <span className="star">★</span>}
                  {p.stamps.slice(0, 3).map((s) => (
                    <span key={s} className="stamp">
                      {STAMP_LIST.find((x) => x.key === s)?.label}
                    </span>
                  ))}
                  <span className="text">{p.text.slice(0, 40) || '（白紙）'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
