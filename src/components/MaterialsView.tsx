import { useEffect, useState } from 'react';
import { COVER_THEMES, FRAME_DEF, STAMP_DEF, TAG_DEF } from '../types';
import type { IconChoice } from '../iconChoice';
import { iconUrl, loadIconChoice, saveIconChoice } from '../iconChoice';
import type { WriteFont } from '../writeFont';
import { WRITE_FONT_DEF, applyWriteFont, loadWriteFont, saveWriteFont } from '../writeFont';
import type { TextScale, Theme } from '../theme';
import {
  applyTextScale,
  applyTheme,
  loadTextScale,
  loadTheme,
  saveTextScale,
  saveTheme,
} from '../theme';
import { isHapticsEnabled, setHapticsEnabled } from '../haptics';
import Emoji from './Emoji';
import {
  fetchProductInfo,
  purchasePremium,
  restorePremium,
  usePremium,
  type PremiumProductInfo,
} from '../premium';
import { setBannerVisible } from '../ads';

export default function MaterialsView() {
  const [icon, setIcon] = useState<IconChoice>(loadIconChoice());
  const [writeFont, setWriteFont] = useState<WriteFont>(loadWriteFont());
  const [theme, setThemeState] = useState<Theme>(loadTheme());
  const [textScale, setTextScaleState] = useState<TextScale>(loadTextScale());
  const [haptics, setHaptics] = useState<boolean>(isHapticsEnabled());
  const premium = usePremium();
  const [product, setProduct] = useState<PremiumProductInfo | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  useEffect(() => {
    if (premium) return;
    let alive = true;
    fetchProductInfo().then((p) => {
      if (alive) setProduct(p);
    });
    return () => {
      alive = false;
    };
  }, [premium]);

  useEffect(() => {
    setBannerVisible(true);
    return () => {
      setBannerVisible(false);
    };
  }, []);

  const flashPurchaseMsg = (m: string) => {
    setPurchaseMsg(m);
    window.setTimeout(() => setPurchaseMsg((cur) => (cur === m ? null : cur)), 3500);
  };

  const onPurchase = async () => {
    if (purchasing) return;
    setPurchasing(true);
    const r = await purchasePremium();
    setPurchasing(false);
    if (r.ok) {
      flashPurchaseMsg('ありがとう。すべての書体と たっぷりのページが ひらきました。');
    } else if (r.reason === 'cancelled') {
      // 静かに何も出さない
    } else {
      flashPurchaseMsg(r.message ?? '購入できませんでした。');
    }
  };

  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    const r = await restorePremium();
    setRestoring(false);
    if (r.ok) {
      flashPurchaseMsg('購入を復元しました。ありがとう。');
    } else {
      flashPurchaseMsg(r.message ?? '復元できませんでした。');
    }
  };

  const pickTheme = (t: Theme) => {
    setThemeState(t);
    saveTheme(t);
    applyTheme(t);
  };
  const pickTextScale = (s: TextScale) => {
    setTextScaleState(s);
    saveTextScale(s);
    applyTextScale(s);
  };
  const toggleHaptics = () => {
    const next = !haptics;
    setHaptics(next);
    setHapticsEnabled(next);
  };
  const pickIcon = (c: IconChoice) => {
    setIcon(c);
    saveIconChoice(c);
  };
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const pickWriteFont = (f: WriteFont, locked?: boolean) => {
    if (locked && !premium) {
      setLockedNotice('「しおり ぷらす」を ひらくと 使えます。');
      window.setTimeout(() => setLockedNotice(null), 2200);
      return;
    }
    setWriteFont(f);
    saveWriteFont(f);
    applyWriteFont(f);
  };
  return (
    <div className={`materials${premium ? ' is-premium' : ''}`}>
      <img
        className="materials-header"
        src={`${import.meta.env.BASE_URL}illust/materials-header.svg`}
        alt=""
        aria-hidden="true"
      />
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
          {WRITE_FONT_DEF.map((f) => {
            const showLock = f.locked && !premium;
            return (
              <button
                key={f.key}
                className={`material-font${writeFont === f.key ? ' on' : ''}${showLock ? ' locked' : ''}`}
                onClick={() => pickWriteFont(f.key, f.locked)}
              >
                <span className="material-font-name">
                  {showLock && <span className="material-lock" aria-hidden="true">⌷</span>}
                  {f.label}
                </span>
                <span className="material-font-sample" style={{ fontFamily: f.cssFamily }}>
                  {f.sample}
                </span>
              </button>
            );
          })}
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
        <p className="material-sub">2しゅるい。好みで えらべる。</p>
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

      <section className="material-section">
        <h2 className="material-h">しるし</h2>
        <p className="material-sub">節目に そっと 押される 印。</p>
        <div className="material-stamps-special">
          {[
            { src: 'illust/stamp-kansei.svg', label: 'ノート完成' },
            { src: 'illust/stamp-100days.svg', label: '百日きねん' },
            { src: 'illust/stamp-birthday.svg', label: 'たんじょう' },
          ].map((s) => (
            <span key={s.src} className="material-stamp-special">
              <img src={`${import.meta.env.BASE_URL}${s.src}`} alt="" />
              <span className="material-stamp-meaning">{s.label}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="material-section premium-section">
        <h2 className="material-h">しおり ぷらす</h2>
        {premium ? (
          <>
            <p className="material-sub">
              ありがとう。すべての書体と、たっぷりのページが ひらいています。
            </p>
            <p className="premium-thanks">これから 続いていく 一日一日を、ゆっくり 残していけますように。</p>
          </>
        ) : (
          <>
            <p className="material-sub">
              鍵付きの 書体4種が ひらき、ノートは 24冊・1冊あたり 365ページまで 増やせます。
              一度きりの お買い切り。
            </p>
            <ul className="premium-bullets">
              <li>えんぴつ／マーカー／まる文字／行書ふう が使える</li>
              <li>ノートを 24冊まで（無料は 2冊）</li>
              <li>1冊 365ページまで（無料は 45ページ）</li>
            </ul>
            <div className="premium-actions">
              <button
                className="premium-buy"
                onClick={onPurchase}
                disabled={purchasing}
              >
                {purchasing
                  ? 'ひらいています…'
                  : product?.price
                    ? `${product.price} で ひらく`
                    : 'しおり ぷらす を ひらく'}
              </button>
              <button
                className="premium-restore"
                onClick={onRestore}
                disabled={restoring}
              >
                {restoring ? '復元しています…' : '購入を 復元'}
              </button>
            </div>
            <p className="premium-fineprint">
              機種変更や再インストール後は「購入を 復元」で 元に戻せます。
            </p>
          </>
        )}
        {purchaseMsg && <p className="material-notice">{purchaseMsg}</p>}
      </section>

      <section className="material-section">
        <h2 className="material-h">見え方</h2>
        <p className="material-sub">あかり / 文字の大きさ。</p>
        <div className="field">
          <span>あかり</span>
          <div className="seg">
            <button
              className={`seg-btn${theme === 'light' ? ' on' : ''}`}
              onClick={() => pickTheme('light')}
            >
              ひかり
            </button>
            <button
              className={`seg-btn${theme === 'dark' ? ' on' : ''}`}
              onClick={() => pickTheme('dark')}
            >
              ともしび
            </button>
          </div>
        </div>
        <div className="field">
          <span>文字の 大きさ</span>
          <div className="seg">
            <button
              className={`seg-btn${textScale === 'small' ? ' on' : ''}`}
              onClick={() => pickTextScale('small')}
            >
              ちいさい
            </button>
            <button
              className={`seg-btn${textScale === 'medium' ? ' on' : ''}`}
              onClick={() => pickTextScale('medium')}
            >
              ふつう
            </button>
            <button
              className={`seg-btn${textScale === 'large' ? ' on' : ''}`}
              onClick={() => pickTextScale('large')}
            >
              おおきい
            </button>
          </div>
        </div>
        <div className="field">
          <span>振動</span>
          <button
            className={`toggle-btn${haptics ? ' on' : ''}`}
            onClick={toggleHaptics}
            aria-pressed={haptics}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </section>
    </div>
  );
}
