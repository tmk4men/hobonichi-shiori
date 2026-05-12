import { useState } from 'react';
import { COVER_THEMES, FRAME_DEF, STAMP_DEF, TAG_DEF } from '../types';
import type { IconChoice } from '../iconChoice';
import { iconUrl, loadIconChoice, saveIconChoice } from '../iconChoice';
import type { WriteFont } from '../writeFont';
import { WRITE_FONT_DEF, applyWriteFont, loadWriteFont, saveWriteFont } from '../writeFont';
import Emoji from './Emoji';

export default function MaterialsView() {
  const [icon, setIcon] = useState<IconChoice>(loadIconChoice());
  const [writeFont, setWriteFont] = useState<WriteFont>(loadWriteFont());
  const pickIcon = (c: IconChoice) => {
    setIcon(c);
    saveIconChoice(c);
  };
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const pickWriteFont = (f: WriteFont, locked?: boolean) => {
    if (locked) {
      setLockedNotice('まだ ひらかれていない 書体です。');
      window.setTimeout(() => setLockedNotice(null), 2200);
      return;
    }
    setWriteFont(f);
    saveWriteFont(f);
    applyWriteFont(f);
  };
  return (
    <div className="materials">
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
        <p className="material-sub">きょうの 空気を ひとつだけ。</p>
        <div className="material-stamps">
          {STAMP_DEF.map((s) => (
            <span key={s.key} className="material-stamp">
              <Emoji char={s.label} size={32} />
              <span className="material-stamp-meaning">{s.meaning}</span>
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
        <h2 className="material-h">本文の 書体</h2>
        <p className="material-sub">ノートで 書くときの ペンを 選ぶ。</p>
        <div className="material-fonts">
          {WRITE_FONT_DEF.map((f) => (
            <button
              key={f.key}
              className={`material-font${writeFont === f.key ? ' on' : ''}${f.locked ? ' locked' : ''}`}
              onClick={() => pickWriteFont(f.key, f.locked)}
            >
              <span className="material-font-name">
                {f.locked && <span className="material-lock" aria-hidden="true">⌷</span>}
                {f.label}
              </span>
              <span className="material-font-sample" style={{ fontFamily: f.cssFamily }}>
                {f.sample}
              </span>
            </button>
          ))}
        </div>
        {lockedNotice && (
          <p className="material-notice">{lockedNotice}</p>
        )}
      </section>

      <section className="material-section">
        <h2 className="material-h">日付の 書きかた</h2>
        <p className="material-sub">ノートごと、ページごとに きりかえ。</p>
        <div className="material-dates">
          <div className="material-date seireki">2026.05.12<small>（火）</small></div>
          <div className="material-date wareki">令和8年5月12日<small>（火）</small></div>
        </div>
      </section>

      <section className="material-section">
        <h2 className="material-h">アプリの アイコン</h2>
        <div className="material-icons">
          {(['a', 'b'] as IconChoice[]).map((c) => (
            <button
              key={c}
              className={`material-icon${icon === c ? ' on' : ''}`}
              onClick={() => pickIcon(c)}
            >
              <img src={iconUrl(c)} alt="" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
