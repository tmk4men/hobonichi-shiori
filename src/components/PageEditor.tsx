import { useEffect, useRef, useState } from 'react';
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
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PageEditor({ data, pageId, onBack, onOpenPage, onChange }: Props) {
  const page = findPage(data, pageId);
  const nb = page ? findNotebook(data, page.notebookId) : undefined;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(page?.text ?? '');
  const [showTagPick, setShowTagPick] = useState(false);
  const [showStampPick, setShowStampPick] = useState(false);
  const [showFramePick, setShowFramePick] = useState(false);
  const [flipDir, setFlipDir] = useState<'none' | 'next' | 'prev'>('none');

  useEffect(() => {
    setText(page?.text ?? '');
    setShowTagPick(false);
    setShowStampPick(false);
    setShowFramePick(false);
    const t = setTimeout(() => setFlipDir('none'), 280);
    // 開いたときに view 加算（一度だけ）
    onChange(incrementView(data, pageId));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

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

  const patch = (changes: Partial<Page>) => {
    onChange({
      ...data,
      pages: data.pages.map((p) =>
        p.id === pageId ? { ...p, ...changes, updatedAt: Date.now() } : p,
      ),
    });
  };

  const commitText = () => {
    if (text !== page.text) patch({ text });
  };

  const setTag = (t: Tag | undefined) => {
    patch({ tag: t });
    setShowTagPick(false);
  };
  const setStamp = (s: Stamp | undefined) => {
    patch({ stamp: s });
    setShowStampPick(false);
  };
  const setFrame = (f: PhotoFrame) => {
    patch({ frame: f });
    setShowFramePick(false);
  };

  const cycleFrame = (dir: 1 | -1) => {
    const i = FRAME_DEF.findIndex((f) => f.key === page.frame);
    const n = (i + dir + FRAME_DEF.length) % FRAME_DEF.length;
    patch({ frame: FRAME_DEF[n].key });
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let dataUrl = await compressImage(file, 1280, 0.78);
      if (dataUrl.length > MAX_PHOTO_BYTES) {
        dataUrl = await compressImage(file, 960, 0.7);
      }
      patch({ photo: dataUrl });
    } catch (err) {
      console.error(err);
      alert('しゃしんを 読み込めませんでした。');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const removePhoto = () => patch({ photo: undefined });

  const removePage = () => {
    if (!confirm('このページを 削除します。よろしいですか？')) return;
    onChange({ ...data, pages: data.pages.filter((p) => p.id !== pageId) });
    onBack();
  };

  const goNext = () => {
    if (!nextPage) return;
    commitText();
    setFlipDir('next');
    setTimeout(() => onOpenPage(nextPage.id), 140);
  };
  const goPrev = () => {
    if (!prevPage) return;
    commitText();
    setFlipDir('prev');
    setTimeout(() => onOpenPage(prevPage.id), 140);
  };

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
          <button className="pager" onClick={goPrev} disabled={!prevPage} aria-label="前">‹</button>
          <button className="pager" onClick={goNext} disabled={!nextPage} aria-label="次">›</button>
        </span>
        <button
          className={`link star-toggle${page.highlight ? ' on' : ''}`}
          onClick={() => patch({ highlight: !page.highlight })}
          aria-label="ハイライト"
        >
          ★
        </button>
      </header>

      <div className="paper-spread">
        <span className="spread-gutter" aria-hidden="true" />

        <div className="paper-side paper-left">
          {/* 付箋（左ページ左上） */}
          <button
            className={`sticky-tag${tagInfo ? '' : ' empty'}`}
            style={tagInfo ? { background: tagInfo.bg, color: tagInfo.ink } : undefined}
            onClick={() => setShowTagPick(true)}
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

          {/* 日付（左ページ上部・タップで西暦/和暦切替） */}
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

          {/* 写真（左ページ中央） */}
          <div className="photo-slot">
            {page.photo ? (
              <div
                className={`framed frame-${page.frame} mask-${(page.id.charCodeAt(0) + page.id.length) % 4}`}
                onClick={() => setShowFramePick(true)}
              >
                <img src={page.photo} alt="" />
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

          <span className="page-num left-num">{page.date.split('-')[2]}</span>
        </div>

        <div className="paper-side paper-right">
          {/* 一言（右ページ） */}
          <textarea
            className="oneline"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            placeholder="きょうの ひとこと…"
            maxLength={200}
            rows={6}
          />

          {/* スタンプ（右ページ右下） */}
          <button
            className={`stamp-slot${stampInfo ? '' : ' empty'}`}
            onClick={() => setShowStampPick(true)}
            aria-label="きょうのスタンプ"
          >
            {stampInfo ? <Emoji char={stampInfo.label} size={32} /> : '＋'}
          </button>

          <span className="page-num right-num">{page.date.split('-')[2]}</span>
        </div>
      </div>

      <div className="page-actions">
        {page.photo && (
          <button className="ghost small" onClick={removePhoto}>
            しゃしんを 外す
          </button>
        )}
        <button className="link danger" onClick={removePage}>
          このページを削除
        </button>
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
    </div>
  );
}
