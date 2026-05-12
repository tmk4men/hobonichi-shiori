import { useMemo, useState } from 'react';
import type { AppData, CoverTheme, Notebook } from '../types';
import { COVER_THEMES } from '../types';
import {
  buildHighlights,
  findNotebook,
  formatDate,
  newId,
  pickBookmarkOfTheDay,
} from '../storage';
import Emoji from './Emoji';

interface Props {
  data: AppData;
  onOpen: (id: string) => void;
  onChange: (next: AppData) => void;
  onShowHighlights: () => void;
  onOpenPage: (notebookId: string, pageId: string) => void;
  onOpenMenu: () => void;
}

export default function Shelf({ data, onOpen, onChange, onShowHighlights: _onShowHighlights, onOpenPage, onOpenMenu }: Props) {
  void _onShowHighlights;
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<CoverTheme>('beige');

  const bookmark = useMemo(() => {
    const cards = buildHighlights(data);
    const card = pickBookmarkOfTheDay(cards);
    if (!card || card.pages.length === 0) return null;
    const page = card.pages[0];
    const nb = findNotebook(data, page.notebookId);
    return { card, page, nb };
  }, [data]);

  const create = () => {
    const t = title.trim() || `ノート ${data.notebooks.length + 1}`;
    const nb: Notebook = {
      id: newId(),
      title: t,
      cover,
      calendarMode: 'seireki',
      createdAt: Date.now(),
    };
    onChange({ ...data, notebooks: [...data.notebooks, nb] });
    setTitle('');
    setCover('beige');
    setCreating(false);
  };

  const themeOf = (c: CoverTheme) => COVER_THEMES.find((t) => t.key === c)!;

  // 棚ごとに最大4冊
  const rows: Notebook[][] = [];
  for (let i = 0; i < data.notebooks.length; i += 4) {
    rows.push(data.notebooks.slice(i, i + 4));
  }
  if (rows.length === 0) rows.push([]);

  return (
    <div className="shelf">
      <header className="appbar">
        <span style={{ width: 36 }} />
        <h1>ほぼ日のしおり</h1>
        <button
          className="link hamburger"
          onClick={onOpenMenu}
          aria-label="メニュー"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {bookmark && (
        <button
          className="bookmark"
          onClick={() => onOpenPage(bookmark.page.notebookId, bookmark.page.id)}
        >
          <span className="bm-ribbon" />
          <span className="bm-title">{bookmark.card.title}</span>
          <span className="bm-page">
            {bookmark.page.tag && (
              <span className="bm-tag">
                <Emoji
                  char={
                    // map tag emoji
                    (
                      {
                        meal: '🍚',
                        outing: '🚶',
                        happy: '✨',
                        play: '🎮',
                        daily: '☁️',
                      } as Record<string, string>
                    )[bookmark.page.tag]
                  }
                  size={16}
                />
              </span>
            )}
            <span className="bm-text">
              {bookmark.page.text.slice(0, 30) || '（白紙のページ）'}
            </span>
          </span>
          <span className="bm-date">
            {bookmark.nb
              ? formatDate(bookmark.page.date, bookmark.nb.calendarMode)
              : bookmark.page.date}
          </span>
        </button>
      )}

      <p className="shelf-hint">本棚から、ノートをひらく。</p>

      <div className="bookshelf">
        <div className="shelf-side left" />
        <div className="shelf-side right" />
        {rows.map((row, ri) => (
          <div key={ri} className="shelf-row">
            <div className="shelf-spines">
              {row.map((nb, i) => {
                const t = themeOf(nb.cover);
                const tilt = ((i % 3) - 1) * 0.8; // -0.8 / 0 / 0.8 deg
                return (
                  <button
                    key={nb.id}
                    className="spine"
                    style={{
                      background: t.bg,
                      color: t.ink,
                      transform: `rotate(${tilt}deg)`,
                    }}
                    onClick={() => onOpen(nb.id)}
                  >
                    <span className="spine-band band-top" />
                    <span className="spine-title">{nb.title}</span>
                    <span className="spine-band band-bottom" />
                  </button>
                );
              })}
              {ri === rows.length - 1 && row.length < 4 && (
                <button className="spine spine-new" onClick={() => setCreating(true)}>
                  <span className="plus">＋</span>
                  <span className="spine-newlabel">あたらしく</span>
                </button>
              )}
            </div>
            <div className="shelf-plank" />
          </div>
        ))}
      </div>

      {creating && (
        <div className="modal-bg" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>あたらしい ノート</h2>
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
