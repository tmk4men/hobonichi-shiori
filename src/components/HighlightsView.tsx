import type { AppData } from '../types';
import { COVER_THEMES, STAMP_LIST } from '../types';
import { findNotebook, formatDateJP, weekdayJP } from '../storage';

interface Props {
  data: AppData;
  onBack: () => void;
  onOpenPage: (notebookId: string, pageId: string) => void;
}

export default function HighlightsView({ data, onBack, onOpenPage }: Props) {
  const pages = data.pages
    .filter((p) => p.highlight)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="highlights-screen">
      <header className="appbar">
        <button className="link" onClick={onBack}>
          ← 本棚
        </button>
        <h1>★ ハイライト</h1>
        <span style={{ width: 60 }} />
      </header>

      {pages.length === 0 ? (
        <p className="empty">まだ ★を つけた ページが ありません。</p>
      ) : (
        <ul className="highlight-list">
          {pages.map((p) => {
            const nb = findNotebook(data, p.notebookId);
            const theme = nb && COVER_THEMES.find((t) => t.key === nb.cover);
            return (
              <li key={p.id}>
                <button
                  className="highlight-row"
                  style={theme ? { background: theme.bg, color: theme.ink } : undefined}
                  onClick={() => onOpenPage(p.notebookId, p.id)}
                >
                  <div className="row-top">
                    <span className="nb-name">{nb?.title ?? '?'}</span>
                    <span className="date">
                      {formatDateJP(p.date)}（{weekdayJP(p.date)}）
                    </span>
                  </div>
                  <div className="row-mid">
                    {p.stamps.slice(0, 5).map((s) => (
                      <span key={s} className="stamp">
                        {STAMP_LIST.find((x) => x.key === s)?.label}
                      </span>
                    ))}
                  </div>
                  <div className="row-bot">{p.text.slice(0, 80) || '（白紙）'}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
