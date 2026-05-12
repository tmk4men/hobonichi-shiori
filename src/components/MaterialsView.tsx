import { COVER_THEMES, FRAME_DEF, STAMP_DEF, TAG_DEF } from '../types';
import Emoji from './Emoji';

export default function MaterialsView() {
  return (
    <div className="materials">
      <p className="shelf-hint">ノートで 使える もの。</p>

      <section className="material-section">
        <h2 className="material-h">タグ（付箋）</h2>
        <p className="material-sub">1ページに 1つだけ。左上に そっと貼る。</p>
        <div className="material-tags">
          {TAG_DEF.map((t) => (
            <span
              key={t.key}
              className="material-tag"
              style={{ background: t.bg, color: t.ink }}
            >
              <Emoji char={t.emoji} size={16} />
              <span>{t.label}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="material-section">
        <h2 className="material-h">スタンプ</h2>
        <p className="material-sub">きょうの 空気を ひとつ。説明は しない。</p>
        <div className="material-stamps">
          {STAMP_DEF.map((s) => (
            <span key={s.key} className="material-stamp">
              <Emoji char={s.label} size={32} />
            </span>
          ))}
        </div>
      </section>

      <section className="material-section">
        <h2 className="material-h">しゃしんの ふち</h2>
        <p className="material-sub">5しゅるい。スワイプで かえる。</p>
        <div className="material-frames">
          {FRAME_DEF.map((f) => (
            <div key={f.key} className="material-frame">
              <div className={`framed frame-${f.key} mask-${FRAME_DEF.indexOf(f) % 4}`}>
                <div className="frame-placeholder" />
              </div>
              <span className="material-frame-name">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="material-section">
        <h2 className="material-h">表紙の いろ</h2>
        <p className="material-sub">6しゅるい。ノートを 着替える ように。</p>
        <div className="material-covers">
          {COVER_THEMES.map((c) => (
            <div
              key={c.key}
              className="material-cover"
              style={{ background: c.bg, color: c.ink }}
            >
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="material-section">
        <h2 className="material-h">日付の 書きかた</h2>
        <p className="material-sub">ノートごと、ページごとに きりかえ。</p>
        <div className="material-dates">
          <div className="material-date seireki">2026.05.12<small>（火）</small></div>
          <div className="material-date wareki">令和8年5月12日<small>（火）</small></div>
        </div>
      </section>
    </div>
  );
}
