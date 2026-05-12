import { useState } from 'react';
import type { AppData, CoverTheme, Notebook } from '../types';
import { COVER_THEMES } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  data: AppData;
  onBack: () => void;
  onChange: (next: AppData) => void;
}

export default function NotebookManager({ data, onBack, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Notebook | null>(null);

  const updateNotebook = (id: string, patch: Partial<Notebook>) => {
    onChange({
      ...data,
      notebooks: data.notebooks.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
  };

  const confirmRemove = (id: string) => {
    const target = data.notebooks.find((n) => n.id === id);
    if (!target) return;
    setRemoveTarget(target);
  };

  const doRemove = (id: string) => {
    onChange({
      ...data,
      notebooks: data.notebooks.filter((n) => n.id !== id),
      pages: data.pages.filter((p) => p.notebookId !== id),
    });
  };

  const beginEdit = (nb: Notebook) => {
    setEditing(nb.id);
    setTitleDraft(nb.title);
  };

  const commitEdit = (id: string) => {
    const t = titleDraft.trim();
    if (t) updateNotebook(id, { title: t });
    setEditing(null);
  };

  return (
    <div className="manager-screen">
      <header className="appbar">
        <button className="link" onClick={onBack}>
          ← 本棚
        </button>
        <h1>ノートを 整える</h1>
        <span style={{ width: 60 }} />
      </header>

      {data.notebooks.length === 0 ? (
        <p className="empty">ノートが まだ ありません。</p>
      ) : (
        <ul className="manager-list">
          {data.notebooks.map((nb) => {
            const count = data.pages.filter((p) => p.notebookId === nb.id).length;
            const t = COVER_THEMES.find((c) => c.key === nb.cover)!;
            return (
              <li key={nb.id} className="manager-row">
                <div className="manager-head">
                  <span
                    className="manager-swatch"
                    style={{ background: t.bg, color: t.ink }}
                  >
                    本
                  </span>
                  {editing === nb.id ? (
                    <input
                      autoFocus
                      className="title-input"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => commitEdit(nb.id)}
                      onKeyDown={(e) => e.key === 'Enter' && commitEdit(nb.id)}
                      maxLength={40}
                    />
                  ) : (
                    <button className="manager-title" onClick={() => beginEdit(nb)}>
                      {nb.title}
                      <small> ・{count}ページ</small>
                    </button>
                  )}
                </div>

                <div className="manager-field">
                  <span>表紙</span>
                  <div className="covers">
                    {COVER_THEMES.map((c) => (
                      <button
                        key={c.key}
                        className={`cover-swatch${nb.cover === c.key ? ' on' : ''}`}
                        style={{ background: c.bg, color: c.ink }}
                        onClick={() => updateNotebook(nb.id, { cover: c.key as CoverTheme })}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="manager-actions">
                  <button className="link danger" onClick={() => confirmRemove(nb.id)}>
                    このノートを 削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {removeTarget && (
        <ConfirmDialog
          title="このノートを 削除しますか？"
          message={`「${removeTarget.title}」と、なかに ある\n${data.pages.filter((p) => p.notebookId === removeTarget.id).length} ページが 消えます。`}
          confirmLabel="削除する"
          cancelLabel="やめる"
          danger
          onConfirm={() => {
            const id = removeTarget.id;
            setRemoveTarget(null);
            doRemove(id);
          }}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
