import { useState } from 'react';
import { isMuted, setMuted } from '../sfx';

interface Props {
  hasPassword: boolean;
  onClose: () => void;
  onShowHighlights: () => void;
  onShowNotebookManager: () => void;
  onShowPassword: () => void;
  onShowCredits: () => void;
}

export default function Menu({
  hasPassword,
  onClose,
  onShowHighlights,
  onShowNotebookManager,
  onShowPassword,
  onShowCredits,
}: Props) {
  const [muted, setMutedState] = useState(isMuted());
  const toggleSound = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet menu-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>めにゅう</h3>
        <ul className="menu-list">
          <li>
            <button
              className="menu-item"
              onClick={() => {
                onClose();
                onShowHighlights();
              }}
            >
              <span className="menu-mark">⌂</span>
              <span className="menu-label">ハイライト</span>
              <span className="menu-sub">忘れていた日と、再会する。</span>
            </button>
          </li>
          <li>
            <button
              className="menu-item"
              onClick={() => {
                onClose();
                onShowNotebookManager();
              }}
            >
              <span className="menu-mark">▤</span>
              <span className="menu-label">ノートを 整える</span>
              <span className="menu-sub">名前 / 表紙 / 削除</span>
            </button>
          </li>
          <li>
            <button
              className="menu-item"
              onClick={() => {
                onClose();
                onShowPassword();
              }}
            >
              <span className="menu-mark">⌷</span>
              <span className="menu-label">かぎ ({hasPassword ? 'オン' : 'オフ'})</span>
              <span className="menu-sub">
                {hasPassword
                  ? 'ひらく とき、4けたを 聞く。'
                  : '必要なときだけ、4けたを 設定。'}
              </span>
            </button>
          </li>
          <li>
            <button className="menu-item" onClick={toggleSound}>
              <span className="menu-mark">♪</span>
              <span className="menu-label">音 ({muted ? 'オフ' : 'オン'})</span>
              <span className="menu-sub">紙の音、ペン先、スタンプの音。</span>
            </button>
          </li>
          <li>
            <button
              className="menu-item"
              onClick={() => {
                onClose();
                onShowCredits();
              }}
            >
              <span className="menu-mark">©</span>
              <span className="menu-label">クレジット</span>
              <span className="menu-sub">音や フォントの ありがとう。</span>
            </button>
          </li>
        </ul>
        <div className="modal-actions">
          <span style={{ flex: 1 }} />
          <button className="ghost" onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
