import { useEffect, useRef, useState } from 'react';
import type { AppData, Page, Stamp } from '../types';
import { COVER_THEMES, STAMP_LIST } from '../types';
import { findNotebook, findPage, formatDateJP, weekdayJP } from '../storage';

interface Props {
  data: AppData;
  pageId: string;
  onBack: () => void;
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

export default function PageEditor({ data, pageId, onBack, onChange }: Props) {
  const page = findPage(data, pageId);
  const nb = page ? findNotebook(data, page.notebookId) : undefined;
  const [tagInput, setTagInput] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // autosave on text change is implemented via patch()
  const [text, setText] = useState(page?.text ?? '');

  useEffect(() => {
    setText(page?.text ?? '');
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

  const toggleStamp = (s: Stamp) => {
    const has = page.stamps.includes(s);
    patch({ stamps: has ? page.stamps.filter((x) => x !== s) : [...page.stamps, s] });
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t) return;
    if (page.tags.includes(t)) {
      setTagInput('');
      return;
    }
    patch({ tags: [...page.tags, t] });
    setTagInput('');
  };

  const removeTag = (t: string) => patch({ tags: page.tags.filter((x) => x !== t) });

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

  return (
    <div className="page-screen" style={{ background: theme.bg, color: theme.ink }}>
      <header className="appbar">
        <button className="link" onClick={() => { commitText(); onBack(); }}>
          ← もどる
        </button>
        <h1>{formatDateJP(page.date)} <small>（{weekdayJP(page.date)}）</small></h1>
        <button
          className={`link star-toggle${page.highlight ? ' on' : ''}`}
          onClick={() => patch({ highlight: !page.highlight })}
          aria-label="ハイライト"
        >
          ★
        </button>
      </header>

      <div className="paper">
        <textarea
          className="page-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          placeholder="きょうの ことを 書く…"
          rows={10}
        />

        <div className="stamps">
          {STAMP_LIST.map((s) => (
            <button
              key={s.key}
              className={`stamp-btn${page.stamps.includes(s.key) ? ' on' : ''}`}
              onClick={() => toggleStamp(s.key)}
              aria-label={s.key}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="photo-area">
          {page.photo ? (
            <div className="photo-wrap">
              <img src={page.photo} alt="" />
              <button className="ghost small" onClick={removePhoto}>
                しゃしんを 外す
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
              <span>＋ しゃしんを 入れる</span>
            </label>
          )}
        </div>

        <div className="tags">
          {page.tags.map((t) => (
            <button key={t} className="tag" onClick={() => removeTag(t)}>
              #{t} <span className="x">×</span>
            </button>
          ))}
          <input
            className="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="タグ"
            maxLength={20}
          />
        </div>
      </div>

      <div className="page-actions">
        <button className="link danger" onClick={removePage}>
          このページを削除
        </button>
      </div>
    </div>
  );
}
