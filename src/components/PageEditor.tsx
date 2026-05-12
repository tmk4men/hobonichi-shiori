import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { AppData, Page, PhotoFrame, Stamp, Tag } from '../types';
import { COVER_THEMES, FRAME_DEF, STAMP_DEF, TAG_BY_KEY, TAG_DEF } from '../types';
import {
  findNotebook,
  findPage,
  formatDate,
  incrementView,
  pagesOf,
  sortPagesByDate,
  weekdayJP,
} from '../storage';
import Emoji from './Emoji';
import ConfirmDialog from './ConfirmDialog';
import { playPageFlip, playStamp, playWrite, unlockAudio } from '../sfx';
import type { WriteFont } from '../writeFont';
import { WRITE_FONT_DEF, applyWriteFont, isFreeFont, loadWriteFont, saveWriteFont } from '../writeFont';

interface Props {
  data: AppData;
  pageId: string;
  onBack: () => void;
  onOpenPage: (pageId: string) => void;
  onChange: (next: AppData) => void;
}

const MAX_PHOTO_BYTES = 600_000;

async function compressImage(file: File, maxSize = 1280, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/webp', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PageEditor({ data, pageId, onBack, onOpenPage, onChange }: Props) {
  const page = findPage(data, pageId);
  const nb = page ? findNotebook(data, page.notebookId) : undefined;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [text, setText] = useState(page?.text ?? '');
  const [showTagPick, setShowTagPick] = useState(false);
  const [showStampPick, setShowStampPick] = useState(false);
  const [showFramePick, setShowFramePick] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [showFontPick, setShowFontPick] = useState(false);
  const [writeFont, setWriteFontState] = useState<WriteFont>(loadWriteFont());

  const pickFont = (f: WriteFont) => {
    if (!isFreeFont(f)) return; // ロック中は選べない
    saveWriteFont(f);
    applyWriteFont(f);
    setWriteFontState(f);
  };

  // ピッカーを開く前にフォーカスを外してキーボードを閉じる
  // （キーボードが開いていると dvh が小さくなりシートの下端が見切れる）
  const openPicker = (setter: (v: boolean) => void) => {
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
    setter(true);
  };
  const [flipDir, setFlipDir] = useState<'none' | 'next' | 'prev'>('none');
  const [side, setSide] = useState<'left' | 'right'>('left');

  useEffect(() => {
    setText(page?.text ?? '');
    setSide('left');
    setShowTagPick(false);
    setShowStampPick(false);
    setShowFramePick(false);
    const t = setTimeout(() => setFlipDir('none'), 540);
    // 開いたときに view 加算（一度だけ）
    onChange(incrementView(data, pageId));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // sideが変わったらtext stateを切替先のページに合わせる
  useEffect(() => {
    if (!page) return;
    setText(side === 'right' ? (page.textRight ?? '') : page.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  if (!page || !nb) {
    return (
      <div className="page-screen">
        <p>ページが見つかりません。</p>
        <button onClick={onBack}>もどる</button>
      </div>
    );
  }

  const theme = COVER_THEMES.find((t) => t.key === nb.cover)!;
  const pages = sortPagesByDate(pagesOf(data, page.notebookId));
  const idx = pages.findIndex((p) => p.id === page.id);
  const prevPage = idx >= 0 && idx + 1 < pages.length ? pages[idx + 1] : null; // sorted desc
  const nextPage = idx > 0 ? pages[idx - 1] : null;

  const isRight = side === 'right';
  const currentPhoto = isRight ? page.photoRight : page.photo;
  const currentFrame = (isRight ? page.frameRight : page.frame) ?? 'plain';
  const currentCaption = isRight ? (page.photoCaptionRight ?? '') : (page.photoCaption ?? '');

  // ページIDから安定した位置・角度を計算（同じページは常に同じ）
  const seed = (page.id.charCodeAt(0) + page.id.charCodeAt(Math.min(2, page.id.length - 1)) + (isRight ? 7 : 0)) % 100;
  const stickyTilt = ((seed % 9) - 4) * 0.6; // -2.4°〜+2.4°
  const stickyLeft = 8 + (seed % 6); // 8〜13px
  const baseTilt = (((seed * 3) % 7) - 3) * 0.4; // -1.2°〜+1.2°
  const photoTilt = currentFrame === 'polaroid' ? baseTilt - 2 : baseTilt;
  const mask1Top = -10 + (seed % 4) * 2;
  const mask1Left = -10 + ((seed * 5) % 7) * 4;
  const mask1Rot = -22 + ((seed * 7) % 14);
  const mask2Bottom = -10 + ((seed * 3) % 4) * 2;
  const mask2Right = -10 + ((seed * 11) % 7) * 4;
  const mask2Rot = 14 + ((seed * 13) % 16);
  const maskColor = seed % 4;

  const patch = (changes: Partial<Page>) => {
    onChange({
      ...data,
      pages: data.pages.map((p) =>
        p.id === pageId ? { ...p, ...changes, updatedAt: Date.now() } : p,
      ),
    });
  };

  const MAX_TEXT_LEN = 30;
  const remaining = MAX_TEXT_LEN - [...text].length;
  const isOverLimit = remaining < 0;

  const commitText = () => {
    if (isOverLimit) return; // 30文字超過時は保存しない
    if (isRight) {
      if (text !== (page.textRight ?? '')) patch({ textRight: text });
    } else {
      if (text !== page.text) patch({ text });
    }
  };

  const setTag = (t: Tag | undefined) => {
    patch({ tag: t });
    setShowTagPick(false);
  };
  const setStamp = (s: Stamp | undefined) => {
    if (s) playStamp();
    patch({ stamp: s });
    setShowStampPick(false);
  };
  const setFrame = (f: PhotoFrame) => {
    if (isRight) patch({ frameRight: f });
    else patch({ frame: f });
    setShowFramePick(false);
  };

  const cycleFrame = (dir: 1 | -1) => {
    const i = FRAME_DEF.findIndex((f) => f.key === currentFrame);
    const n = (i + dir + FRAME_DEF.length) % FRAME_DEF.length;
    if (isRight) patch({ frameRight: FRAME_DEF[n].key });
    else patch({ frame: FRAME_DEF[n].key });
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let dataUrl = await compressImage(file, 1280, 0.78);
      if (dataUrl.length > MAX_PHOTO_BYTES) {
        dataUrl = await compressImage(file, 960, 0.7);
      }
      if (isRight) patch({ photoRight: dataUrl });
      else patch({ photo: dataUrl });
    } catch (err) {
      console.error(err);
      alert('しゃしんを 読み込めませんでした。');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    if (isRight) patch({ photoRight: undefined, photoCaptionRight: undefined });
    else patch({ photo: undefined, photoCaption: undefined });
  };

  const setCaption = (v: string) => {
    const val = v || undefined;
    if (isRight) patch({ photoCaptionRight: val });
    else patch({ photoCaption: val });
  };

  const removePage = () => {
    onChange({ ...data, pages: data.pages.filter((p) => p.id !== pageId) });
    onBack();
  };

  const shareSpread = async () => {
    if (!captureRef.current) return;
    setSharing(true);
    const node = captureRef.current;
    // html2canvasがレイアウト計算できるよう、一時的に可視化
    const prevVisibility = node.style.visibility;
    const prevZ = node.style.zIndex;
    node.style.visibility = 'visible';
    node.style.zIndex = '-1';
    try {
      const docFonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
      if (docFonts?.ready) await docFonts.ready;
      // 写真がある場合、img の読み込み完了を待つ
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((res) => {
            const done = () => res();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
        }),
      );

      const canvas = await html2canvas(node, {
        backgroundColor: '#fffaea',
        scale: 2,
        useCORS: false,
        allowTaint: false,
        logging: false,
        width: 1280,
        height: 960,
        windowWidth: 1280,
        windowHeight: 960,
      });
      const tryToBlob = (type: string, quality: number) =>
        new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), type, quality));
      let blob = await tryToBlob('image/webp', 0.92);
      let mime = 'image/webp';
      let ext = 'webp';
      if (!blob) {
        // 一部環境はwebp未対応。pngにフォールバック
        blob = await tryToBlob('image/png', 0.95);
        mime = 'image/png';
        ext = 'png';
      }
      if (!blob) throw new Error('画像の生成に失敗しました');
      const file = new File([blob], `${page.date}.${ext}`, { type: mime });
      const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      const canUseShare = !!navAny.canShare?.({ files: [file] }) && !!navigator.share;
      if (canUseShare) {
        try {
          await navigator.share({ files: [file], title: 'ひびのしおり' });
          return;
        } catch (e) {
          const name = (e as Error).name;
          // ユーザーがキャンセル
          if (name === 'AbortError') return;
          // SecurityError等は黙ってダウンロードにフォールバック
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${page.date}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('shareSpread error:', err);
      alert('画像にできませんでした。\nもう一度お試しください。');
    } finally {
      node.style.visibility = prevVisibility;
      node.style.zIndex = prevZ;
      setSharing(false);
    }
  };

  const goNext = () => {
    commitText();
    if (side === 'left') {
      unlockAudio();
      playPageFlip();
      setFlipDir('next');
      setTimeout(() => setSide('right'), 260);
      setTimeout(() => setFlipDir('none'), 540);
      return;
    }
    if (nextPage) {
      unlockAudio();
      playPageFlip();
      setFlipDir('next');
      setTimeout(() => {
        setSide('left');
        onOpenPage(nextPage.id);
      }, 260);
    }
  };
  const goPrev = () => {
    commitText();
    if (side === 'right') {
      unlockAudio();
      playPageFlip();
      setFlipDir('prev');
      setTimeout(() => setSide('left'), 260);
      setTimeout(() => setFlipDir('none'), 540);
      return;
    }
    if (prevPage) {
      unlockAudio();
      playPageFlip();
      setFlipDir('prev');
      setTimeout(() => {
        setSide('right');
        onOpenPage(prevPage.id);
      }, 260);
    }
  };

  const canGoNext = side === 'left' || !!nextPage;
  const canGoPrev = side === 'right' || !!prevPage;

  // touch swipe
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const tagInfo = page.tag ? TAG_BY_KEY[page.tag] : undefined;
  const stampInfo = page.stamp ? STAMP_DEF.find((s) => s.key === page.stamp) : undefined;

  return (
    <div
      className={`page-screen flip-${flipDir}`}
      style={{ background: theme.bg, color: theme.ink }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="appbar">
        <button className="link" onClick={() => { commitText(); onBack(); }}>
          ← もくじ
        </button>
        <span className="paging">
          <button className="pager" onClick={goPrev} disabled={!canGoPrev} aria-label="前">‹</button>
          <button className="pager" onClick={goNext} disabled={!canGoNext} aria-label="次">›</button>
        </span>
        <span className="appbar-actions">
          <button
            className="icon-btn"
            onClick={shareSpread}
            disabled={sharing}
            aria-label="画像で共有"
            title="画像で共有"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16 L12 4" />
              <path d="M7 9 L12 4 L17 9" />
              <path d="M5 14 L5 20 L19 20 L19 14" />
            </svg>
          </button>
          <button
            className={`icon-btn star-toggle${page.highlight ? ' on' : ''}`}
            onClick={() => patch({ highlight: !page.highlight })}
            aria-label="ハイライト"
          >
            ★
          </button>
          <button
            className="icon-btn more-btn"
            onClick={() => {
              const el = document.activeElement;
              if (el instanceof HTMLElement) el.blur();
              setShowPageMenu(true);
            }}
            aria-label="メニュー"
            title="メニュー"
          >
            <span className="more-dot" />
            <span className="more-dot" />
            <span className="more-dot" />
          </button>
        </span>
      </header>

      <div className={`paper-single show-${side}`}>
        <div className={`paper-side paper-${side}`}>
          {/* 付箋 */}
          <button
            className={`sticky-tag${tagInfo ? '' : ' empty'}`}
            style={{
              ['--sticky-tilt' as string]: `${stickyTilt}deg`,
              ['--sticky-left' as string]: `${stickyLeft}px`,
              ...(tagInfo ? { background: tagInfo.bg, color: tagInfo.ink } : {}),
            }}
            onClick={() => openPicker(setShowTagPick)}
            aria-label="タグ"
          >
            {tagInfo ? (
              <>
                <Emoji char={tagInfo.emoji} size={16} /> {tagInfo.label}
              </>
            ) : (
              '＋ タグ'
            )}
          </button>

          {/* 日付（左ページのみ・タップで西暦/和暦切替） */}
          {!isRight && (
            <button
              className={`page-date ${nb.calendarMode}`}
              onClick={() => {
                const nextMode = nb.calendarMode === 'wareki' ? 'seireki' : 'wareki';
                onChange({
                  ...data,
                  notebooks: data.notebooks.map((x) =>
                    x.id === nb.id ? { ...x, calendarMode: nextMode } : x,
                  ),
                });
              }}
              aria-label="日付の 書きかた を 切替"
            >
              {formatDate(page.date, nb.calendarMode)}
              <small>（{weekdayJP(page.date)}）</small>
            </button>
          )}

          {/* 写真（上部） */}
          <div className="photo-slot">
            {currentPhoto ? (
              <div
                className={`framed frame-${currentFrame} mask-${maskColor}`}
                style={{
                  ['--photo-tilt' as string]: `${photoTilt}deg`,
                  ['--mask1-top' as string]: `${mask1Top}px`,
                  ['--mask1-left' as string]: `${mask1Left}px`,
                  ['--mask1-rot' as string]: `${mask1Rot}deg`,
                  ['--mask2-bottom' as string]: `${mask2Bottom}px`,
                  ['--mask2-right' as string]: `${mask2Right}px`,
                  ['--mask2-rot' as string]: `${mask2Rot}deg`,
                }}
                onClick={() => openPicker(setShowFramePick)}
              >
                <img src={currentPhoto} alt="" />
                <button
                  className="swipe-arrow left"
                  onClick={(e) => { e.stopPropagation(); cycleFrame(-1); }}
                  aria-label="フレーム前"
                >
                  ‹
                </button>
                <button
                  className="swipe-arrow right"
                  onClick={(e) => { e.stopPropagation(); cycleFrame(1); }}
                  aria-label="フレーム次"
                >
                  ›
                </button>
              </div>
            ) : (
              <label className="photo-add">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickPhoto}
                />
                <span>＋ しゃしん</span>
              </label>
            )}
          </div>

          {currentPhoto && (
            <input
              className="photo-caption"
              value={currentCaption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="ひとこと そえる…"
              maxLength={40}
            />
          )}

          {/* 一言（下部） */}
          <textarea
            className={`oneline${isOverLimit ? ' over' : ''}`}
            value={text}
            onChange={(e) => { setText(e.target.value); playWrite(); }}
            onBlur={commitText}
            placeholder={isRight ? 'もうすこし、書いてみる…' : 'きょうの ひとこと…'}
            rows={3}
          />
          <div className={`char-counter${isOverLimit ? ' over' : ''}`} aria-live="polite">
            {isOverLimit ? `${remaining}` : `${[...text].length} / ${MAX_TEXT_LEN}`}
          </div>

          {/* スタンプ（右ページの右下のみ） */}
          {isRight && (
            <button
              className={`stamp-slot${stampInfo ? '' : ' empty'}`}
              onClick={() => openPicker(setShowStampPick)}
              aria-label="きょうのスタンプ"
            >
              {stampInfo ? <Emoji char={stampInfo.label} size={32} /> : '＋'}
            </button>
          )}

          <span className={`page-num ${isRight ? 'right-num' : 'left-num'}`}>
            {page.date.split('-')[2]} ・ {isRight ? '右' : '左'}
          </span>
        </div>
      </div>

      <div className="page-actions">
        {currentPhoto && (
          <button className="ghost small" onClick={removePhoto}>
            しゃしんを 外す
          </button>
        )}
        <button className="link danger" onClick={() => setConfirmRemove(true)}>
          このページを削除
        </button>
      </div>

      {/* キャプチャ用の見開きレンダリング（画面外）— 印刷物風 */}
      <div ref={captureRef} className="capture-frame" aria-hidden="true">
        <span className="cap-corner cap-corner-tl" />
        <span className="cap-corner cap-corner-tr" />
        <span className="cap-corner cap-corner-bl" />
        <span className="cap-corner cap-corner-br" />
        <div className="capture-spread">
          {(['left', 'right'] as const).map((s) => {
            const ph = s === 'right' ? page.photoRight : page.photo;
            const fr = (s === 'right' ? page.frameRight : page.frame) ?? 'plain';
            const tx = s === 'right' ? (page.textRight ?? '') : page.text;
            const cap = s === 'right' ? (page.photoCaptionRight ?? '') : (page.photoCaption ?? '');
            return (
              <div key={s} className={`capture-page capture-${s}`}>
                {tagInfo && (
                  <span
                    className="cap-tag"
                    style={{ background: tagInfo.bg, color: tagInfo.ink }}
                  >
                    {tagInfo.emoji} {tagInfo.label}
                  </span>
                )}
                {s === 'left' && (
                  <div className={`cap-date ${nb.calendarMode}`}>
                    {formatDate(page.date, nb.calendarMode)}
                    <small>（{weekdayJP(page.date)}）</small>
                  </div>
                )}
                <div className="cap-photo">
                  {ph && (
                    <div className={`framed frame-${fr} mask-${(page.id.charCodeAt(0) + page.id.length + (s === 'right' ? 1 : 0)) % 4}`}>
                      <img src={ph} alt="" />
                    </div>
                  )}
                </div>
                {ph && cap && <div className="cap-caption">{cap}</div>}
                <div className="cap-text">{tx}</div>
                {s === 'right' && stampInfo && (
                  <div className="cap-stamp">{stampInfo.label}</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="capture-foot">
          <span className="cap-foot-title">{nb.title}</span>
          <span className="cap-foot-brand">ひびのしおり</span>
        </div>
      </div>

      {showTagPick && (
        <div className="sheet-bg" onClick={() => setShowTagPick(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>タグ</h3>
            <div className="tag-pick">
              {TAG_DEF.map((t) => (
                <button
                  key={t.key}
                  className={`tag-opt${page.tag === t.key ? ' on' : ''}`}
                  style={{ background: t.bg, color: t.ink }}
                  onClick={() => setTag(t.key)}
                >
                  <Emoji char={t.emoji} size={20} /> {t.label}
                </button>
              ))}
              {page.tag && (
                <button className="tag-opt clear" onClick={() => setTag(undefined)}>
                  外す
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showStampPick && (
        <div className="sheet-bg" onClick={() => setShowStampPick(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>きょうの空気</h3>
            <div className="stamp-pick">
              {STAMP_DEF.map((s) => (
                <button
                  key={s.key}
                  className={`stamp-opt${page.stamp === s.key ? ' on' : ''}`}
                  onClick={() => setStamp(s.key)}
                >
                  <Emoji char={s.label} size={34} />
                </button>
              ))}
              {page.stamp && (
                <button className="stamp-opt clear" onClick={() => setStamp(undefined)}>
                  外す
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showFramePick && (
        <div className="sheet-bg" onClick={() => setShowFramePick(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>しゃしんの ふち</h3>
            <div className="frame-pick">
              {FRAME_DEF.map((f) => (
                <button
                  key={f.key}
                  className={`frame-opt${page.frame === f.key ? ' on' : ''}`}
                  onClick={() => setFrame(f.key)}
                >
                  <span className={`frame-thumb frame-${f.key}`}>
                    <span className="thumb-img" />
                  </span>
                  <span className="frame-name">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPageMenu && (
        <div className="sheet-bg" onClick={() => setShowPageMenu(false)}>
          <div className="sheet page-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>このページ</h3>
            <div className="page-menu-list">
              <button
                className="page-menu-row"
                onClick={() => {
                  setShowPageMenu(false);
                  setShowFontPick(true);
                }}
              >
                <span className="pm-label">書きごこちの フォント</span>
                <span className="pm-value">
                  {WRITE_FONT_DEF.find((f) => f.key === writeFont)?.label ?? ''} ›
                </span>
              </button>
              <button
                className="page-menu-row"
                onClick={() => {
                  setShowPageMenu(false);
                  shareSpread();
                }}
                disabled={sharing}
              >
                <span className="pm-label">画像で 共有</span>
                <span className="pm-value">›</span>
              </button>
              <button
                className="page-menu-row danger"
                onClick={() => {
                  setShowPageMenu(false);
                  setConfirmRemove(true);
                }}
              >
                <span className="pm-label">このページを 削除</span>
                <span className="pm-value">›</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showFontPick && (
        <div className="sheet-bg" onClick={() => setShowFontPick(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>書きごこちの フォント</h3>
            <div className="font-pick">
              {WRITE_FONT_DEF.map((f) => (
                <button
                  key={f.key}
                  className={`font-opt${writeFont === f.key ? ' on' : ''}${f.locked ? ' locked' : ''}`}
                  onClick={() => pickFont(f.key)}
                  disabled={f.locked}
                  style={{ fontFamily: f.cssFamily }}
                >
                  <span className="font-name">
                    {f.label}
                    {f.locked && <small className="locked-mark">　🔒</small>}
                  </span>
                  <span className="font-sample" style={{ fontFamily: f.cssFamily }}>
                    {f.sample}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="このページを 削除しますか？"
          message={'書いた ことばや しゃしんは\nもう 見られなく なります。'}
          confirmLabel="削除する"
          cancelLabel="やめる"
          danger
          onConfirm={() => {
            setConfirmRemove(false);
            removePage();
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </div>
  );
}
