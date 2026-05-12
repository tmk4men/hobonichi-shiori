import { useMemo } from 'react';
import type { AppData, Page } from '../types';
import { COVER_THEMES, STAMP_BY_KEY, TAG_BY_KEY } from '../types';
import { findNotebook, formatDate, weekdayJP } from '../storage';
import Emoji from './Emoji';

interface Props {
  data: AppData;
  onBack: () => void;
  onOpenPage: (notebookId: string, pageId: string) => void;
}

function oneYearAgoIso(): { mm: string; dd: string } {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return {
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    dd: String(d.getDate()).padStart(2, '0'),
  };
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function HighlightsView({ data, onBack, onOpenPage }: Props) {
  const sections = useMemo(() => {
    const all = data.pages;

    const { mm, dd } = oneYearAgoIso();
    const yearAgo = all.filter((p) => p.date.endsWith(`-${mm}-${dd}`));

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString().slice(0, 10);
    const oldEnough = all.filter((p) => p.date < cutoff);
    const serendipity = pickRandom(oldEnough, 3);

    const favorites = all
      .filter((p) => p.highlight)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 12);

    return { yearAgo, serendipity, favorites };
  }, [data.pages]);

  const renderCard = (p: Page) => {
    const nb = findNotebook(data, p.notebookId);
    const theme = nb && COVER_THEMES.find((t) => t.key === nb.cover);
    const tag = p.tag ? TAG_BY_KEY[p.tag] : undefined;
    const stamp = p.stamp ? STAMP_BY_KEY[p.stamp] : undefined;
    return (
      <button
        key={p.id}
        className="recall-card"
        style={theme ? { background: theme.bg, color: theme.ink } : undefined}
        onClick={() => onOpenPage(p.notebookId, p.id)}
      >
        <div className="card-top">
          {tag && (
            <span className="row-tag" style={{ background: tag.bg, color: tag.ink }}>
              <Emoji char={tag.emoji} size={18} />
            </span>
          )}
          <span className={`card-date ${nb?.calendarMode ?? 'seireki'}`}>
            {nb ? formatDate(p.date, nb.calendarMode) : p.date}（{weekdayJP(p.date)}）
          </span>
          {stamp && (
            <span className="card-stamp">
              <Emoji char={stamp.label} size={20} />
            </span>
          )}
        </div>
        {p.photo && (
          <div className="card-photo">
            <img src={p.photo} alt="" />
          </div>
        )}
        <div className="card-text">{p.text || '（白紙）'}</div>
        <div className="card-bottom">
          <small>{nb?.title ?? ''}</small>
        </div>
      </button>
    );
  };

  const empty =
    sections.yearAgo.length === 0 &&
    sections.serendipity.length === 0 &&
    sections.favorites.length === 0;

  return (
    <div className="highlights-screen">
      <header className="appbar">
        <button className="link" onClick={onBack}>
          ← 本棚
        </button>
        <h1>ハイライト</h1>
        <span style={{ width: 60 }} />
      </header>

      {empty && (
        <div className="empty-state">
          <img src={`${import.meta.env.BASE_URL}illust-empty.svg`} alt="" />
          <p className="empty">
            ページが もう少し たまると、
            <br />
            ふと あの日に 出会えるように。
          </p>
        </div>
      )}

      {sections.yearAgo.length > 0 && (
        <section className="recall-section">
          <h2 className="recall-h">1年前の 今日</h2>
          <div className="recall-grid">{sections.yearAgo.map(renderCard)}</div>
        </section>
      )}

      {sections.serendipity.length > 0 && (
        <section className="recall-section">
          <h2 className="recall-h">ふと 出会う</h2>
          <div className="recall-grid">{sections.serendipity.map(renderCard)}</div>
        </section>
      )}

      {sections.favorites.length > 0 && (
        <section className="recall-section">
          <h2 className="recall-h">★ お気に入り</h2>
          <div className="recall-grid">{sections.favorites.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
