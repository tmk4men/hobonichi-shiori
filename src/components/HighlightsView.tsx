import { useMemo } from 'react';
import type { AppData, Page } from '../types';
import { COVER_THEMES, STAMP_BY_KEY, TAG_BY_KEY } from '../types';
import { buildHighlights, findNotebook, formatDate, weekdayJP } from '../storage';
import Emoji from './Emoji';

interface Props {
  data: AppData;
  onBack: () => void;
  onOpenPage: (notebookId: string, pageId: string) => void;
}

export default function HighlightsView({ data, onBack, onOpenPage }: Props) {
  const cards = useMemo(() => buildHighlights(data), [data]);

  const renderCard = (p: Page, i: number) => {
    // 安定したシードで紙片の見た目を変える
    const seed = (p.id.charCodeAt(0) + p.id.charCodeAt(1 % p.id.length)) % 7;
    const tilt = ((seed - 3) * 0.9).toFixed(2); // -2.7°〜+2.7°
    const offset = ((seed % 3) - 1) * 4; // -4/0/+4 px
    const nb = findNotebook(data, p.notebookId);
    const theme = nb && COVER_THEMES.find((t) => t.key === nb.cover);
    const tag = p.tag ? TAG_BY_KEY[p.tag] : undefined;
    const stamp = p.stamp ? STAMP_BY_KEY[p.stamp] : undefined;
    return (
      <button
        key={p.id}
        className="recall-card"
        style={{
          ...(theme ? { background: theme.bg, color: theme.ink } : {}),
          ['--tilt' as string]: `${tilt}deg`,
          ['--y-offset' as string]: `${offset}px`,
          animationDelay: `${i * 80}ms`,
        }}
        onClick={() => onOpenPage(p.notebookId, p.id)}
      >
        <div className="card-top">
          {tag && (
            <span className="row-tag" style={{ background: tag.bg, color: tag.ink }}>
              <Emoji char={tag.emoji} size={18} />
            </span>
          )}
          <span className={`card-date ${nb?.calendarMode ?? 'seireki'}`}>
            {nb ? formatDate(p.date, nb.calendarMode) : p.date}
            <small> （{weekdayJP(p.date)}）</small>
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
        <div className="card-text">{p.text || '（白紙のページ）'}</div>
        <div className="card-bottom">
          <small>{nb?.title ?? ''}</small>
        </div>
      </button>
    );
  };

  return (
    <div className="highlights-screen">
      <header className="appbar">
        <button className="link" onClick={onBack}>
          ← 本棚
        </button>
        <h1>ハイライト</h1>
        <span style={{ width: 60 }} />
      </header>

      {cards.length === 0 ? (
        <div className="empty-state">
          <img src={`${import.meta.env.BASE_URL}illust/empty-highlights.svg`} alt="" />
          <p className="empty">
            ページが もう少し たまると、
            <br />
            ふと あの日に 出会えるように。
          </p>
        </div>
      ) : (
        cards.map((card) => (
          <section key={card.id} className="recall-section">
            <h2 className="recall-h">{card.title}</h2>
            <img
              className="section-divider"
              src={`${import.meta.env.BASE_URL}illust/divider-wave.svg`}
              alt=""
              aria-hidden="true"
            />
            <div className="recall-scatter">
              {card.pages.map((p, i) => renderCard(p, i))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
