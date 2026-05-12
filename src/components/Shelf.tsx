import { useState } from 'react';
import type { AppData, CoverTheme, Notebook } from '../types';
import { COVER_THEMES } from '../types';
import { newId } from '../storage';

interface Props {
  data: AppData;
  onOpen: (id: string) => void;
  onChange: (next: AppData) => void;
  onShowHighlights: () => void;
}

export default function Shelf({ data, onOpen, onChange, onShowHighlights }: Props) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<CoverTheme>('beige');

  const create = () => {
    const t = title.trim() || `ノート ${data.notebooks.length + 1}`;
    const nb: Notebook = { id: newId(), title: t, cover, createdAt: Date.now() };
    onChange({ ...data, notebooks: [...data.notebooks, nb] });
    setTitle('');
    setCover('beige');
    setCreating(false);
  };

  const themeOf = (c: CoverTheme) => COVER_THEMES.find((t) => t.key === c)!;

  return (
    <div className="shelf">
      <header className="appbar">
        <h1>ほぼ日のしおり</h1>
        <button className="link" onClick={onShowHighlights}>
          ★ ハイライト
        </button>
      </header>

      <p className="shelf-hint">本棚から、ノートをひらく。</p>

      <div className="books">
        {data.notebooks.map((nb) => {
          const t = themeOf(nb.cover);
          const count = data.pages.filter((p) => p.notebookId === nb.id).length;
          return (
            <button
              key={nb.id}
              className="book"
              style={{ background: t.bg, color: t.ink }}
              onClick={() => onOpen(nb.id)}
            >
              <span className="book-title">{nb.title}</span>
              <span className="book-meta">{count}ページ</span>
            </button>
          );
        })}

        <button className="book book-new" onClick={() => setCreating(true)}>
          <span className="plus">＋</span>
          <span>新しいノート</span>
        </button>
      </div>

      {creating && (
        <div className="modal-bg" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>新しいノート</h2>
            <label className="field">
              <span>タイトル</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 2026年の春"
                maxLength={40}
              />
            </label>

            <div className="field">
              <span>表紙</span>
              <div className="covers">
                {COVER_THEMES.map((t) => (
                  <button
                    key={t.key}
                    className={`cover-swatch${cover === t.key ? ' on' : ''}`}
                    style={{ background: t.bg, color: t.ink }}
                    onClick={() => setCover(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="ghost" onClick={() => setCreating(false)}>
                やめる
              </button>
              <button className="primary" onClick={create}>
                つくる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
